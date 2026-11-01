// pages/api/site-feedback.js
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      userId,
      name = "",
      comments,
      consentToPublish = false,
      allowContact = true,
    } = req.body || {};

    // Basic validation
    if (!comments || String(comments).trim().length === 0) {
      return res.status(400).json({ message: "Comments are required." });
    }

    const docData = {
      userId: userId || null,
      name: String(name).trim(),
      comments: String(comments).trim(),
      consentToPublish: Boolean(consentToPublish),
      allowContact: Boolean(allowContact),
      status: consentToPublish ? "pending_review" : "private", // if you want manual approval later
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "site_feedback"), docData);
    return res.status(200).json({ message: "Feedback submitted." });
  } catch (error) {
    console.error("❌ site-feedback error:", error);
    return res
      .status(500)
      .json({ message: "Error submitting feedback", error: error.message });
  }
}
