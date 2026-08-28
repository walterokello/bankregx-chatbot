// pages/api/ask.js
export const config = { runtime: "nodejs" };

import OpenAI from "openai";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
} from "firebase/firestore";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function buildBaseUrlFromRequest(req) {
  // Vercel sets these headers reliably
  const proto = (req.headers["x-forwarded-proto"] || "https").toString();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").toString();
  return `${proto}://${host}`;
}

async function braveSearch(queryText, count = 5) {
  if (!process.env.BRAVE_SEARCH_API_KEY) {
    return { results: [], error: "Missing BRAVE_SEARCH_API_KEY" };
  }

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", queryText);
  url.searchParams.set("count", String(Math.min(count, 10)));

  const resp = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    return { results: [], error: `Search failed: ${resp.status} ${clean(text).slice(0, 200)}` };
  }

  const data = await resp.json();
  const results = (data?.web?.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }));

  return { results, error: null };
}

async function browseUrl(req, targetUrl) {
  const base = buildBaseUrlFromRequest(req);
  const u = new URL("/api/browse", base);
  u.searchParams.set("url", targetUrl);
  u.searchParams.set("maxChars", "12000");

  const resp = await fetch(u.toString(), { headers: { Accept: "application/json" } });

  const text = await resp.text().catch(() => "");
  if (!resp.ok) {
    return {
      ok: false,
      status: resp.status,
      error: `browse failed (${resp.status})`,
      bodyPreview: text.slice(0, 500),
      url: u.toString(),
    };
  }

  // parse JSON safely
  try {
    const data = JSON.parse(text);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      status: 500,
      error: "browse returned non-JSON",
      bodyPreview: text.slice(0, 500),
      url: u.toString(),
    };
  }
}

function buildWebContext(searchResults, browsedPages) {
  const lines = [];

  lines.push("SEARCH RESULTS:");
  (searchResults || []).slice(0, 5).forEach((r, i) => {
    lines.push(
      `(${i + 1}) ${clean(r.title)}\nSnippet: ${clean(r.description)}\nLink: ${clean(r.url)}`
    );
  });

  lines.push("\nBROWSED PAGES (extracted text):");
  (browsedPages || []).forEach((p, i) => {
    lines.push(
      `(${i + 1}) ${clean(p.title) || "Untitled"}\nLink: ${clean(p.url)}\nText: ${clean(p.text)}`
    );
  });

  return lines.join("\n\n");
}

async function getChatGPTResponse(messages) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.2,
    max_tokens: 900,
  });

  return response.choices?.[0]?.message?.content?.trim() || "";
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { query: userQuery, userId } = req.body || {};
    if (!userQuery || !userId) {
      return res.status(400).json({ message: "Query and userId are required" });
    }

    // 1) Load recent chat history (don’t fail the whole request if it errors)
    let pastMessages = [];
    try {
      const chatQuery = query(
        collection(db, "chat_history"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const snap = await getDocs(chatQuery);
      const turns = [];
      snap.forEach((doc) => turns.push(doc.data()));
      turns.reverse();

      for (const t of turns) {
        if (t.userMessage) pastMessages.push({ role: "user", content: String(t.userMessage) });
        if (t.aiResponse) pastMessages.push({ role: "assistant", content: String(t.aiResponse) });
      }
    } catch (e) {
      console.error("History load failed:", e);
      // keep going
    }

    // 2) Search
    const { results: searchResults, error: searchError } = await braveSearch(String(userQuery), 5);

    // 3) Browse top URLs
    const topUrls = (searchResults || [])
      .map((r) => r.url)
      .filter(Boolean)
      .slice(0, 2);

    const browsedPages = [];
    const browseDebug = [];

    for (const u of topUrls) {
      const br = await browseUrl(req, u);
      if (br.ok) {
        browsedPages.push(br.data);
      } else {
        browseDebug.push(br);
      }
    }

    const webContext = buildWebContext(searchResults, browsedPages);

    const systemMessage = {
      role: "system",
      content: `
You are a helpful Compliance and Audit assistant, helping people to understand how to design controls in financial services firms, crafting your response so people understand the five Ws and the H of controls, i.e., Who, What, Why, When, Where and How. You have access to live internet information via:
- SEARCH RESULTS (snippets + links)
- BROWSED PAGES (full extracted readable text + links)

Rules:
- Prefer BROWSED PAGES for accuracy.
- Cite sources as (WEB #N) where N refers to the BROWSED PAGES list item number.
- If the browsed pages do not contain the answer, say so. Then provide best-effort general guidance.
- Do not invent claims, dates, or citations.

INTERNET CONTEXT:
${webContext}

Search note: ${searchError ? searchError : "Search succeeded."}
`.trim(),
    };

    const messages = [
      systemMessage,
      ...pastMessages,
      { role: "user", content: String(userQuery) },
    ];

    // 4) LLM response
    const aiResponse = await getChatGPTResponse(messages);

    // 5) Save chat (don’t fail the response if logging fails)
    try {
      await addDoc(collection(db, "chat_history"), {
        userId,
        userMessage: userQuery,
        aiResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed saving chat_history:", e);
    }

    return res.status(200).json({
      answer: aiResponse,
      browsedPages: browsedPages.map((p) => ({ url: p.url, title: p.title })),
      // helpful during debugging; you can remove later:
      debug: { browseDebug, baseUrl: buildBaseUrlFromRequest(req) },
    });
  } catch (error) {
    console.error("❌ /api/ask fatal error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      stack: error.stack,
    });
  }
}
