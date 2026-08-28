import { useState } from "react";

export default function APIDocs() {
  const [isDocsOpen, setIsDocsOpen] = useState(true);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", backgroundColor: "#D3D3D3", borderBottom: "2px solid #bbb" }}>
        <h1 style={{ color: "#333", margin: 0 }}>BankRegX API Documentation</h1>
        <nav>
          <a href="/" style={{ textDecoration: "none", color: "#007BFF", fontWeight: "bold", fontSize: "18px" }}>⬅ Back to Home</a>
        </nav>
      </header>

      <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#fff", borderRadius: "5px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}>
        <button onClick={() => setIsDocsOpen(!isDocsOpen)} style={{ padding: "10px", backgroundColor: "#007BFF", color: "#fff", border: "none", fontSize: "18px", width: "100%", textAlign: "left" }}>
          API Documentation
        </button>

        {isDocsOpen && (
          <div>
            <h2 style={{ color: "#555" }}>1️⃣ Ask AI a Compliance Question</h2>
            <p><strong>POST</strong> <code>/api/ask</code></p>
            <p><strong>Description:</strong> Submit a compliance-related query to the AI chatbot and receive a response.</p>
            <h4>📌 Request Body (JSON):</h4>
            <pre style={{ backgroundColor: "#f4f4f4", padding: "10px" }}>{`{
  "query": "What are the Basel III regulations?",
  "userId": "user_12345"
}`}</pre>
            <h4>📌 Response Example:</h4>
            <pre style={{ backgroundColor: "#f4f4f4", padding: "10px" }}>{`{
  "answer": "Basel III is a set of international banking regulations aimed at improving financial stability."
}`}</pre>

            <h2 style={{ color: "#555", marginTop: 24 }}>2️⃣ Submit Site Feedback</h2>
            <p><strong>POST</strong> <code>/api/site-feedback</code></p>
            <p><strong>Description:</strong> Submit overall feedback with optional consent to publish as a testimonial.</p>
            <h4>📌 Request Body (JSON):</h4>
            <pre style={{ backgroundColor: "#f4f4f4", padding: "10px" }}>{`{
  "userId": "user_12345",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "organization": "BankCo",
  "role": "Compliance Officer",
  "rating": 5,
  "comments": "Excellent summaries of FCA updates.",
  "consentToPublish": true,
  "allowContact": true
}`}</pre>
            <h4>📌 Response:</h4>
            <pre style={{ backgroundColor: "#f4f4f4", padding: "10px" }}>{`{ "message": "Feedback submitted." }`}</pre>

            <h2 style={{ color: "#555", marginTop: 24 }}>3️⃣ Public Testimonials (Approved)</h2>
            <p><strong>GET</strong> <code>/api/testimonials</code></p>
            <p><strong>Description:</strong> Returns the latest approved testimonials.</p>
          </div>
        )}
      </div>

      <footer style={{ marginTop: "30px", padding: "10px", backgroundColor: "#D3D3D3", textAlign: "center" }}>
        <p>📩 Contact us at <a href="mailto:contact@bankregx.com" style={{ color: "#007BFF", fontWeight: "bold" }}>contact@bankregx.com</a></p>
      </footer>
    </div>
  );
}
