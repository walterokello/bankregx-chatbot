// pages/api/browse.js
export const config = { runtime: "nodejs" };

function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function stripHtmlToText(html) {
  // Remove scripts/styles/noscript/svg
  let x = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ");

  // Keep paragraph-ish breaks
  x = x
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // Remove remaining tags
  x = x.replace(/<[^>]+>/g, " ");

  // Decode a few common entities
  x = x
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  // Normalize whitespace/newlines
  x = x.replace(/\n{3,}/g, "\n\n");
  x = x.replace(/[ \t]{2,}/g, " ");

  return clean(x);
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? clean(m[1]) : "";
}

function isAllowedUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (!["http:", "https:"].includes(u.protocol)) return false;

    const host = u.hostname.toLowerCase();
    if (host === "localhost") return false;
    if (host.startsWith("127.")) return false;
    if (host === "0.0.0.0") return false;
    if (host.endsWith(".local")) return false;

    return true;
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (BankRegXBot/1.0; +https://www.bankregx.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  const url = (req.query.url || "").toString().trim();
  const maxChars = Math.min(parseInt(req.query.maxChars || "12000", 10) || 12000, 30000);

  if (!url) return res.status(400).json({ message: "Missing url" });
  if (!isAllowedUrl(url)) return res.status(400).json({ message: "URL not allowed" });

  try {
    const resp = await fetchWithTimeout(url, 10000);

    if (!resp.ok) {
      return res.status(502).json({
        message: "Failed to fetch page",
        status: resp.status,
        statusText: resp.statusText,
      });
    }

    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return res.status(415).json({
        message: "Only text/html is supported right now",
        contentType,
      });
    }

    const html = await resp.text();
    const title = extractTitle(html);
    const text = stripHtmlToText(html);

    const clipped = text.length > maxChars;
    const outputText = clipped ? text.slice(0, maxChars) : text;

    return res.status(200).json({
      url,
      title,
      text: outputText,
      length: text.length,
      clipped,
    });
  } catch (e) {
    const msg = e?.name === "AbortError" ? "Fetch timed out" : e.message;
    return res.status(500).json({ message: "Browse error", error: msg });
  }
}
