// pages/api/testimonials.js
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Only show items that are explicitly approved
    const q = query(
      collection(db, "site_feedback"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json(items);
  } catch (error) {
    console.error("❌ testimonials error:", error);
    return res.status(500).json({ message: "Error fetching testimonials", error: error.message });
  }
}
