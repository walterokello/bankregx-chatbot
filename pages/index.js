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
  const [chatHistory, setChatHistory] = useState([]);  // Store chat history
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([
    "What are the Basel III regulations?",
    "How does Basel III impact risk management?",
    "What are the KYC and AML processes?",
    "How do stress tests work in banking?",
    "What are the compliance requirements for investment banking?",
    "Can you explain the role of the Federal Reserve in financial regulation?",
    "What is the role of the FCA in financial regulation?",
    "How does the ECB regulate financial institutions in the EU?"
  ]);
  const [feedback, setFeedback] = useState(null);  // Define feedback state

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId") || generateUserId();
    setUserId(storedUserId);
    fetchChatHistory(storedUserId);  // Fetch past chat history on page load
  }, []);

  const generateUserId = () => {
    const newUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("userId", newUserId);
    return newUserId;
  };

  const fetchChatHistory = async (userId) => {
    try {
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
      setChatHistory(pastChats);  // Update chat history state
    } catch (error) {
      console.error("❌ Error fetching chat history:", error);
    }
  };

  const askAI = async () => {
    if (!query.trim()) return;
    setResponse("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch AI response");

      setResponse(data.answer);
      setChatHistory([...chatHistory, { userMessage: query, aiResponse: data.answer }]);  // Update chat history with the new data

    } catch (error) {
      console.error("❌ Error fetching AI response:", error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change and filter suggestions based on input
  const handleInputChange = (e) => {
    const input = e.target.value;
    setQuery(input);

    // Filter suggestions based on input
    const filteredSuggestions = allSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(input.toLowerCase())
    );
    setSuggestions(filteredSuggestions);
  };

  // Handle selecting a suggestion
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);  // Clear suggestions after selection
  };

  // Handle key press (Enter key to trigger search)
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      askAI();  // Trigger the search when Enter key is pressed
    }
  };

  // Handle feedback (thumbs up/down)
  const sendFeedback = async (type) => {
    try {
      if (!userId || !query || !response) throw new Error("Missing required fields");

      // Save feedback to Firestore
      await addDoc(collection(db, "feedback"), {
        userId,
        query,
        response,
        feedback: type,
        timestamp: new Date().toISOString(),
      });

      // Set feedback state
      setFeedback(type);
      alert(`Feedback recorded: ${type}`);
    } catch (error) {
      console.error("❌ Error saving feedback:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "Arial, sans-serif", backgroundColor: "#f7f8f9" }}>
      {/* Banner */}
      <div style={{
        backgroundColor: "#FF9800", // orange banner color
        padding: "10px",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "16px",
        color: "#fff"
      }}>
        The #1 Audit and Assurance AI Assistant in the world - 1.5K users a month!
      </div>

      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        backgroundColor: "#0073b1",
        color: "#fff"
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/bankregx-logo.png" alt="BankRegX Logo" style={{ height: "40px", marginRight: "15px" }} />
          <h1 style={{ margin: 0, fontSize: "24px" }}>BankRegX Audit and Assurance AI Assistant</h1>
        </div>
        <nav>
          <a href="/docs" style={{ textDecoration: "none", color: "#fff", fontWeight: "bold", fontSize: "18px", marginRight: "15px" }}>API Docs</a>
          <a href="/regulatory-news" style={{ textDecoration: "none", color: "#fff", fontWeight: "bold", fontSize: "18px" }}>Regulatory News</a>
        </nav>
      </header>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        {/* Chat Input */}
        <div style={{ position: "relative", width: "80%", maxWidth: "600px" }}>
          <input
            type="text"
            placeholder="Ask about banking compliance..."
            value={query}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}  // Add the key press event to trigger search on Enter
            style={{
              width: "100%",
              padding: "12px 15px",
              fontSize: "16px",
              marginBottom: "15px",
              borderRadius: "5px",
              border: "1px solid #ccc"
            }}
          />
          {suggestions.length > 0 && (
            <ul style={{
              position: "absolute",
              top: "45px",
              left: "0",
              width: "100%",
              backgroundColor: "#fff",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
              margin: "0",
              padding: "0",
              listStyle: "none",
              zIndex: "10"
            }}>
              {suggestions.map((suggestion, index) => (
                <li key={index} style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #ddd"
                }} onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={askAI}
          style={{
            padding: "12px 20px",
            cursor: "pointer",
            backgroundColor: "#0073b1",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold"
          }}
        >
          Ask AI
        </button>

        {/* Loading Indicator */}
        {loading && <p style={{ marginTop: "10px" }}>🔄 Loading...</p>}

        {/* AI Response Box */}
        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff", borderRadius: "5px", minHeight: "100px", width: "80%", maxWidth: "600px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}>
          {response || "Ask a question to get started!"}
        </div>

        {/* Thumbs Up / Down Feedback */}
        {response && (
          <div style={{ marginTop: "15px" }}>
            <p>Was this response helpful?</p>
            <button onClick={() => sendFeedback("👍 Yes")} style={{ marginRight: "10px", padding: "8px 15px", backgroundColor: "#008000", color: "#FFFFFF", border: "none" }}>👍 Yes</button>
            <button onClick={() => sendFeedback("👎 No")} style={{ padding: "8px 15px", backgroundColor: "#FF0000", color: "#FFFFFF", border: "none" }}>👎 No</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: "#0073b1", color: "#fff", padding: "15px", textAlign: "center" }}>
        <p>📩 Contact us at <a href="mailto:contact@bankregx.com" style={{ color: "#fff", fontWeight: "bold" }}>contact@bankregx.com</a></p>
      </footer>
    </div>
  );
}
