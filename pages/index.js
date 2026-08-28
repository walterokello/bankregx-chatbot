import { useEffect, useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [responseId, setResponseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  const [activeMode, setActiveMode] = useState("ask");

  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [showCorrection, setShowCorrection] = useState(false);
  const [correction, setCorrection] = useState("");
  const [rationale, setRationale] = useState("");

  useEffect(() => {
    loadRegulatoryNews();
  }, []);

  async function loadRegulatoryNews() {
    setNewsLoading(true);

    try {
      const res = await fetch("/api/regulatory-news");
      const data = await res.json();

      const flattened = [];

      if (Array.isArray(data)) {
        data.forEach((feed) => {
          if (!Array.isArray(feed.items)) return;

          feed.items.forEach((item) => {
            flattened.push({
              id: item.link || `${feed.name}-${item.title}`,
              title: item.title,
              link: item.link,
              source: feed.name,
            });
          });
        });
      }

      setNews(flattened.slice(0, 8));
    } catch (err) {
      console.error("Unable to load regulatory news:", err);
    } finally {
      setNewsLoading(false);
    }
  }

  async function askBankRegX(customPrompt) {
    const prompt = customPrompt || query;

    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setResponseId(null);
    setFeedbackStatus("");
    setShowCorrection(false);
    setCorrection("");
    setRationale("");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "bankregx-user",
          query: prompt.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "BankRegX was unable to answer."
        );
      }

      setAnswer(data.answer || "No answer returned.");
      setResponseId(data.responseId || null);
    } catch (err) {
      console.error("BankRegX ask error:", err);
      setError(
        err?.message ||
          "Something went wrong while generating the assessment."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback(
    feedbackType,
    correctedAnswer = ""
  ) {
    if (!answer) return;

    setFeedbackStatus("Saving feedback...");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "bankregx-user",
          responseId,
          question: query,
          aiResponse: answer,
          feedbackType,
          correctedAnswer,
          rationale,
          category: getFeedbackCategory(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || "Unable to save feedback."
        );
      }

      if (feedbackType === "approve") {
        setFeedbackStatus(
          "Approved — feedback captured."
        );
      } else if (feedbackType === "reject") {
        setFeedbackStatus(
          "Rejected — feedback captured."
        );
      } else if (feedbackType === "correct") {
        setFeedbackStatus(
          "Correction saved for expert review."
        );
        setShowCorrection(false);
      }
    } catch (err) {
      setFeedbackStatus(
        err?.message || "Unable to save feedback."
      );
    }
  }

  function getFeedbackCategory() {
    if (activeMode === "control") {
      return "control_design";
    }

    if (activeMode === "regulatory") {
      return "regulatory_impact";
    }

    if (activeMode === "finding") {
      return "audit_judgement";
    }

    return "general";
  }

  function chooseMode(mode) {
    setActiveMode(mode);

    if (mode === "control") {
      setQuery(
        "Assess the design of the following control:\n\n"
      );
    }

    if (mode === "regulatory") {
      setQuery(
        "Assess the potential control impact of the following regulatory development:\n\n"
      );
    }

    if (mode === "finding") {
      setQuery(
        "Review the following audit finding and assess the control implications:\n\n"
      );
    }

    if (mode === "ask") {
      setQuery("");
    }
  }

  function analyseNewsItem(item) {
    setActiveMode("regulatory");

    const prompt = `Assess the potential control impact of this regulatory development:

${item.title}

Please distinguish:
1. regulatory fact;
2. potential risks;
3. potentially affected controls;
4. whether a control change is actually warranted;
5. suggested audit or controls actions.`;

    setQuery(prompt);
    askBankRegX(prompt);
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      askBankRegX();
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>BANKREGX</div>
          <div style={styles.brandSubtitle}>
            AI Control Intelligence for Banking
          </div>
        </div>

        <div style={styles.headerBadge}>
          EXPERT INTELLIGENCE
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>
            CONTROL INTELLIGENCE
          </div>

          <h1 style={styles.heading}>
            What would you like to assess?
          </h1>

          <p style={styles.heroText}>
            Ask about a control, audit finding,
            regulatory development or risk. BankRegX
            combines AI analysis, regulatory
            intelligence and expert controls
            methodology.
          </p>

          <div style={styles.modeRow}>
            <ModeButton
              active={activeMode === "ask"}
              onClick={() => chooseMode("ask")}
            >
              Ask anything
            </ModeButton>

            <ModeButton
              active={activeMode === "control"}
              onClick={() => chooseMode("control")}
            >
              Assess a control
            </ModeButton>

            <ModeButton
              active={activeMode === "regulatory"}
              onClick={() =>
                chooseMode("regulatory")
              }
            >
              Analyse regulatory impact
            </ModeButton>

            <ModeButton
              active={activeMode === "finding"}
              onClick={() => chooseMode("finding")}
            >
              Review a finding
            </ModeButton>
          </div>

          <div style={styles.askBox}>
            <textarea
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Describe the control, regulatory issue, audit finding or question..."
              style={styles.textarea}
              rows={7}
            />

            <div style={styles.askFooter}>
              <span style={styles.hint}>
                Ctrl + Enter to submit
              </span>

              <button
                onClick={() => askBankRegX()}
                disabled={
                  loading || !query.trim()
                }
                style={{
                  ...styles.askButton,
                  opacity:
                    loading || !query.trim()
                      ? 0.5
                      : 1,
                }}
              >
                {loading
                  ? "Analysing..."
                  : "Ask BankRegX"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {loading && (
          <section style={styles.analysisCard}>
            <div style={styles.analysisHeader}>
              BankRegX is analysing...
            </div>

            <div style={styles.processingGrid}>
              <ProcessingItem
                title="Risk"
                text="Identifying the underlying risk"
              />
              <ProcessingItem
                title="Controls"
                text="Assessing control implications"
              />
              <ProcessingItem
                title="Evidence"
                text="Considering supporting evidence"
              />
              <ProcessingItem
                title="Regulation"
                text="Checking external context"
              />
            </div>
          </section>
        )}

        {answer && !loading && (
          <section style={styles.answerCard}>
            <div style={styles.answerTop}>
              <div>
                <div style={styles.eyebrow}>
                  BANKREGX ASSESSMENT
                </div>

                <h2 style={styles.answerHeading}>
                  Control Intelligence
                </h2>
              </div>

              <div style={styles.aiBadge}>
                AI + EXPERT METHODOLOGY
              </div>
            </div>

            <div style={styles.answerText}>
              {answer}
            </div>

            <div style={styles.feedbackDivider} />

            <div style={styles.feedbackHeading}>
              Help improve BankRegX
            </div>

            <p style={styles.feedbackSubtext}>
              Your feedback is captured separately
              from BankRegX&apos;s approved expert
              methodology.
            </p>

            <div style={styles.feedbackButtons}>
              <button
                style={styles.feedbackButton}
                onClick={() =>
                  submitFeedback("approve")
                }
              >
                ✓ Approve
              </button>

              <button
                style={styles.feedbackButton}
                onClick={() =>
                  setShowCorrection(
                    !showCorrection
                  )
                }
              >
                ✎ Correct
              </button>

              <button
                style={styles.feedbackButton}
                onClick={() =>
                  submitFeedback("reject")
                }
              >
                × Reject
              </button>
            </div>

            {showCorrection && (
              <div style={styles.correctionBox}>
                <label style={styles.label}>
                  What should BankRegX have said?
                </label>

                <textarea
                  value={correction}
                  onChange={(e) =>
                    setCorrection(
                      e.target.value
                    )
                  }
                  style={styles.correctionTextarea}
                  rows={6}
                  placeholder="Provide the corrected assessment..."
                />

                <label style={styles.label}>
                  Why?
                </label>

                <textarea
                  value={rationale}
                  onChange={(e) =>
                    setRationale(
                      e.target.value
                    )
                  }
                  style={styles.correctionTextarea}
                  rows={3}
                  placeholder="Explain the principle or judgement BankRegX should learn from..."
                />

                <button
                  style={styles.saveCorrection}
                  disabled={!correction.trim()}
                  onClick={() =>
                    submitFeedback(
                      "correct",
                      correction
                    )
                  }
                >
                  Save correction
                </button>
              </div>
            )}

            {feedbackStatus && (
              <div style={styles.feedbackStatus}>
                {feedbackStatus}
              </div>
            )}
          </section>
        )}

        <section style={styles.intelligenceSection}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.eyebrow}>
                REGULATORY INTELLIGENCE
              </div>

              <h2 style={styles.sectionTitle}>
                Developments to assess
              </h2>
            </div>

            <button
              onClick={loadRegulatoryNews}
              style={styles.refreshButton}
            >
              Refresh
            </button>
          </div>

          {newsLoading ? (
            <div style={styles.emptyState}>
              Loading regulatory intelligence...
            </div>
          ) : news.length === 0 ? (
            <div style={styles.emptyState}>
              No regulatory items available.
            </div>
          ) : (
            <div style={styles.newsGrid}>
              {news.map((item) => (
                <article
                  key={item.id}
                  style={styles.newsCard}
                >
                  <div style={styles.newsSource}>
                    {item.source ||
                      "Regulatory source"}
                  </div>

                  <h3 style={styles.newsTitle}>
                    {item.title}
                  </h3>

                  <div style={styles.newsActions}>
                    <button
                      onClick={() =>
                        analyseNewsItem(item)
                      }
                      style={styles.analyseButton}
                    >
                      Analyse control impact
                    </button>

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.sourceLink}
                      >
                        Source ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={styles.foundation}>
          <div style={styles.foundationItem}>
            <span style={styles.foundationNumber}>
              01
            </span>
            <div>
              <strong>Ask</strong>
              <div style={styles.foundationText}>
                Investigate controls, risks and
                findings.
              </div>
            </div>
          </div>

          <div style={styles.foundationItem}>
            <span style={styles.foundationNumber}>
              02
            </span>
            <div>
              <strong>Assess</strong>
              <div style={styles.foundationText}>
                Evaluate design, evidence and control
                impact.
              </div>
            </div>
          </div>

          <div style={styles.foundationItem}>
            <span style={styles.foundationNumber}>
              03
            </span>
            <div>
              <strong>Monitor</strong>
              <div style={styles.foundationText}>
                Connect regulatory developments to
                controls.
              </div>
            </div>
          </div>

          <div style={styles.foundationItem}>
            <span style={styles.foundationNumber}>
              04
            </span>
            <div>
              <strong>Learn</strong>
              <div style={styles.foundationText}>
                Improve through governed expert
                judgement.
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        @media (max-width: 800px) {
          .bankregx-hidden-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.modeButton,
        ...(active
          ? styles.modeButtonActive
          : {}),
      }}
    >
      {children}
    </button>
  );
}

function ProcessingItem({ title, text }) {
  return (
    <div style={styles.processingItem}>
      <div style={styles.processingTitle}>
        {title}
      </div>
      <div style={styles.processingText}>
        {text}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #07111f 0%, #020617 45%, #020617 100%)",
    color: "#e5e7eb",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  header: {
    minHeight: "70px",
    padding: "14px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom:
      "1px solid rgba(148,163,184,0.14)",
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(2,6,23,0.94)",
    backdropFilter: "blur(14px)",
  },

  brand: {
    fontSize: "17px",
    fontWeight: 900,
    letterSpacing: "0.13em",
    color: "#f8fafc",
  },

  brandSubtitle: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "3px",
  },

  headerBadge: {
    fontSize: "10px",
    letterSpacing: "0.12em",
    border:
      "1px solid rgba(56,189,248,0.28)",
    background:
      "rgba(14,165,233,0.08)",
    color: "#7dd3fc",
    borderRadius: "999px",
    padding: "7px 11px",
    fontWeight: 700,
  },

  main: {
    width: "min(1180px, calc(100% - 32px))",
    margin: "0 auto",
    paddingBottom: "70px",
  },

  hero: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "78px 0 50px",
  },

  eyebrow: {
    color: "#38bdf8",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.16em",
    marginBottom: "12px",
  },

  heading: {
    color: "#f8fafc",
    fontSize: "clamp(34px, 5vw, 58px)",
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
    margin: "0 0 18px",
    maxWidth: "760px",
  },

  heroText: {
    color: "#94a3b8",
    fontSize: "17px",
    lineHeight: 1.65,
    maxWidth: "720px",
    marginBottom: "28px",
  },

  modeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  modeButton: {
    border:
      "1px solid rgba(148,163,184,0.2)",
    background: "rgba(15,23,42,0.7)",
    color: "#94a3b8",
    borderRadius: "9px",
    padding: "9px 13px",
    cursor: "pointer",
    fontSize: "13px",
  },

  modeButtonActive: {
    border:
      "1px solid rgba(56,189,248,0.45)",
    background:
      "rgba(14,165,233,0.12)",
    color: "#e0f2fe",
  },

  askBox: {
    border:
      "1px solid rgba(148,163,184,0.22)",
    background: "rgba(15,23,42,0.78)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow:
      "0 24px 80px rgba(0,0,0,0.22)",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#f8fafc",
    padding: "20px",
    fontFamily: "inherit",
    fontSize: "16px",
    lineHeight: 1.55,
    minHeight: "155px",
  },

  askFooter: {
    borderTop:
      "1px solid rgba(148,163,184,0.12)",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  hint: {
    fontSize: "11px",
    color: "#64748b",
  },

  askButton: {
    border: "none",
    background: "#0ea5e9",
    color: "#04111d",
    fontWeight: 800,
    borderRadius: "9px",
    padding: "11px 18px",
    cursor: "pointer",
  },

  errorBox: {
    maxWidth: "900px",
    margin: "0 auto 24px",
    padding: "14px 16px",
    background: "rgba(127,29,29,0.22)",
    border:
      "1px solid rgba(248,113,113,0.3)",
    borderRadius: "12px",
    color: "#fecaca",
  },

  analysisCard: {
    maxWidth: "900px",
    margin: "0 auto 40px",
    border:
      "1px solid rgba(148,163,184,0.16)",
    background: "rgba(15,23,42,0.58)",
    borderRadius: "14px",
    padding: "20px",
  },

  analysisHeader: {
    fontWeight: 750,
    marginBottom: "15px",
  },

  processingGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px",
  },

  processingItem: {
    background: "rgba(2,6,23,0.55)",
    border:
      "1px solid rgba(148,163,184,0.12)",
    borderRadius: "10px",
    padding: "12px",
  },

  processingTitle: {
    color: "#e2e8f0",
    fontSize: "12px",
    fontWeight: 800,
  },

  processingText: {
    color: "#64748b",
    fontSize: "11px",
    marginTop: "4px",
    lineHeight: 1.4,
  },

  answerCard: {
    maxWidth: "900px",
    margin: "0 auto 60px",
    background: "#07101d",
    border:
      "1px solid rgba(56,189,248,0.18)",
    borderRadius: "16px",
    padding: "26px",
  },

  answerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    flexWrap: "wrap",
  },

  answerHeading: {
    margin: 0,
    fontSize: "23px",
    color: "#f8fafc",
  },

  aiBadge: {
    border:
      "1px solid rgba(74,222,128,0.22)",
    background: "rgba(22,101,52,0.1)",
    color: "#86efac",
    borderRadius: "999px",
    padding: "6px 9px",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },

  answerText: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.72,
    color: "#cbd5e1",
    fontSize: "15px",
    marginTop: "25px",
  },

  feedbackDivider: {
    height: "1px",
    background:
      "rgba(148,163,184,0.12)",
    margin: "26px 0 18px",
  },

  feedbackHeading: {
    fontWeight: 750,
    color: "#f1f5f9",
  },

  feedbackSubtext: {
    color: "#64748b",
    fontSize: "12px",
    margin: "5px 0 13px",
  },

  feedbackButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  feedbackButton: {
    border:
      "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.8)",
    color: "#cbd5e1",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  correctionBox: {
    marginTop: "16px",
    borderTop:
      "1px solid rgba(148,163,184,0.12)",
    paddingTop: "16px",
  },

  label: {
    display: "block",
    color: "#94a3b8",
    fontSize: "12px",
    margin: "12px 0 6px",
  },

  correctionTextarea: {
    width: "100%",
    boxSizing: "border-box",
    background: "#020617",
    border:
      "1px solid rgba(148,163,184,0.2)",
    color: "#e2e8f0",
    borderRadius: "9px",
    padding: "12px",
    fontFamily: "inherit",
    fontSize: "14px",
    resize: "vertical",
  },

  saveCorrection: {
    marginTop: "12px",
    background: "#0ea5e9",
    color: "#04111d",
    border: "none",
    borderRadius: "8px",
    padding: "9px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  feedbackStatus: {
    marginTop: "12px",
    color: "#7dd3fc",
    fontSize: "12px",
  },

  intelligenceSection: {
    borderTop:
      "1px solid rgba(148,163,184,0.12)",
    paddingTop: "52px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "28px",
    color: "#f8fafc",
  },

  refreshButton: {
    background: "transparent",
    color: "#94a3b8",
    border:
      "1px solid rgba(148,163,184,0.18)",
    borderRadius: "8px",
    padding: "8px 11px",
    cursor: "pointer",
  },

  emptyState: {
    color: "#64748b",
    padding: "25px 0",
  },

  newsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "12px",
  },

  newsCard: {
    background: "rgba(15,23,42,0.62)",
    border:
      "1px solid rgba(148,163,184,0.14)",
    borderRadius: "12px",
    padding: "17px",
  },

  newsSource: {
    color: "#38bdf8",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
  },

  newsTitle: {
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#e2e8f0",
    minHeight: "64px",
  },

  newsActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "16px",
  },

  analyseButton: {
    border:
      "1px solid rgba(56,189,248,0.26)",
    background:
      "rgba(14,165,233,0.08)",
    color: "#bae6fd",
    padding: "8px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    cursor: "pointer",
  },

  sourceLink: {
    color: "#64748b",
    fontSize: "11px",
    textDecoration: "none",
  },

  foundation: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
    marginTop: "60px",
    paddingTop: "28px",
    borderTop:
      "1px solid rgba(148,163,184,0.1)",
  },

  foundationItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    color: "#cbd5e1",
    fontSize: "13px",
  },

  foundationNumber: {
    color: "#38bdf8",
    fontSize: "10px",
    fontWeight: 900,
    paddingTop: "3px",
  },

  foundationText: {
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.5,
    marginTop: "3px",
  },
};