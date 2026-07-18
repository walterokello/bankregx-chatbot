// lib/rssFetcher.js

import Parser from "rss-parser";
import { db, collection, addDoc, getDocs, query, orderBy, limit } from "./firebase";

const parser = new Parser();

const rssFeeds = [
  { name: "FCA", url: "https://www.fca.org.uk/news/rss.xml" },
  { name: "PRA", url: "https://www.bankofengland.co.uk/rss/news" },
  { name: "FED", url: "https://www.federalreserve.gov/feeds/press_all.xml" },
  { name: "ECB", url: "https://www.ecb.europa.eu/rss/press.html" }
];

export async function fetchAndStoreRegulatoryUpdates() {
  const allUpdates = [];

  for (const feed of rssFeeds) {
    try {
      const data = await parser.parseURL(feed.url);
      const filteredItems = data.items.slice(0, 5);
      
      const updates = filteredItems.map(item => `- ${item.title} (${new Date(item.pubDate).toLocaleDateString()}): ${item.link}`);
      
      if (updates.length) {
        allUpdates.push(`📰 **${feed.name} Highlights:**\n${updates.join("\n")}`);

        // ✅ Store in Firestore
        await addDoc(collection(db, "regulatory_updates"), {
          source: feed.name,
          headlines: updates,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`❌ Failed fetching ${feed.name}:`, error);
    }
  }

  return allUpdates.join("\n\n");
}

export async function getLatestStoredUpdates(limitItems = 10) {
  const updatesQuery = query(
    collection(db, "regulatory_updates"),
    orderBy("timestamp", "desc"),
    limit(limitItems)
  );
  const snapshot = await getDocs(updatesQuery);
  return snapshot.docs.map(doc => doc.data());
}
