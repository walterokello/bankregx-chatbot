import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Submit feedback on AI response
 *     description: Allows users to provide feedback on AI-generated responses to improve future interactions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Unique user identifier.
 *               aiResponse:
 *                 type: string
 *                 description: The AI-generated response that is being reviewed.
 *               feedback:
 *                 type: string
 *                 description: The feedback provided by the user (e.g., "👍 Yes" or "👎 No").
 *     responses:
 *       200:
 *         description: Feedback successfully submitted
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Error submitting feedback
 */

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

    // ✅ Store feedback with ISO string timestamp
    await addDoc(collection(db, "feedback"), {
      userId,
      aiResponse,
      feedback,
      timestamp: new Date().toISOString(), // ✅ Store timestamp as string
    });

    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("❌ Firestore Query Error:", error);

    // ✅ Log error in Firestore
    await addDoc(collection(db, "error_logs"), {
      userId,
      errorMessage: error.message,
      timestamp: new Date().toISOString(), // ✅ Store timestamp as string
    });

    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
}
