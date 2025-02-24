import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { userId, aiResponse, feedback } = req.body;
    if (!userId || !aiResponse || !feedback) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log("🟢 Storing feedback in Firestore...");

    await addDoc(collection(db, "feedback"), {
      userId,
      aiResponse,
      feedback,
      timestamp: new Date().toISOString(), // ✅ Store timestamp as string
    });

    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("❌ Firestore Query Error:", error);

    await addDoc(collection(db, "error_logs"), {
      userId,
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
}
