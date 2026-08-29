import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [responseId, setResponseId] = useState(null);

  const [expertGuidance, setExpertGuidance] =
    useState([]);

  const [detectedCategories, setDetectedCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [news, setNews] =
    useState([]);

  const [newsLoading, setNewsLoading] =
    useState(true);

  const [activeMode, setActiveMode] =
    useState("ask");

  const [feedbackStatus, setFeedbackStatus] =
    useState("");

  const [showCorrection, setShowCorrection] =
    useState(false);

  const [correction, setCorrection] =
    useState("");

  const [rationale, setRationale] =
    useState("");

  const modes = [
    {
      id: "ask",
      label: "Ask anything",
      description:
        "Ask BankRegX about controls, audit, risk or regulation.",
      placeholder:
        "Ask BankRegX a controls, audit, risk or regulatory question...",
    },
    {
      id: "control",
      label: "Assess a control",
      description:
        "Evaluate control design using BankRegX expert methodology.",
      placeholder:
        "Describe the control you want BankRegX to assess...",
    },
    {
      id: "regulatory",
      label:
        "Analyse regulatory impact",
      description:
        "Assess what a regulatory development could mean for risks and controls.",
      placeholder:
        "Describe or paste the regulatory development you want BankRegX to analyse...",
    },
    {
      id: "finding",
      label: "Review a finding",
      description:
        "Challenge the logic, evidence and significance of an audit or controls finding.",
      placeholder:
        "Paste or describe the audit finding you want BankRegX to review...",
    },
  ];

  const currentMode =
    modes.find(
      (mode) =>
        mode.id === activeMode
    ) || modes[0];

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setNewsLoading(true);

    try {
      const response =
        await fetch(
          "/api/regulatory-news"
        );

      const data =
        await response.json();

      let flattened = [];

      if (
        Array.isArray(data)
      ) {
        flattened = data;
      } else if (
        Array.isArray(
          data?.items
        )
      ) {
        flattened =
          data.items;
      } else if (
        Array.isArray(
          data?.news
        )
      ) {
        flattened =
          data.news;
      } else if (
        data &&
        typeof data ===
          "object"
      ) {
        /*
         * Regulatory-news APIs often return
         * grouped feeds by regulator.
         */

        Object.entries(
          data
        ).forEach(
          ([
            source,
            items,
          ]) => {
            if (
              Array.isArray(
                items
              )
            ) {
              items.forEach(
                (item) => {
                  flattened.push(
                    {
                      ...item,
                      source:
                        item.source ||
                        source,
                    }
                  );
                }
              );
            }
          }
        );
      }

      setNews(
        flattened.slice(
          0,
          12
        )
      );
    } catch (err) {
      console.error(
        "Unable to load regulatory news:",
        err
      );
    } finally {
      setNewsLoading(false);
    }
  }

  async function askBankRegX(
    customPrompt = null
  ) {
    const prompt =
      customPrompt ||
      query.trim();

    if (!prompt) {
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setResponseId(null);
    setExpertGuidance([]);
    setDetectedCategories([]);
    setFeedbackStatus("");
    setShowCorrection(false);
    setCorrection("");
    setRationale("");

    try {
      const response =
        await fetch(
          "/api/ask",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                userId:
                  "bankregx-user",
                query: prompt,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "BankRegX could not complete the assessment."
        );
      }

      setAnswer(
        data.answer ||
          "No response returned."
      );

      setResponseId(
        data.responseId ||
          null
      );

      setExpertGuidance(
        Array.isArray(
          data.expertGuidance
        )
          ? data.expertGuidance
          : []
      );

      setDetectedCategories(
        Array.isArray(
          data.detectedCategories
        )
          ? data.detectedCategories
          : []
      );

      if (customPrompt) {
        setQuery(
          customPrompt
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback(
    feedbackType
  ) {
    if (!answer) {
      return;
    }

    if (
      feedbackType ===
        "correct" &&
      !correction.trim()
    ) {
      setFeedbackStatus(
        "Please enter the corrected assessment."
      );

      return;
    }

    setFeedbackStatus(
      "Saving feedback..."
    );

    try {
      const response =
        await fetch(
          "/api/feedback",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                userId:
                  "bankregx-user",

                responseId,

                question:
                  query,

                aiResponse:
                  answer,

                feedbackType,

                correctedAnswer:
                  feedbackType ===
                  "correct"
                    ? correction
                    : "",

                rationale,

                category:
                  detectedCategories[
                    0
                  ] ||
                  activeMode ||
                  "general",
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to save feedback."
        );
      }

      if (
        feedbackType ===
        "approve"
      ) {
        setFeedbackStatus(
          "Assessment approved."
        );
      } else if (
        feedbackType ===
        "reject"
      ) {
        setFeedbackStatus(
          "Assessment rejected and recorded for review."
        );
      } else {
        setFeedbackStatus(
          "Correction saved. BankRegX can use this feedback in the expert-learning workflow."
        );

        setShowCorrection(
          false
        );
      }
    } catch (err) {
      setFeedbackStatus(
        err.message ||
          "Unable to save feedback."
      );
    }
  }

  function chooseMode(
    modeId
  ) {
    setActiveMode(
      modeId
    );

    setAnswer("");
    setResponseId(null);
    setExpertGuidance([]);
    setDetectedCategories([]);
    setError("");
    setFeedbackStatus("");
    setShowCorrection(false);

    const examples = {
      ask: "",

      control:
        "Assess this control: ",

      regulatory:
        "Analyse the regulatory impact of: ",

      finding:
        "Review this finding: ",
    };

    setQuery(
      examples[
        modeId
      ] || ""
    );
  }

  function analyseNewsItem(
    item
  ) {
    const title =
      item.title ||
      item.name ||
      "Regulatory development";

    const source =
      item.source ||
      item.regulator ||
      "";

    const description =
      item.description ||
      item.summary ||
      "";

    const prompt = `
Analyse the control and risk impact of this regulatory development.

Title: ${title}

Source: ${source}

Summary: ${description}

Distinguish regulatory fact from BankRegX professional judgement.

Consider:
- the underlying regulatory or conduct risk;
- potentially affected business activities;
- relevant existing controls;
- whether this implies no material control impact, further assessment, potential enhancement, or a genuine control gap;
- what evidence should be reviewed before reaching a conclusion.
`.trim();

    setActiveMode(
      "regulatory"
    );

    setQuery(prompt);

    askBankRegX(
      prompt
    );
  }

  function displayCategory(
    category
  ) {
    return String(
      category || ""
    )
      .replace(
        /_/g,
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  function handleKeyDown(
    event
  ) {
    if (
      event.key ===
        "Enter" &&
      (event.ctrlKey ||
        event.metaKey)
    ) {
      event.preventDefault();

      askBankRegX();
    }
  }

  return (
    <>
      <div className="page">
        <header className="topbar">
          <div className="brandArea">
            <div className="logo">
              BRX
            </div>

            <div>
              <div className="brand">
                BANKREGX
              </div>

              <div className="tagline">
                AI Control
                Intelligence for
                Banking
              </div>
            </div>
          </div>

          <div className="expertBadge">
            <span className="expertDot" />
            EXPERT INTELLIGENCE
          </div>
        </header>

        <main className="main">
          <section className="hero">
            <div className="eyebrow">
              CONTROL
              INTELLIGENCE
            </div>

            <h1>
              What would you
              like to assess?
            </h1>

            <p className="heroText">
              Apply AI, approved
              BankRegX expert
              methodology and
              regulatory
              intelligence to
              controls, audit
              judgements and
              emerging risk.
            </p>
          </section>

          <section className="modeGrid">
            {modes.map(
              (mode) => (
                <button
                  key={
                    mode.id
                  }
                  type="button"
                  onClick={() =>
                    chooseMode(
                      mode.id
                    )
                  }
                  className={`modeCard ${
                    activeMode ===
                    mode.id
                      ? "modeCardActive"
                      : ""
                  }`}
                >
                  <div className="modeLabel">
                    {
                      mode.label
                    }
                  </div>

                  <div className="modeDescription">
                    {
                      mode.description
                    }
                  </div>
                </button>
              )
            )}
          </section>

          <section className="askPanel">
            <div className="askHeader">
              <div>
                <div className="sectionEyebrow">
                  {
                    currentMode.label
                  }
                </div>

                <div className="askTitle">
                  BankRegX
                  assessment
                </div>
              </div>

              <div className="shortcut">
                Ctrl + Enter
              </div>
            </div>

            <textarea
              value={query}
              onChange={(
                event
              ) =>
                setQuery(
                  event.target
                    .value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder={
                currentMode.placeholder
              }
              className="queryInput"
            />

            <div className="askFooter">
              <div className="inputHint">
                BankRegX will
                distinguish facts,
                unknowns,
                assumptions and
                professional
                judgement.
              </div>

              <button
                type="button"
                className="primaryButton"
                onClick={() =>
                  askBankRegX()
                }
                disabled={
                  loading ||
                  !query.trim()
                }
              >
                {loading
                  ? "Assessing..."
                  : "Ask BankRegX"}
              </button>
            </div>
          </section>

          {error && (
            <section className="errorCard">
              {error}
            </section>
          )}

          {loading && (
            <section className="loadingCard">
              <div className="loadingTop">
                <div className="loadingPulse" />

                <div>
                  <div className="loadingTitle">
                    BankRegX is
                    assessing
                  </div>

                  <div className="loadingSub">
                    Applying evidence
                    discipline and
                    relevant Expert
                    Intelligence
                  </div>
                </div>
              </div>

              <div className="loadingGrid">
                <span>
                  Risk
                </span>

                <span>
                  Controls
                </span>

                <span>
                  Evidence
                </span>

                <span>
                  Regulation
                </span>
              </div>
            </section>
          )}

          {answer &&
            !loading && (
              <section className="answerCard">
                <div className="answerHeader">
                  <div>
                    <div className="sectionEyebrow">
                      BANKREGX
                      ASSESSMENT
                    </div>

                    <h2>
                      Control
                      Intelligence
                    </h2>
                  </div>

                  <div className="methodBadge">
                    AI + EXPERT
                    METHODOLOGY
                  </div>
                </div>

                {detectedCategories.length >
                  0 && (
                  <div className="categoryRow">
                    {detectedCategories.map(
                      (
                        category
                      ) => (
                        <span
                          key={
                            category
                          }
                          className="categoryChip"
                        >
                          {displayCategory(
                            category
                          )}
                        </span>
                      )
                    )}
                  </div>
                )}

                <div className="markdown">
                  <ReactMarkdown>
                    {answer}
                  </ReactMarkdown>
                </div>

                {expertGuidance.length >
                  0 && (
                  <div className="explainPanel">
                    <div className="explainHeader">
                      <div>
                        <div className="sectionEyebrow">
                          EXPLAINABLE
                          INTELLIGENCE
                        </div>

                        <h3>
                          Why BankRegX
                          reached this
                          conclusion
                        </h3>
                      </div>

                      <div className="guidanceCount">
                        {
                          expertGuidance.length
                        }{" "}
                        expert
                        principles
                      </div>
                    </div>

                    <p className="explainIntro">
                      BankRegX
                      retrieved the
                      following approved
                      methodology as
                      relevant to this
                      assessment.
                    </p>

                    <div className="guidanceList">
                      {expertGuidance.map(
                        (
                          item
                        ) => (
                          <div
                            key={
                              item.id ||
                              item.guidanceId
                            }
                            className="guidanceItem"
                          >
                            <div className="guidanceMeta">
                              <span className="guidanceId">
                                {
                                  item.guidanceId
                                }
                              </span>

                              <span
                                className={`priority priority-${String(
                                  item.priority ||
                                    "medium"
                                ).toLowerCase()}`}
                              >
                                {String(
                                  item.priority ||
                                    "medium"
                                ).toUpperCase()}
                              </span>
                            </div>

                            <div className="guidanceTitle">
                              {
                                item.title
                              }
                            </div>

                            <div className="guidanceCategory">
                              {displayCategory(
                                item.category
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="explainNote">
                      Expert methodology
                      supports BankRegX
                      professional
                      judgement. It is
                      not presented as
                      legislation or
                      regulatory source
                      material.
                    </div>
                  </div>
                )}

                <div className="feedbackPanel">
                  <div className="feedbackHeader">
                    <div>
                      <div className="feedbackTitle">
                        Expert review
                      </div>

                      <div className="feedbackSub">
                        Was this
                        assessment
                        professionally
                        sound?
                      </div>
                    </div>

                    {responseId && (
                      <div className="responseRef">
                        Assessment
                        recorded
                      </div>
                    )}
                  </div>

                  <div className="feedbackButtons">
                    <button
                      type="button"
                      className="feedbackButton approve"
                      onClick={() =>
                        submitFeedback(
                          "approve"
                        )
                      }
                    >
                      ✓ Approve
                    </button>

                    <button
                      type="button"
                      className="feedbackButton correct"
                      onClick={() =>
                        setShowCorrection(
                          (
                            current
                          ) =>
                            !current
                        )
                      }
                    >
                      ✎ Correct
                    </button>

                    <button
                      type="button"
                      className="feedbackButton reject"
                      onClick={() =>
                        submitFeedback(
                          "reject"
                        )
                      }
                    >
                      × Reject
                    </button>
                  </div>

                  {showCorrection && (
                    <div className="correctionBox">
                      <label>
                        Corrected
                        assessment
                      </label>

                      <textarea
                        value={
                          correction
                        }
                        onChange={(
                          event
                        ) =>
                          setCorrection(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="How should BankRegX have assessed this?"
                        className="correctionInput"
                      />

                      <label>
                        Expert rationale
                        <span>
                          {" "}
                          — optional
                        </span>
                      </label>

                      <textarea
                        value={
                          rationale
                        }
                        onChange={(
                          event
                        ) =>
                          setRationale(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Why is this correction important?"
                        className="rationaleInput"
                      />

                      <div className="correctionActions">
                        <button
                          type="button"
                          className="secondaryButton"
                          onClick={() =>
                            setShowCorrection(
                              false
                            )
                          }
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="primaryButton small"
                          onClick={() =>
                            submitFeedback(
                              "correct"
                            )
                          }
                        >
                          Save expert
                          correction
                        </button>
                      </div>
                    </div>
                  )}

                  {feedbackStatus && (
                    <div className="feedbackStatus">
                      {
                        feedbackStatus
                      }
                    </div>
                  )}
                </div>
              </section>
            )}

          <section className="newsSection">
            <div className="newsHeader">
              <div>
                <div className="sectionEyebrow">
                  MONITOR
                </div>

                <h2>
                  Regulatory
                  intelligence
                </h2>

                <p>
                  Review emerging
                  developments and ask
                  BankRegX what they
                  could mean for
                  existing risks and
                  controls.
                </p>
              </div>

              <button
                type="button"
                className="refreshButton"
                onClick={
                  loadNews
                }
              >
                Refresh
              </button>
            </div>

            {newsLoading ? (
              <div className="newsLoading">
                Loading regulatory
                intelligence...
              </div>
            ) : news.length ===
              0 ? (
              <div className="newsLoading">
                No regulatory
                intelligence
                available.
              </div>
            ) : (
              <div className="newsGrid">
                {news.map(
                  (
                    item,
                    index
                  ) => {
                    const title =
                      item.title ||
                      item.name ||
                      "Regulatory update";

                    const source =
                      item.source ||
                      item.regulator ||
                      "";

                    const description =
                      item.description ||
                      item.summary ||
                      "";

                    const link =
                      item.link ||
                      item.url ||
                      "";

                    return (
                      <article
                        className="newsCard"
                        key={`${title}-${index}`}
                      >
                        <div className="newsSource">
                          {source ||
                            "REGULATORY INTELLIGENCE"}
                        </div>

                        <h3>
                          {
                            title
                          }
                        </h3>

                        {description && (
                          <p>
                            {description.slice(
                              0,
                              220
                            )}
                            {description.length >
                            220
                              ? "..."
                              : ""}
                          </p>
                        )}

                        <div className="newsActions">
                          <button
                            type="button"
                            onClick={() =>
                              analyseNewsItem(
                                item
                              )
                            }
                          >
                            Analyse
                            control
                            impact
                          </button>

                          {link && (
                            <a
                              href={
                                link
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              Source ↗
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>

          <section className="foundation">
            <div className="foundationIntro">
              <div className="sectionEyebrow">
                BANKREGX
                INTELLIGENCE
                MODEL
              </div>

              <h2>
                From AI assistant to
                control intelligence
              </h2>
            </div>

            <div className="foundationGrid">
              <div>
                <span>
                  01
                </span>
                <h3>
                  Ask
                </h3>
                <p>
                  Interrogate controls,
                  audit, risk and
                  regulation.
                </p>
              </div>

              <div>
                <span>
                  02
                </span>
                <h3>
                  Assess
                </h3>
                <p>
                  Apply disciplined
                  methodology to
                  professional
                  judgement.
                </p>
              </div>

              <div>
                <span>
                  03
                </span>
                <h3>
                  Monitor
                </h3>
                <p>
                  Connect regulatory
                  developments to risks
                  and controls.
                </p>
              </div>

              <div>
                <span>
                  04
                </span>
                <h3>
                  Learn
                </h3>
                <p>
                  Capture expert
                  review and build
                  governed BankRegX
                  intelligence.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer>
          BANKREGX · AI CONTROL
          INTELLIGENCE FOR BANKING
        </footer>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html {
          background: #071014;
        }

        body {
          margin: 0;
          background:
            radial-gradient(
              circle at top left,
              rgba(
                42,
                110,
                110,
                0.16
              ),
              transparent 34%
            ),
            #071014;
          color: #ecf4f3;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .page {
          min-height: 100vh;
        }

        .topbar {
          min-height: 78px;
          padding: 0 5vw;
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          border-bottom: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.07
            );
          background:
            rgba(
              7,
              16,
              20,
              0.86
            );
          backdrop-filter:
            blur(18px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .brandArea {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .logo {
          width: 42px;
          height: 42px;
          border: 1px
            solid
            rgba(
              151,
              225,
              210,
              0.38
            );
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content:
            center;
          color: #b9e6dc;
          font-size: 11px;
          font-weight: 800;
          letter-spacing:
            0.08em;
          background:
            rgba(
              72,
              145,
              132,
              0.1
            );
        }

        .brand {
          font-size: 15px;
          font-weight: 800;
          letter-spacing:
            0.16em;
        }

        .tagline {
          margin-top: 3px;
          font-size: 11px;
          color: #829795;
        }

        .expertBadge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing:
            0.12em;
          color: #b9d7d2;
          border: 1px
            solid
            rgba(
              142,
              205,
              192,
              0.2
            );
          padding: 9px 12px;
          border-radius:
            999px;
          background:
            rgba(
              100,
              171,
              158,
              0.06
            );
        }

        .expertDot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background:
            #83c8b9;
          box-shadow:
            0 0 12px
            rgba(
              131,
              200,
              185,
              0.6
            );
        }

        .main {
          width: min(
            1180px,
            90vw
          );
          margin: 0 auto;
        }

        .hero {
          padding:
            90px 0 45px;
          max-width: 800px;
        }

        .eyebrow,
        .sectionEyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing:
            0.17em;
          color: #82bdb2;
          text-transform:
            uppercase;
        }

        .hero h1 {
          font-size:
            clamp(
              42px,
              6vw,
              74px
            );
          line-height: 0.98;
          letter-spacing:
            -0.045em;
          margin: 16px 0 20px;
          font-weight: 640;
        }

        .heroText {
          max-width: 680px;
          color: #93a9a6;
          line-height: 1.7;
          font-size: 16px;
        }

        .modeGrid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              1fr
            );
          gap: 12px;
          margin-bottom: 18px;
        }

        .modeCard {
          text-align: left;
          padding: 20px;
          min-height: 118px;
          border-radius: 15px;
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.075
            );
          background:
            rgba(
              255,
              255,
              255,
              0.025
            );
          color: inherit;
          transition:
            160ms ease;
        }

        .modeCard:hover {
          border-color:
            rgba(
              132,
              194,
              181,
              0.3
            );
          transform:
            translateY(
              -1px
            );
        }

        .modeCardActive {
          border-color:
            rgba(
              132,
              194,
              181,
              0.5
            );
          background:
            linear-gradient(
              145deg,
              rgba(
                86,
                156,
                142,
                0.13
              ),
              rgba(
                255,
                255,
                255,
                0.025
              )
            );
        }

        .modeLabel {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 9px;
        }

        .modeDescription {
          color: #819794;
          font-size: 12px;
          line-height: 1.5;
        }

        .askPanel,
        .answerCard,
        .loadingCard {
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.08
            );
          border-radius: 18px;
          background:
            rgba(
              11,
              24,
              29,
              0.77
            );
          box-shadow:
            0 28px 80px
            rgba(
              0,
              0,
              0,
              0.18
            );
        }

        .askPanel {
          padding: 26px;
        }

        .askHeader,
        .answerHeader,
        .feedbackHeader,
        .explainHeader,
        .newsHeader {
          display: flex;
          justify-content:
            space-between;
          gap: 20px;
          align-items:
            flex-start;
        }

        .askTitle {
          margin-top: 6px;
          font-size: 19px;
          font-weight: 650;
        }

        .shortcut {
          color: #647b78;
          font-size: 11px;
        }

        .queryInput {
          margin-top: 22px;
          width: 100%;
          min-height: 160px;
          resize: vertical;
          padding: 20px;
          outline: none;
          border-radius: 13px;
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.08
            );
          background:
            #081317;
          color: #eaf2f1;
          line-height: 1.6;
        }

        .queryInput:focus {
          border-color:
            rgba(
              121,
              191,
              177,
              0.48
            );
        }

        .queryInput::placeholder {
          color: #536966;
        }

        .askFooter {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 20px;
          margin-top: 16px;
        }

        .inputHint {
          color: #657c79;
          font-size: 11px;
          line-height: 1.5;
        }

        .primaryButton,
        .secondaryButton {
          border: 0;
          border-radius: 10px;
          padding: 12px 18px;
          font-weight: 700;
        }

        .primaryButton {
          background: #9dd6ca;
          color: #071311;
        }

        .primaryButton:disabled {
          opacity: 0.45;
          cursor: default;
        }

        .primaryButton.small {
          padding: 10px 14px;
          font-size: 12px;
        }

        .secondaryButton {
          background:
            rgba(
              255,
              255,
              255,
              0.06
            );
          color: #b8c8c6;
        }

        .loadingCard {
          margin-top: 18px;
          padding: 28px;
        }

        .loadingTop {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .loadingPulse {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #8ccbbe;
          animation:
            pulse 1.2s
            infinite ease-in-out;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
          }

          50% {
            opacity: 1;
          }
        }

        .loadingTitle {
          font-weight: 700;
        }

        .loadingSub {
          margin-top: 4px;
          font-size: 12px;
          color: #79908d;
        }

        .loadingGrid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              1fr
            );
          gap: 8px;
          margin-top: 22px;
        }

        .loadingGrid span {
          padding: 11px;
          text-align: center;
          border-radius: 8px;
          background:
            rgba(
              255,
              255,
              255,
              0.03
            );
          color: #6f8783;
          font-size: 11px;
        }

        .errorCard {
          margin-top: 18px;
          padding: 16px 18px;
          border: 1px
            solid
            rgba(
              216,
              111,
              111,
              0.3
            );
          background:
            rgba(
              163,
              66,
              66,
              0.08
            );
          border-radius: 12px;
          color: #efb3b3;
        }

        .answerCard {
          margin-top: 18px;
          padding: 32px;
        }

        .answerHeader {
          padding-bottom: 24px;
          border-bottom: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.06
            );
        }

        .answerHeader h2,
        .newsHeader h2,
        .foundation h2 {
          margin: 7px 0 0;
          font-size: 27px;
          letter-spacing:
            -0.025em;
        }

        .methodBadge {
          color: #abd9cf;
          font-size: 9px;
          letter-spacing:
            0.12em;
          border: 1px
            solid
            rgba(
              137,
              202,
              189,
              0.24
            );
          background:
            rgba(
              137,
              202,
              189,
              0.06
            );
          padding: 9px 11px;
          border-radius:
            999px;
        }

        .categoryRow {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin: 20px 0 0;
        }

        .categoryChip {
          font-size: 10px;
          color: #8eaaa6;
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.08
            );
          border-radius:
            999px;
          padding: 6px 9px;
        }

        .markdown {
          color: #c5d3d1;
          line-height: 1.75;
          font-size: 14px;
          padding: 20px 0;
        }

        .markdown h1,
        .markdown h2,
        .markdown h3,
        .markdown h4 {
          color: #f0f6f5;
          line-height: 1.25;
          letter-spacing:
            -0.018em;
        }

        .markdown h3 {
          font-size: 18px;
          margin:
            30px 0 10px;
          padding-top: 5px;
        }

        .markdown p {
          margin: 10px 0;
        }

        .markdown ul,
        .markdown ol {
          padding-left: 22px;
        }

        .markdown li {
          margin: 7px 0;
        }

        .markdown strong {
          color: #edf5f3;
          font-weight: 700;
        }

        .markdown blockquote {
          margin: 18px 0;
          padding:
            4px 0 4px
            18px;
          border-left: 2px
            solid #78aa9f;
          color: #91aaa6;
        }

        .explainPanel {
          margin-top: 12px;
          border-radius: 14px;
          border: 1px
            solid
            rgba(
              130,
              194,
              181,
              0.15
            );
          background:
            rgba(
              73,
              126,
              116,
              0.055
            );
          padding: 23px;
        }

        .explainHeader h3 {
          margin: 6px 0 0;
          font-size: 18px;
        }

        .guidanceCount {
          font-size: 10px;
          color: #91aaa6;
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.08
            );
          border-radius:
            999px;
          padding: 7px 9px;
        }

        .explainIntro,
        .explainNote {
          color: #7e9692;
          line-height: 1.6;
          font-size: 12px;
        }

        .guidanceList {
          display: grid;
          gap: 9px;
          margin: 17px 0;
        }

        .guidanceItem {
          background:
            rgba(
              5,
              15,
              18,
              0.55
            );
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          border-radius: 10px;
          padding: 14px;
        }

        .guidanceMeta {
          display: flex;
          justify-content:
            space-between;
          gap: 8px;
        }

        .guidanceId {
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            monospace;
          font-size: 9px;
          color: #75908b;
        }

        .priority {
          font-size: 8px;
          font-weight: 800;
          letter-spacing:
            0.08em;
          color: #78908c;
        }

        .priority-critical {
          color: #d9a4a4;
        }

        .priority-high {
          color: #d7c398;
        }

        .guidanceTitle {
          margin-top: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #dce8e6;
        }

        .guidanceCategory {
          margin-top: 4px;
          font-size: 10px;
          color: #718985;
        }

        .feedbackPanel {
          margin-top: 26px;
          padding-top: 24px;
          border-top: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.06
            );
        }

        .feedbackTitle {
          font-size: 14px;
          font-weight: 700;
        }

        .feedbackSub {
          font-size: 11px;
          color: #718985;
          margin-top: 4px;
        }

        .responseRef {
          font-size: 9px;
          letter-spacing:
            0.08em;
          color: #709089;
        }

        .feedbackButtons {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 16px;
        }

        .feedbackButton {
          padding: 9px 13px;
          border-radius: 9px;
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.09
            );
          background:
            rgba(
              255,
              255,
              255,
              0.03
            );
          color: #aebfbc;
          font-size: 11px;
        }

        .approve:hover {
          border-color:
            rgba(
              107,
              197,
              164,
              0.42
            );
        }

        .correct:hover {
          border-color:
            rgba(
              199,
              174,
              105,
              0.42
            );
        }

        .reject:hover {
          border-color:
            rgba(
              209,
              113,
              113,
              0.42
            );
        }

        .correctionBox {
          margin-top: 16px;
          padding: 18px;
          border-radius: 12px;
          background:
            rgba(
              0,
              0,
              0,
              0.15
            );
        }

        .correctionBox label {
          display: block;
          font-size: 11px;
          color: #8da29f;
          margin:
            0 0 7px;
        }

        .correctionBox label span {
          color: #536966;
        }

        .correctionInput,
        .rationaleInput {
          width: 100%;
          resize: vertical;
          border-radius: 9px;
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.08
            );
          background: #071216;
          color: #dfe9e7;
          outline: none;
          padding: 13px;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .correctionInput {
          min-height: 130px;
        }

        .rationaleInput {
          min-height: 80px;
        }

        .correctionActions {
          display: flex;
          justify-content:
            flex-end;
          gap: 9px;
        }

        .feedbackStatus {
          margin-top: 12px;
          font-size: 11px;
          color: #94b0aa;
        }

        .newsSection {
          padding:
            90px 0 30px;
        }

        .newsHeader p {
          color: #788f8c;
          max-width: 650px;
          line-height: 1.6;
          font-size: 13px;
        }

        .refreshButton {
          color: #90a7a3;
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.08
            );
          background:
            transparent;
          border-radius: 9px;
          padding: 9px 12px;
        }

        .newsGrid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              1fr
            );
          gap: 12px;
          margin-top: 25px;
        }

        .newsCard {
          min-height: 250px;
          padding: 20px;
          border-radius: 14px;
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.07
            );
          background:
            rgba(
              255,
              255,
              255,
              0.02
            );
          display: flex;
          flex-direction:
            column;
        }

        .newsSource {
          font-size: 9px;
          letter-spacing:
            0.11em;
          color: #71918a;
          text-transform:
            uppercase;
        }

        .newsCard h3 {
          font-size: 15px;
          line-height: 1.4;
          margin:
            13px 0 10px;
        }

        .newsCard p {
          color: #758b88;
          line-height: 1.55;
          font-size: 11px;
          flex: 1;
        }

        .newsActions {
          display: flex;
          justify-content:
            space-between;
          gap: 10px;
          align-items: center;
          margin-top: 17px;
        }

        .newsActions button,
        .newsActions a {
          font-size: 10px;
          color: #8fbab1;
          background:
            transparent;
          border: 0;
          padding: 0;
          text-decoration:
            none;
        }

        .newsLoading {
          padding: 30px 0;
          color: #607572;
          font-size: 12px;
        }

        .foundation {
          padding:
            90px 0 80px;
        }

        .foundationIntro {
          max-width: 600px;
        }

        .foundationGrid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              1fr
            );
          gap: 1px;
          margin-top: 30px;
          background:
            rgba(
              255,
              255,
              255,
              0.06
            );
          border: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          border-radius: 14px;
          overflow: hidden;
        }

        .foundationGrid > div {
          padding: 24px;
          background: #091418;
        }

        .foundationGrid span {
          color: #54706b;
          font-size: 9px;
          font-family:
            ui-monospace,
            monospace;
        }

        .foundationGrid h3 {
          margin:
            12px 0 7px;
          font-size: 17px;
        }

        .foundationGrid p {
          color: #718784;
          line-height: 1.55;
          font-size: 11px;
        }

        footer {
          border-top: 1px
            solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          color: #425a56;
          padding: 25px 5vw;
          text-align: center;
          font-size: 9px;
          letter-spacing:
            0.13em;
        }

        @media (
          max-width: 900px
        ) {
          .modeGrid,
          .foundationGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .newsGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }
        }

        @media (
          max-width: 620px
        ) {
          .topbar {
            padding:
              0 4vw;
          }

          .expertBadge {
            display: none;
          }

          .main {
            width: 92vw;
          }

          .hero {
            padding-top: 55px;
          }

          .modeGrid,
          .newsGrid,
          .foundationGrid {
            grid-template-columns:
              1fr;
          }

          .askHeader,
          .answerHeader,
          .feedbackHeader,
          .explainHeader,
          .newsHeader,
          .askFooter {
            flex-direction:
              column;
          }

          .answerCard,
          .askPanel {
            padding: 21px;
          }

          .loadingGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .methodBadge {
            align-self:
              flex-start;
          }
        }
      `}</style>
    </>
  );
}