import OpenAI from "openai";
import { db } from "../../lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, addDoc } from "firebase/firestore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { query: userQuery, userId } = req.body;
    if (!userQuery || !userId) {
      return res.status(400).json({ message: "Query and userId are required" });
    }

    console.log(`🟢 Fetching chat history for user: ${userId}`);

    // ✅ Retrieve the last 10 chat history messages from Firestore
    const chatQuery = query(
      collection(db, "chat_history"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const querySnapshot = await getDocs(chatQuery);
    const pastMessages = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      pastMessages.unshift({ role: "user", content: data.userMessage });
      pastMessages.unshift({ role: "assistant", content: data.aiResponse });
    });

    pastMessages.push({ role: "user", content: userQuery });

    console.log("🟢 Sending messages to OpenAI:", pastMessages);

    // ✅ Call OpenAI API with chat history
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: pastMessages,
      max_tokens: 200,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No response from OpenAI");
    }

    const aiResponse = response.choices[0].message.content.trim();

    // ✅ Store conversation in Firestore as a string timestamp
    await addDoc(collection(db, "chat_history"), {
      userId,
      userMessage: userQuery,
      aiResponse,
      timestamp: new Date().toISOString(), // ✅ Store timestamp as string
    });

    res.status(200).json({ answer: aiResponse });
  } catch (error) {
    console.error("❌ Firestore Query Error:", error);

    await addDoc(collection(db, "error_logs"), {
      userId,
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ message: "Firestore query failed", error: error.message });
  }
}
