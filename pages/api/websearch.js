// pages/api/websearch.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  const q = (req.query.q || "").toString().trim();
  const count = Math.min(parseInt(req.query.count || "5", 10) || 5, 10);

  if (!q) return res.status(400).json({ message: "Missing q" });
  if (!process.env.BRAVE_SEARCH_API_KEY) {
    return res.status(500).json({ message: "Missing BRAVE_SEARCH_API_KEY" });
  }

  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", q);
    url.searchParams.set("count", String(count));

    const resp = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY,
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(resp.status).json({ message: "Search API error", details: text });
    }

    const data = await resp.json();
    const results = (data?.web?.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      age: r.age, // sometimes present
    }));

    return res.status(200).json({ query: q, results });
  } catch (e) {
    return res.status(500).json({ message: "Internal error", error: e.message });
  }
}
