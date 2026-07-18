import Parser from "rss-parser";

export default async function handler(req, res) {
  const parser = new Parser();
  const feeds = [
    { name: "FCA", url: "https://www.fca.org.uk/news/rss.xml" },
    { name: "Federal Reserve", url: "https://www.federalreserve.gov/feeds/press_all.xml" },
    { name: "ECB", url: "https://www.ecb.europa.eu/rss/press.xml" }
  ];

  try {
    const allFeeds = await Promise.all(
      feeds.map(async (feed) => {
        const parsed = await parser.parseURL(feed.url);
        return { name: feed.name, items: parsed.items.slice(0, 5) };
      })
    );
    res.status(200).json(allFeeds);
  } catch (error) {
    console.error("RSS fetch error:", error);
    res.status(500).json({ error: "Failed to fetch RSS feeds" });
  }
}
