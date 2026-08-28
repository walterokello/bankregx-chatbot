import { useEffect, useState } from "react";

/**
 * BANKREGX – GOVERNANCE CANVAS
 * 4 Quadrants: Signals | News | Chat | Controls
 * Control Cards (Option A)
 */

export default function Home() {
  const [signals, setSignals] = useState([]);
  const [news, setNews] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);

  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [controls, setControls] = useState([]);
  const [activeControl, setActiveControl] = useState(null);

  // ---------- INITIAL LOAD ----------
  useEffect(() => {
    resetToLatest();
  }, []);

  // ---------- RESET ----------
  async function resetToLatest() {
    setSelectedSignal(null);
    setChatResponse("");
    setControls([]);

    const res = await fetch("/api/regulatory-news");
    const data = await res.json();

    const flattened = [];
    data.forEach((feed) => {
      feed.items.forEach((item) => {
        if (isControlRelevant(item.title)) {
          flattened.push({
            id: item.link,
            title: item.title,
            link: item.link,
            source: feed.name,
          });
        }
      });
    });

    setSignals(flattened.slice(0, 12));
    setNews(flattened.slice(0, 12));
  }

  function isControlRelevant(title = "") {
    const t = title.toLowerCase();
    return (
      t.includes("enforcement") ||
      t.includes("fine") ||
      t.includes("penalt") ||
      t.includes("consultation") ||
      t.includes("regulation") ||
      t.includes("rule") ||
      t.includes("sanction")
    );
  }

  // ---------- CHAT ----------
  async function runChat(prompt) {
    setChatLoading(true);
    setChatResponse("");

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "bankregx-canvas",
        query: prompt,
      }),
    });

    const data = await res.json();
    setChatResponse(data.answer || "");
    setChatLoading(false);
  }

  // ---------- CONTROL GENERATION ----------
  async function generateControl(signal) {
    const prompt = `
You are a helpful Compliance and Audit assistant, helping people to understand how to design controls in financial services firms, crafting your response so people understand the five Ws and the H of controls, i.e., Who, What, Why, When, Where and How.

Based on the regulatory development below, generate ONE audit-ready control.

Respond ONLY in valid JSON with these fields:
controlObjective, who, what, why, when, where, how, evidence, testing

Regulatory development:
${signal.title}
`;

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "bankregx-canvas",
        query: prompt,
      }),
    });

    const data = await res.json();

    try {
      const json = JSON.parse(
        data.answer.substring(
          data.answer.indexOf("{"),
          data.answer.lastIndexOf("}") + 1
        )
      );

      setControls((prev) => [
        {
          id: crypto.randomUUID(),
          ...json,
          linkedSignal: signal.title,
          status: "draft",
        },
        ...prev,
      ]);
    } catch (e) {
      console.error("Failed to parse control JSON", e);
    }
  }

  // ---------- SIGNAL SELECT ----------
  function selectSignal(signal) {
    setSelectedSignal(signal);

    // Filter news to related items
    setNews((prev) =>
      prev.filter((n) =>
        n.title.toLowerCase().includes(signal.title.split(" ")[0].toLowerCase())
      )
    );

    runChat(
      `Explain the control impact of the following regulatory development and what firms should do next:\n\n${signal.title}`
    );

    generateControl(signal);
  }

  return (
    <div style={styles.canvas}>
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.brand}>BANKREGX · GOVERNANCE CANVAS</div>
        <button onClick={resetToLatest} style={styles.resetBtn}>
          Reset to latest control-related news
        </button>
      </div>

      {/* GRID */}
      <div style={styles.grid}>
        {/* SIGNALS */}
        <Quadrant title="SIGNALS">
          {signals.map((s) => (
            <div
              key={s.id}
              style={styles.item}
              onClick={() => selectSignal(s)}
            >
              {s.title}
            </div>
          ))}
        </Quadrant>

        {/* NEWS */}
        <Quadrant title="NEWS">
          {news.map((n) => (
            <a
              key={n.id}
              href={n.link}
              target="_blank"
              rel="noreferrer"
              style={styles.item}
            >
              {n.title}
            </a>
          ))}
        </Quadrant>

        {/* CHAT */}
        <Quadrant title="CHAT">
          {chatLoading
            ? "Analysing regulatory impact…"
            : chatResponse || "Select a signal to interpret control impact."}
        </Quadrant>

        {/* CONTROLS */}
        <Quadrant title="CONTROLS">
          {controls.length === 0 ? (
            <div style={{ opacity: 0.6 }}>
              Control cards will appear here.
            </div>
          ) : (
            controls.map((c) => (
              <div
                key={c.id}
                style={styles.controlCard}
                onClick={() => setActiveControl(c)}
              >
                <div style={{ fontWeight: 700 }}>{c.controlObjective}</div>
                <div style={styles.meta}>
                  Linked to: {c.linkedSignal}
                </div>
                <div style={styles.status}>{c.status.toUpperCase()}</div>
              </div>
            ))
          )}
        </Quadrant>
      </div>

      {/* CONTROL DETAIL */}
      {activeControl && (
        <div style={styles.controlDetail}>
          <button
            onClick={() => setActiveControl(null)}
            style={styles.closeBtn}
          >
            ✕ Close
          </button>

          <h2>{activeControl.controlObjective}</h2>

          <ul style={{ lineHeight: 1.6 }}>
            <li><strong>Who:</strong> {activeControl.who}</li>
            <li><strong>What:</strong> {activeControl.what}</li>
            <li><strong>Why:</strong> {activeControl.why}</li>
            <li><strong>When:</strong> {activeControl.when}</li>
            <li><strong>Where:</strong> {activeControl.where}</li>
            <li><strong>How:</strong> {activeControl.how}</li>
            <li><strong>Evidence:</strong> {activeControl.evidence}</li>
            <li><strong>Testing:</strong> {activeControl.testing}</li>
          </ul>
        </div>
      )}

      {/* MOBILE STACKING */}
      <style jsx>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------- COMPONENT ---------- */
