import OpenAI from "openai";
import { db } from "../../lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, addDoc } from "firebase/firestore";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getChatGPTResponse(pastMessages, userQuery) {
  try {
    // Combine the past messages with the new user query as context for the AI model
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Use the appropriate GPT model here (gpt-3.5-turbo or gpt-4o)
      messages: [...pastMessages, { role: "user", content: userQuery }],
      max_tokens: 500,
    });

    // Extract the AI's response from the API
    const aiResponse = response.choices[0].message.content.trim();
    return aiResponse;
  } catch (error) {
    console.error("Error while fetching response from OpenAI:", error);
    return "Sorry, I couldn't process your request at the moment. Please try again later.";
  }
}

async function fetchComplianceDataFromChatGPT() {
  const userQuery = "Can you provide the latest compliance updates on anti-money laundering regulations?";

  // Fetch the response from OpenAI's ChatGPT
  const aiResponse = await getChatGPTResponse([], userQuery);  // Empty array as context for this request

  return aiResponse;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { query: userQuery, userId } = req.body;
    if (!userQuery || !userId) return res.status(400).json({ message: "Query and userId are required" });

    // Retrieve the past conversation history for the user
    const chatQuery = query(
      collection(db, "chat_history"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const querySnapshot = await getDocs(chatQuery);
    const pastMessages = [];

    // Populate pastMessages with the last 10 messages from Firestore
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      pastMessages.unshift({ role: "user", content: data.userMessage });
      pastMessages.unshift({ role: "assistant", content: data.aiResponse });
    });

    // Fetch the latest regulatory updates from ChatGPT (can be part of the system message)
    const latestUpdates = await fetchComplianceDataFromChatGPT();

    // Add the system message for context to the AI
    pastMessages.push({
      role: "system",
      content: `
You are a banking compliance assistant with access to the latest regulatory updates, from the FCA, ECB, FED, Singapore regulator and other regulators. You work in accordance with the COSO and COBIT principals and ensure your responses to questions adhere to those frameworks; COSO is a framework for internal control, enterprise risk management, and financial reporting, while COBIT (Control Objectives for Information and Related Technologies) is a framework specifically for IT governance and management. When you respond to questions asking for controls, your frame you response to include the controls description framework which contains - Who, What, Why, When, Where, and How. When asked for the latest news on a topic, you search the web to obtain the information you need, specifically from regulator websites, the FT and the industry body websites.

Recent Regulatory Updates:
${latestUpdates}

Provide accurate, up-to-date responses including references to the latest regulations when available.
`,
    });

    // Pass the conversation history and the new query to the AI
    const aiResponse = await getChatGPTResponse(pastMessages, userQuery);

    // Save the new conversation to Firestore
    await addDoc(collection(db, "chat_history"), {
      userId,
      userMessage: userQuery,
      aiResponse,
      timestamp: new Date().toISOString(),
    });

    // Send the AI response back to the client
    res.status(200).json({ answer: aiResponse, chatHistory: pastMessages });

  } catch (error) {
    console.error("❌ Error handling the request:", error);

    // Log error to Firestore for debugging
    await addDoc(collection(db, "error_logs"), {
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      message: "Internal server error, but don't worry! The bot is still working.",
      error: error.message,
    });
  }
}
