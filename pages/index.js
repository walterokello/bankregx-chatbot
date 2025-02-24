import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query as firestoreQuery,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc
} from "firebase/firestore";

export default function Home() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [userId, setUserId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId") || generateUserId();
    setUserId(storedUserId);
    fetchChatHistory(storedUserId);
  }, []);

  const generateUserId = () => {
    const newUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("userId", newUserId);
    return newUserId;
  };

  const fetchChatHistory = async (userId) => {
    try {
      console.log(`🟢 Fetching chat history for user: ${userId}`);
      const chatQuery = firestoreQuery(
        collection(db, "chat_history"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(chatQuery);
      const pastChats = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        userMessage: doc.data().userMessage,
        aiResponse: doc.data().aiResponse,
        timestamp: doc.data().timestamp || "No timestamp",
      }));

      setChatHistory(pastChats);
    } catch (error) {
      console.error("❌ Error fetching chat history:", error);
    }
  };

  const askAI = async () => {
    if (!query.trim()) return;
    setResponse("Thinking...");
    setFeedback(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch AI response");
      }

      setResponse(data.answer);
      fetchChatHistory(userId);
    } catch (error) {
      console.error("❌ Error fetching AI response:", error);
      setResponse(`Error: ${error.message}`);
    }
  };

  const sendFeedback = async (type) => {
    setFeedback(type);
    alert(`Feedback recorded: ${type}`);

    try {
      if (!userId || !query || !response) {
        throw new Error("Invalid Firestore data: Missing required fields");
      }

      await addDoc(collection(db, "feedback"), {
        userId,
        query: query,
        response: response,
        feedback: type,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error saving feedback:", error);
    }
  };

  const examplePrompts = [
    "What are the compliance requirements for investment banking?",
    "How does Basel III impact risk management?",
    "What are the key regulations for consumer banking?",
    "Explain KYC and AML processes.",
    "How do stress tests work in banking?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "Arial, sans-serif" }}>

      {/* ✅ Header with Logo */}
      <header style={{ display: "flex", alignItems: "center", padding: "10px 20px", backgroundColor: "#D3D3D3", borderBottom: "2px solid #bbb" }}>
        <img src="/bankregx-logo.png" alt="BankRegX Logo" style={{ height: "50px", marginRight: "10px" }} />
        <h1 style={{ color: "#333", fontSize: "24px", margin: 0 }}>BankRegX AI Compliance Assistant</h1>
      </header>

      {/* ✅ Main Content */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* ✅ Sidebar with collapsible functionality */}
        <div style={{
          width: sidebarOpen ? "250px" : "50px",
          backgroundColor: "#D3D3D3",
          padding: "10px",
          transition: "width 0.3s ease-in-out",
          borderRight: "2px solid #bbb",
          overflow: "hidden"
        }}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            style={{ backgroundColor: "#666", color: "#FFF", border: "none", padding: "5px", cursor: "pointer", width: "100%" }}
          >
            {sidebarOpen ? "⬅ Hide" : "➡ Show"}
          </button>

          {sidebarOpen && (
            <div>
              <h3>Example Prompts</h3>
              <ul style={{ padding: "10px", listStyle: "none" }}>
                {examplePrompts.map((prompt, index) => (
                  <li key={index} 
                      style={{ cursor: "pointer", marginBottom: "10px", color: "#333", backgroundColor: "#eee", padding: "5px", borderRadius: "5px" }} 
                      onClick={() => setQuery(prompt)}
                  >
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ✅ Chat Section */}
        <div style={{ flex: 1, textAlign: "center", padding: "50px" }}>
          <input
            type="text"
            placeholder="Ask about banking compliance..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "80%", padding: "10px", marginBottom: "10px", border: "1px solid #999" }}
          />
          <button onClick={askAI} style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#FFA500", color: "#000", border: "none", fontWeight: "bold" }}>
            Ask AI
          </button>

          {/* ✅ AI Response Box */}
          <div
            style={{
              marginTop: "20px",
              backgroundColor: "#f4f4f4",
              padding: "10px",
              borderRadius: "5px",
              maxHeight: "200px",
              overflowY: "auto",
              color: "#333",
            }}
          >
            {response || "Ask a question to get started!"}
          </div>

          {/* ✅ Feedback Buttons */}
          {response && (
            <div style={{ marginTop: "10px" }}>
              <p>Was this response helpful?</p>
              <button onClick={() => sendFeedback("👍 Yes")} style={{ marginRight: "10px", padding: "5px 10px", backgroundColor: "#008000", color: "#FFFFFF", border: "none" }}>👍 Yes</button>
              <button onClick={() => sendFeedback("👎 No")} style={{ padding: "5px 10px", backgroundColor: "#FF0000", color: "#FFFFFF", border: "none" }}>👎 No</button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Footer with Contact & LinkedIn */}
      <footer style={{ backgroundColor: "#D3D3D3", padding: "10px", textAlign: "center", borderTop: "2px solid #bbb" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>
          Created by compliance and audit professionals. Contact us at: 
          <a href="mailto:contact@bankregx.com" style={{ color: "#007BFF", textDecoration: "none", fontWeight: "bold" }}> contact@bankregx.com</a> |
          <a href="https://www.linkedin.com/company/bankregx/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: "10px", color: "#007BFF", fontWeight: "bold" }}>Follow us on LinkedIn</a>
        </p>
      </footer>

    </div>
  );
}
