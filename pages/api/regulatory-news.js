// pages/api/regulatory-news.js
import Parser from 'rss-parser';

const parser = new Parser();
const feeds = [
  { name: "Federal Reserve", url: "https://www.federalreserve.gov/feeds/press_all.xml" },
  { name: "FCA", url: "https://www.fca.org.uk/news/rss.xml" },
  { name: "ECB", url: "https://www.ecb.europa.eu/rss/press.html" },
  // Add PRA feed if available
];

export default async function handler(req, res) {
  try {
    const results = await Promise.all(feeds.map(async (feed) => {
      const data = await parser.parseURL(feed.url);
      return { source: feed.name, items: data.items.slice(0, 5) }; // Limit to 5 latest
    }));
    res.status(200).json(results);
  } catch (error) {
    console.error("❌ Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch regulatory news." });
  }
}
