import { useState, useEffect } from "react";
import { useRouter } from 'next/router';

export default function RegulatoryNews() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // To navigate back to home page

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const res = await fetch("/api/regulatory-news");
        const data = await res.json();

        // Check if data is an array and contains the expected fields
        if (Array.isArray(data)) {
          setFeeds(data);
        } else {
          console.error("API response is not an array:", data);
          setFeeds([]); // Set to empty array if the response is not an array
        }
      } catch (err) {
        console.error("Failed to fetch regulatory news:", err);
        setFeeds([]); // Set to empty array in case of error
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "900px", margin: "auto", backgroundColor: "#f7f8f9" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 30px", backgroundColor: "#0073b1", color: "#fff" }}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>📢 Latest Regulatory Updates</h1>
        <nav>
          <button 
            onClick={() => router.push('/')} // Navigate to the home page
            style={{
              textDecoration: "none",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "18px",
              backgroundColor: "#0073b1",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            Back to Home
          </button>
        </nav>
      </header>

      {/* Loading State */}
      {loading ? (
        <p>🔄 Loading regulatory news...</p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {feeds.length > 0 ? (
            feeds.map((feed, index) => (
              <div key={index} style={{ marginBottom: "30px" }}>
                <h2 style={{ color: "#0073b1", fontSize: "20px", marginBottom: "10px" }}>
                  {feed.name} News
                </h2>
                <ul style={{ paddingLeft: "20px" }}>
                  {feed.items.map((item, idx) => {
                    const date = item.pubDate ? new Date(item.pubDate) : null;
                    const dateString = date && !isNaN(date) ? date.toLocaleDateString() : "";
                    return (
                      <li key={idx} style={{ marginBottom: "10px" }}>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#0073b1",
                            textDecoration: "none",
                            fontWeight: "bold",
                          }}
                        >
                          {item.title}
                        </a>
                        {dateString && (
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            🗓 {dateString}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          ) : (
            <p>No news available at the moment.</p>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: "#0073b1", color: "#fff", padding: "15px", textAlign: "center", marginTop: "30px" }}>
        <p>
          📩 Contact us at{" "}
          <a href="mailto:contact@bankregx.com" style={{ color: "#fff", fontWeight: "bold" }}>
            contact@bankregx.com
          </a>
        </p>
      </footer>
    </div>
  );
}