function Quadrant({ title, children }) {
  return (
    <div style={styles.quadrant}>
      <div style={styles.quadrantTitle}>{title}</div>
      <div style={styles.quadrantBody}>{children}</div>
    </div>
  );
}

/* ---------- STYLES ---------- */
const styles = {
  canvas: {
    minHeight: "100vh",
    background: "#020617",
    color: "#e5e7eb",
    fontFamily: "system-ui, sans-serif",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(148,163,184,0.2)",
  },

  brand: {
    fontWeight: 800,
    letterSpacing: "0.1em",
  },

  resetBtn: {
    background: "transparent",
    border: "1px solid rgba(148,163,184,0.3)",
    color: "#e5e7eb",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "8px",
    padding: "8px",
    height: "calc(100vh - 56px)",
  },

  quadrant: {
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  quadrantTitle: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.12em",
    opacity: 0.8,
    marginBottom: "8px",
  },

  quadrantBody: {
    fontSize: "14px",
    overflowY: "auto",
    flex: 1,
  },

  item: {
    padding: "8px",
    borderRadius: "8px",
    marginBottom: "6px",
    cursor: "pointer",
    border: "1px solid rgba(148,163,184,0.15)",
    textDecoration: "none",
    color: "#e5e7eb",
    display: "block",
  },

  controlCard: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid rgba(148,163,184,0.25)",
    marginBottom: "8px",
    cursor: "pointer",
  },

  meta: {
    fontSize: "12px",
    opacity: 0.7,
    marginTop: "4px",
  },

  status: {
    fontSize: "11px",
    marginTop: "6px",
    padding: "2px 8px",
    border: "1px solid rgba(148,163,184,0.3)",
    borderRadius: "999px",
    display: "inline-block",
  },

  controlDetail: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.97)",
    padding: "16px",
    zIndex: 50,
    overflowY: "auto",
  },

  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#e5e7eb",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "12px",
  },
};
