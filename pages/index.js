import MembershipPanel, { useMembership } from "../components/MembershipPanel";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const MODES = [
  {
    id: "ask",
    number: "01",
    title: "Ask anything",
    description: "Ask BankRegX about controls, audit, risk or regulation.",
    placeholder: "Ask a question about controls, audit, risk or regulation...",
  },
  {
    id: "control",
    number: "02",
    title: "Assess a control",
    description: "Evaluate control design using BankRegX expert methodology.",
    placeholder: "Describe the risk and control you want BankRegX to assess...",
  },
  {
    id: "regulatory",
    number: "03",
    title: "Analyse regulatory impact",
    description: "Assess what a regulatory development could mean for risks and controls.",
    placeholder: "Paste or describe a regulatory development to assess...",
  },
  {
    id: "finding",
    number: "04",
    title: "Review a finding",
    description: "Challenge the logic, evidence and significance of an audit or controls finding.",
    placeholder: "Paste the finding, evidence and management context you want reviewed...",
  },
];

function buildPrompt(mode, query) {
  const text = String(query || "").trim();

  if (mode === "control") {
    return `Assess the following control design using BankRegX expert methodology. Distinguish the stated facts from assumptions, identify the underlying risk, assess the causal relationship between the risk and the control, and separate design effectiveness from operating effectiveness.\n\n${text}`;
  }

  if (mode === "regulatory") {
    return `Analyse the regulatory impact of the following development. Establish the regulatory facts first, identify what is not known, then assess likely relevance to risks and existing controls. Clearly distinguish regulatory fact, BankRegX judgement and recommended action.\n\n${text}`;
  }

  if (mode === "finding") {
    return `Review the following audit or controls finding. Challenge the logic, evidence, risk articulation, control linkage and significance. Distinguish facts from assumptions and explain whether the conclusion is adequately supported.\n\n${text}`;
  }

  return text;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function Home() {
  const membership = useMembership();
  const [mode, setMode] = useState("ask");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const userId = membership.usage?.userId || "bankregx-web";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [feeds, setFeeds] = useState([]);
  const [feedsLoading, setFeedsLoading] = useState(true);

  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    loadRegulatoryIntelligence();
  }, []);

  const selectedMode = useMemo(
    () => MODES.find((item) => item.id === mode) || MODES[0],
    [mode]
  );

  const regulatoryPreview = useMemo(() => {
    const items = [];

    feeds.forEach((feed) => {
      const source = feed?.source || feed?.name || "Regulator";

      (feed?.items || []).forEach((item) => {
        items.push({
          ...item,
          source,
        });
      });
    });

    return items
      .sort((a, b) => {
        const aTime = new Date(a?.isoDate || a?.pubDate || 0).getTime();
        const bTime = new Date(b?.isoDate || b?.pubDate || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 3);
  }, [feeds]);

  async function loadRegulatoryIntelligence() {
    setFeedsLoading(true);

    try {
      const response = await fetch("/api/regulatory-news");
      const data = await response.json();

      setFeeds(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Unable to load regulatory intelligence:", loadError);
      setFeeds([]);
    } finally {
      setFeedsLoading(false);
    }
  }

  async function runAssessment() {
    const cleanQuery = query.trim();

    if (!cleanQuery || loading || membership.loading || !membership.usage || membership.usage.remaining === 0) {
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSubmittedQuery(cleanQuery);
    setFeedbackType("");
    setFeedbackText("");
    setFeedbackStatus("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...await membership.headers(),
        },
        body: JSON.stringify({
          query: buildPrompt(mode, cleanQuery),
          userId,
        }),
      });

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || "BankRegX returned an unexpected response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to complete the assessment."
        );
      }

      setResult(data);
    } catch (assessmentError) {
      setError(
        assessmentError?.message ||
          "BankRegX could not complete the assessment. Please try again."
      );
    } finally {
      setLoading(false);
      membership.refresh();
    }
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runAssessment();
    }
  }

  function chooseRegulatoryItem(item) {
    setMode("regulatory");

    const summary =
      item?.summary ||
      item?.description ||
      item?.contentSnippet ||
      "";

    setQuery(
      [
        `${item?.source || "Regulatory"} development: ${item?.title || ""}`,
        summary ? `Summary: ${summary}` : "",
        item?.link ? `Source: ${item.link}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    );

    window.setTimeout(() => {
      document
        .getElementById("assessment-workspace")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 0);
  }

  async function submitFeedback(type, detail = "") {
    if (!result?.answer || feedbackLoading) {
      return;
    }

    setFeedbackLoading(true);
    setFeedbackStatus("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          aiResponse: result.answer,
          feedback: type,
          feedbackType: type,
          responseId: result?.responseId || null,
          query: submittedQuery,
          userQuery: submittedQuery,
          correction: detail || null,
          rationale: detail || null,
        }),
      });

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to record feedback."
        );
      }

      setFeedbackStatus(
        type === "approve"
          ? "Assessment approved. Thank you."
          : "Feedback recorded for expert review."
      );

      setFeedbackType("");
      setFeedbackText("");
    } catch (feedbackError) {
      setFeedbackStatus(
        feedbackError?.message ||
          "Unable to record feedback."
      );
    } finally {
      setFeedbackLoading(false);
    }
  }

  const methodologyTrace =
    result?.methodologyTrace?.length > 0
      ? result.methodologyTrace
      : result?.expertGuidance || [];

  return (
    <>
      <main className="page">
        <SiteHeader active="home" />

        <section className="hero">
          <div className="eyebrow">
            YOUR FINANCIAL SERVICES CONTROLS COMPANION
          </div>

          <h1>
            BankRegX
          </h1>

          <p className="heroText">
            Financial Services controls made easy
          </p>
        </section>

        <section
          className="modeGrid"
          aria-label="Assessment modes"
        >
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                mode === item.id
                  ? "modeCard active"
                  : "modeCard"
              }
              onClick={() =>
                setMode(item.id)
              }
            >
              <div className="modeTop">
                <span className="modeNumber">
                  {item.number}
                </span>

                <span className="modeIndicator">
                  {mode === item.id
                    ? "●"
                    : "○"}
                </span>
              </div>

              <h2>
                {item.title}
              </h2>

              <p>
                {item.description}
              </p>
            </button>
          ))}
        </section>

        <MembershipPanel membership={membership} />

        <section
          id="assessment-workspace"
          className="workspaceSection"
        >
          <div className="workspaceHeader">
            <div>
              <div className="sectionEyebrow">
                {selectedMode.title.toUpperCase()}
              </div>

              <h2>
                BankRegX assessment
              </h2>
            </div>

            <div className="shortcut">
              Ctrl + Enter
            </div>
          </div>

          <div className="assessmentCard">
            <textarea
              className="queryInput"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={
                selectedMode.placeholder
              }
              rows={7}
            />

            <div className="inputFooter">
              <div className="inputNote">
                BankRegX distinguishes facts,
                unknowns, assumptions and
                professional judgement.
              </div>

              <button
                type="button"
                className="primaryButton"
                onClick={runAssessment}
                disabled={
                  loading || membership.loading || !membership.usage || membership.usage.remaining === 0 ||
                  !query.trim()
                }
              >
                {loading
                  ? "Assessing..."
                  : "Ask BankRegX"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="errorBox">
              {error}
            </div>
          ) : null}

          {result?.answer ? (
            <div className="resultLayout">
              <article className="answerCard">
                <div className="answerHeader">
                  <div>
                    <div className="sectionEyebrow">
                      BANKREGX ASSESSMENT
                    </div>

                    <h2>
                      Professional analysis
                    </h2>
                  </div>

                  {result?.debug
                    ?.webSearchUsed ? (
                    <span className="liveBadge">
                      LIVE RESEARCH
                    </span>
                  ) : null}
                </div>

                <div className="markdown">
                  <ReactMarkdown
                    components={{
                      a: ({
                        node,
                        ...props
                      }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noreferrer"
                        />
                      ),
                    }}
                  >
                    {result.answer}
                  </ReactMarkdown>
                </div>

                {Array.isArray(
                  result?.browsedPages
                ) &&
                result.browsedPages
                  .length > 0 ? (
                  <div className="sourcesBlock">
                    <div className="smallLabel">
                      SOURCES USED
                    </div>

                    <div className="sourceLinks">
                      {result.browsedPages.map(
                        (
                          source,
                          index
                        ) => (
                          <a
                            key={`${
                              source?.url ||
                              index
                            }`}
                            href={
                              source?.url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {source?.title ||
                              `Source ${
                                index +
                                1
                              }`}{" "}
                            ↗
                          </a>
                        )
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="feedbackBlock">
                  <div>
                    <div className="smallLabel">
                      EXPERT FEEDBACK
                    </div>

                    <p>
                      Help BankRegX identify
                      assessments that should be
                      reviewed by an expert.
                    </p>
                  </div>

                  <div className="feedbackButtons">
                    <button
                      type="button"
                      onClick={() =>
                        submitFeedback(
                          "approve"
                        )
                      }
                      disabled={
                        feedbackLoading
                      }
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackType(
                          "correct"
                        );
                        setFeedbackStatus(
                          ""
                        );
                      }}
                      disabled={
                        feedbackLoading
                      }
                    >
                      Correct
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackType(
                          "reject"
                        );
                        setFeedbackStatus(
                          ""
                        );
                      }}
                      disabled={
                        feedbackLoading
                      }
                    >
                      Reject
                    </button>
                  </div>

                  {feedbackType ? (
                    <div className="feedbackEditor">
                      <textarea
                        value={
                          feedbackText
                        }
                        onChange={(
                          event
                        ) =>
                          setFeedbackText(
                            event
                              .target
                              .value
                          )
                        }
                        rows={4}
                        placeholder={
                          feedbackType ===
                          "correct"
                            ? "What should BankRegX have concluded or considered differently?"
                            : "Why should this assessment be rejected?"
                        }
                      />

                      <div className="feedbackEditorActions">
                        <button
                          type="button"
                          className="quietButton"
                          onClick={() => {
                            setFeedbackType(
                              ""
                            );
                            setFeedbackText(
                              ""
                            );
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="primarySmall"
                          disabled={
                            feedbackLoading ||
                            !feedbackText.trim()
                          }
                          onClick={() =>
                            submitFeedback(
                              feedbackType,
                              feedbackText.trim()
                            )
                          }
                        >
                          {feedbackLoading
                            ? "Saving..."
                            : "Submit for review"}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {feedbackStatus ? (
                    <div className="feedbackStatus">
                      {feedbackStatus}
                    </div>
                  ) : null}
                </div>
              </article>

              <aside className="methodologyCard">
                <div className="sectionEyebrow">
                  METHODOLOGY
                </div>

                <h2>
                  Methodology informing this
                  assessment
                </h2>

                <p className="methodIntro">
                  Approved BankRegX guidance
                  retrieved as relevant to this
                  assessment.
                </p>

                {methodologyTrace.length >
                0 ? (
                  <div className="methodList">
                    {methodologyTrace.map(
                      (
                        item,
                        index
                      ) => {
                        const guidanceId =
                          item?.guidanceId ||
                          item?.id ||
                          item?.documentId;

                        const version =
                          item?.version;

                        return (
                          <div
                            className="methodItem"
                            key={`${
                              item?.documentId ||
                              guidanceId ||
                              index
                            }-${index}`}
                          >
                            <div className="methodMeta">
                              <span>
                                {guidanceId ||
                                  `Principle ${
                                    index +
                                    1
                                  }`}
                              </span>

                              {version ? (
                                <span>
                                  v
                                  {
                                    version
                                  }
                                </span>
                              ) : null}
                            </div>

                            <strong>
                              {item?.title ||
                                "BankRegX expert principle"}
                            </strong>

                            {(item?.category ||
                              item?.subcategory) && (
                              <span className="methodCategory">
                                {[
                                  item?.category,
                                  item?.subcategory,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " · "
                                  )}
                              </span>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="emptyMethod">
                    No specific expert
                    principles were returned
                    for this assessment.
                  </div>
                )}
              </aside>
            </div>
          ) : null}
        </section>

        <section className="monitorSection">
          <div className="sectionHeadingRow">
            <div>
              <div className="sectionEyebrow">
                MONITOR
              </div>

              <h2>
                Regulatory intelligence
              </h2>

              <p>
                Review emerging developments
                and ask BankRegX what they
                could mean for existing risks
                and controls.
              </p>
            </div>

            <div className="sectionActions">
              <Link
                href="/regulatory-news"
                className="secondaryAction"
              >
                View full intelligence
              </Link>

              <button
                type="button"
                className="quietAction"
                onClick={
                  loadRegulatoryIntelligence
                }
                disabled={
                  feedsLoading
                }
              >
                {feedsLoading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </div>

          {feedsLoading &&
          regulatoryPreview.length ===
            0 ? (
            <div className="loadingPanel">
              Loading regulatory
              intelligence...
            </div>
          ) : regulatoryPreview.length >
            0 ? (
            <div className="regGrid">
              {regulatoryPreview.map(
                (
                  item,
                  index
                ) => (
                  <div
                    className="regCard"
                    key={`${
                      item?.link ||
                      item?.title
                    }-${index}`}
                  >
                    <div className="regMeta">
                      <span>
                        {
                          item?.source
                        }
                      </span>

                      <span>
                        {formatDate(
                          item?.isoDate ||
                            item?.pubDate
                        )}
                      </span>
                    </div>

                    <h3>
                      {item?.title}
                    </h3>

                    <p>
                      {item?.summary ||
                        item?.description ||
                        item?.contentSnippet ||
                        "Open the development or ask BankRegX to assess the potential control impact."}
                    </p>

                    <div className="regActions">
                      <button
                        type="button"
                        onClick={() =>
                          chooseRegulatoryItem(
                            item
                          )
                        }
                      >
                        Analyse impact
                      </button>

                      {item?.link ? (
                        <a
                          href={
                            item.link
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open source ↗
                        </a>
                      ) : null}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="loadingPanel">
              Regulatory intelligence is
              temporarily unavailable.
            </div>
          )}
        </section>

        <section className="modelSection">
          <div className="modelIntro">
            <div className="sectionEyebrow">
              BANKREGX INTELLIGENCE MODEL
            </div>

            <h2>
              From AI assistant to control
              intelligence
            </h2>

            <p>
              BankRegX combines AI analysis
              with governed expert
              methodology, regulatory
              intelligence and a
              human-controlled learning
              process.
            </p>
          </div>

          <div className="modelGrid">
            <ModelCard
              number="01"
              title="Ask"
              text="Interrogate controls, audit, risk and regulation."
            />

            <ModelCard
              number="02"
              title="Assess"
              text="Apply disciplined methodology to professional judgement."
            />

            <ModelCard
              number="03"
              title="Monitor"
              text="Connect regulatory developments to risks and controls."
            />

            <ModelCard
              number="04"
              title="Learn"
              text="Capture expert review and build governed BankRegX intelligence."
            />
          </div>
        </section>

        <SiteFooter />
      </main>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(html) {
          background: #0a1a1c;
          scroll-behavior: smooth;
        }

        :global(body) {
          margin: 0;
          background: #0a1a1c;
          color: #f4fbfa;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        :global(a) {
          color: inherit;
          text-decoration: none !important;
        }

        :global(button),
        :global(textarea) {
          font: inherit;
        }

        .page {
          min-height: 100vh;

          background:
            radial-gradient(
              circle at 18% 0%,
              rgba(
                20,
                184,
                166,
                0.14
              ),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              #0a1a1c 0%,
              #0d2022 52%,
              #091719 100%
            );
        }

        .hero {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            92px 28px 42px;
        }

        .eyebrow,
        .sectionEyebrow,
        .smallLabel {
          color: #55dbc6;

          font-size: 10px;

          font-weight: 800;

          letter-spacing:
            0.18em;
        }

        .hero h1 {
          max-width: 820px;

          margin:
            15px 0 18px;

          color: #f8fcfb;

          font-size:
            clamp(
              44px,
              6vw,
              68px
            );

          line-height: 1;

          letter-spacing:
            -0.045em;
        }

        .heroText {
          max-width: 790px;

          margin: 0;

          color: #d1dfdc;

          font-size: 19px;

          line-height: 1.65;
        }

        .modeGrid {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            0 28px 68px;

          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(
                0,
                1fr
              )
            );

          gap: 12px;
        }

        .modeCard {
          min-height: 190px;

          padding: 22px;

          text-align: left;

          cursor: pointer;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius: 13px;

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );

          color: inherit;

          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .modeCard:hover {
          transform:
            translateY(-2px);

          border-color:
            rgba(
              45,
              212,
              191,
              0.28
            );

          background:
            rgba(
              20,
              184,
              166,
              0.055
            );
        }

        .modeCard.active {
          border-color:
            rgba(
              45,
              212,
              191,
              0.48
            );

          background:
            rgba(
              20,
              184,
              166,
              0.09
            );
        }

        .modeTop {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          margin-bottom: 30px;
        }

        .modeNumber,
        .modeIndicator {
          color: #55dbc6;

          font-size: 10px;

          font-weight: 800;
        }

        .modeCard h2 {
          margin:
            0 0 9px;

          color: #f0f7f5;

          font-size: 16px;
        }

        .modeCard p {
          margin: 0;

          color: #a3b8b4;

          font-size: 12.5px;

          line-height: 1.65;
        }

        .workspaceSection,
        .monitorSection,
        .modelSection {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            75px 28px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .workspaceHeader,
        .sectionHeadingRow {
          display: flex;

          justify-content:
            space-between;

          align-items:
            flex-end;

          gap: 30px;

          margin-bottom: 26px;
        }

        .workspaceHeader h2,
        .sectionHeadingRow h2,
        .modelIntro h2,
        .answerHeader h2,
        .methodologyCard h2 {
          margin:
            8px 0 0;

          color: #f7fcfb;

          font-size: 29px;

          letter-spacing:
            -0.025em;
        }

        .sectionHeadingRow p,
        .modelIntro p {
          max-width: 660px;

          margin:
            10px 0 0;

          color: #a2b7b3;

          font-size: 14px;

          line-height: 1.7;
        }

        .shortcut {
          color: #91aaa6;

          font-size: 11px;
        }

        .assessmentCard,
        .answerCard,
        .methodologyCard,
        .loadingPanel,
        .regCard {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius: 14px;

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );
        }

        .assessmentCard {
          padding: 18px;
        }

        .queryInput {
          display: block;

          width: 100%;

          resize: vertical;

          min-height: 150px;

          padding: 18px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius: 10px;

          outline: none;

          background:
            rgba(
              5,
              19,
              20,
              0.48
            );

          color: #edf7f5;

          font-size: 14px;

          line-height: 1.65;
        }

        .queryInput::placeholder {
          color: #78918d;
        }

        .queryInput:focus {
          border-color:
            rgba(
              45,
              212,
              191,
              0.5
            );

          box-shadow:
            0 0 0 3px
            rgba(
              20,
              184,
              166,
              0.07
            );
        }

        .inputFooter {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 25px;

          padding:
            15px 2px 0;
        }

        .inputNote {
          color: #94aaa6;

          font-size: 11px;

          line-height: 1.55;
        }

        .primaryButton,
        .primarySmall {
          border: none;

          border-radius: 8px;

          background: #35d1ba;

          color: #041514;

          font-weight: 800;

          cursor: pointer;
        }

        .primaryButton {
          min-height: 43px;

          padding:
            0 18px;

          flex-shrink: 0;

          font-size: 12px;
        }

        .primarySmall {
          padding:
            9px 12px;

          font-size: 11px;
        }

        .primaryButton:disabled,
        .primarySmall:disabled {
          opacity: 0.45;

          cursor: default;
        }

        .errorBox {
          margin-top: 14px;

          padding:
            14px 16px;

          border:
            1px solid
            rgba(
              248,
              113,
              113,
              0.28
            );

          border-radius: 10px;

          background:
            rgba(
              248,
              113,
              113,
              0.06
            );

          color: #fecaca;

          font-size: 12px;
        }

        .resultLayout {
          display: grid;

          grid-template-columns:
            minmax(
              0,
              1.55fr
            )
            minmax(
              290px,
              0.65fr
            );

          gap: 14px;

          margin-top: 18px;

          align-items:
            start;
        }

        .answerCard,
        .methodologyCard {
          padding: 26px;
        }

        .answerHeader {
          display: flex;

          justify-content:
            space-between;

          gap: 20px;

          align-items:
            flex-start;

          padding-bottom: 20px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .answerHeader h2,
        .methodologyCard h2 {
          font-size: 22px;
        }

        .liveBadge {
          padding:
            6px 8px;

          border-radius: 6px;

          background:
            rgba(
              20,
              184,
              166,
              0.12
            );

          color: #63dfcc;

          font-size: 8px;

          font-weight: 800;

          letter-spacing:
            0.12em;
        }

        .markdown {
          padding-top: 10px;

          color: #c9d9d5;

          font-size: 13.5px;

          line-height: 1.75;
        }

        .markdown :global(h1),
        .markdown :global(h2),
        .markdown :global(h3) {
          color: #f0f7f5;

          line-height: 1.3;
        }

        .markdown :global(h2) {
          margin-top: 28px;

          font-size: 19px;
        }

        .markdown :global(h3) {
          margin-top: 23px;

          font-size: 15px;
        }

        .markdown :global(strong) {
          color: #edf7f5;
        }

        .markdown :global(a) {
          color: #5adac6;
        }

        .markdown :global(li) {
          margin:
            5px 0;
        }

        .sourcesBlock,
        .feedbackBlock {
          margin-top: 24px;

          padding-top: 20px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .sourceLinks {
          display: flex;

          flex-wrap: wrap;

          gap: 8px;

          margin-top: 10px;
        }

        .sourceLinks a {
          padding:
            7px 9px;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.18
            );

          border-radius: 7px;

          color: #9fc3bd;

          font-size: 10px;
        }

        .feedbackBlock p {
          margin:
            7px 0 0;

          color: #95aaa6;

          font-size: 11px;
        }

        .feedbackButtons {
          display: flex;

          gap: 8px;

          margin-top: 13px;
        }

        .feedbackButtons button,
        .quietButton {
          padding:
            8px 11px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius: 7px;

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );

          color: #b9ccc8;

          cursor: pointer;

          font-size: 10px;
        }

        .feedbackButtons button:hover,
        .quietButton:hover {
          border-color:
            rgba(
              45,
              212,
              191,
              0.28
            );

          color: #e7f2ef;
        }

        .feedbackEditor {
          margin-top: 12px;

          padding: 12px;

          border-radius: 9px;

          background:
            rgba(
              5,
              19,
              20,
              0.38
            );
        }

        .feedbackEditor textarea {
          width: 100%;

          resize: vertical;

          padding: 11px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius: 7px;

          outline: none;

          background:
            rgba(
              255,
              255,
              255,
              0.025
            );

          color: #dbe8e5;

          font-size: 11px;

          line-height: 1.6;
        }

        .feedbackEditorActions {
          display: flex;

          justify-content:
            flex-end;

          gap: 8px;

          margin-top: 9px;
        }

        .feedbackStatus {
          margin-top: 10px;

          color: #7cddd0;

          font-size: 10px;
        }

        .methodologyCard {
          position: sticky;

          top: 94px;
        }

        .methodIntro {
          margin:
            10px 0 20px;

          color: #98ada9;

          font-size: 11.5px;

          line-height: 1.6;
        }

        .methodList {
          display: flex;

          flex-direction: column;

          gap: 8px;
        }

        .methodItem {
          padding: 12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );

          border-radius: 9px;

          background:
            rgba(
              5,
              19,
              20,
              0.34
            );
        }

        .methodMeta {
          display: flex;

          justify-content:
            space-between;

          gap: 10px;

          color: #55dbc6;

          font-size: 8px;

          font-weight: 800;

          letter-spacing:
            0.06em;
        }

        .methodItem strong {
          display: block;

          margin-top: 7px;

          color: #dfeae7;

          font-size: 11px;

          line-height: 1.45;
        }

        .methodCategory {
          display: block;

          margin-top: 5px;

          color: #809a95;

          font-size: 9px;

          line-height: 1.45;
        }

        .emptyMethod {
          color: #91a7a3;

          font-size: 11px;

          line-height: 1.6;
        }

        .sectionActions {
          display: flex;

          gap: 8px;

          flex-wrap: wrap;

          justify-content:
            flex-end;
        }

        .secondaryAction,
        .quietAction {
          min-height: 38px;

          display: inline-flex;

          align-items: center;

          justify-content:
            center;

          padding:
            0 13px;

          border-radius: 7px;

          font-size: 10px;

          font-weight: 700;
        }

        .secondaryAction {
          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.28
            );

          background:
            rgba(
              20,
              184,
              166,
              0.08
            );

          color: #65dfcd;
        }

        .quietAction {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          background:
            rgba(
              255,
              255,
              255,
              0.025
            );

          color: #b0c3bf;

          cursor: pointer;
        }

        .loadingPanel {
          padding: 24px;

          color: #9eb2ae;

          font-size: 12px;
        }

        .regGrid {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 12px;
        }

        .regCard {
          min-height: 270px;

          display: flex;

          flex-direction: column;

          padding: 20px;
        }

        .regMeta {
          display: flex;

          justify-content:
            space-between;

          gap: 10px;

          color: #62ddca;

          font-size: 8.5px;

          font-weight: 800;

          letter-spacing:
            0.08em;
        }

        .regMeta span:last-child {
          color: #8fa6a2;

          font-weight: 600;

          letter-spacing: 0;
        }

        .regCard h3 {
          margin:
            17px 0 10px;

          color: #eef7f5;

          font-size: 15px;

          line-height: 1.45;
        }

        .regCard p {
          margin: 0;

          color: #9fb4b0;

          font-size: 11px;

          line-height: 1.65;

          display:
            -webkit-box;

          -webkit-line-clamp: 4;

          -webkit-box-orient:
            vertical;

          overflow: hidden;
        }

        .regActions {
          display: flex;

          align-items: center;

          gap: 12px;

          margin-top: auto;

          padding-top: 20px;
        }

        .regActions button {
          border: none;

          background:
            transparent;

          color: #5edac7;

          padding: 0;

          cursor: pointer;

          font-size: 10px;

          font-weight: 800;
        }

        .regActions a {
          color: #8fa7a3;

          font-size: 10px;
        }

        .modelIntro {
          max-width: 700px;

          margin-bottom: 30px;
        }

        .modelGrid {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );

          gap: 11px;
        }

        @media (
          max-width: 1000px
        ) {
          .modeGrid,
          .modelGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .resultLayout {
            grid-template-columns:
              1fr;
          }

          .methodologyCard {
            position: static;
          }

          .regGrid {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          max-width: 720px
        ) {
          .workspaceHeader,
          .sectionHeadingRow,
          .inputFooter {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .sectionActions {
            justify-content:
              flex-start;
          }

          .hero {
            padding-top:
              66px;
          }
        }

        @media (
          max-width: 560px
        ) {
          .hero,
          .modeGrid,
          .workspaceSection,
          .monitorSection,
          .modelSection {
            padding-left:
              18px;

            padding-right:
              18px;
          }

          .modeGrid,
          .modelGrid {
            grid-template-columns:
              1fr;
          }

          .hero h1 {
            font-size:
              43px;
          }

          .heroText {
            font-size:
              17px;
          }

          .answerCard,
          .methodologyCard {
            padding:
              20px;
          }

          .feedbackButtons {
            flex-wrap:
              wrap;
          }
        }
      `}</style>
    </>
  );
}

function SiteHeader({
  active,
}) {
  return (
    <>
      <div className="siteHeader">
        <div className="siteHeaderInner">
          <Link
            href="/"
            className="brand"
          >
            <div className="brandBadge">
              BRX
            </div>

            <div>
              <div className="brandName">
                BANKREGX
              </div>

              <div className="brandSub">
                AI Control Intelligence for Banking
              </div>
            </div>
          </Link>

          <nav className="nav">
            <Link
              href="/"
              className={
                active === "home"
                  ? "navLink active"
                  : "navLink"
              }
            >
              Home
            </Link>

            <Link
              href="/regulatory-news"
              className={
                active === "regulatory"
                  ? "navLink active"
                  : "navLink"
              }
            >
              Regulatory Intelligence
            </Link>

            <Link
              href="/docs"
              className={
                active === "docs"
                  ? "navLink active"
                  : "navLink"
              }
            >
              Docs
            </Link>

            <Link
              href="/security-governance"
              className={
                active === "security"
                  ? "navLink active"
                  : "navLink"
              }
            >
              Security &amp; Governance
            </Link>
          </nav>

          <Link
            href="/admin"
            className="adminLink"
          >
            <span>
              Governance Admin
            </span>

            <span className="privateTag">
              PRIVATE
            </span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .siteHeader {
          position: sticky;

          top: 0;

          z-index: 50;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          background:
            rgba(
              10,
              26,
              28,
              0.92
            );

          backdrop-filter:
            blur(16px);
        }

        .siteHeaderInner {
          max-width: 1240px;

          min-height: 76px;

          margin: 0 auto;

          padding:
            0 28px;

          display: flex;

          align-items:
            center;

          gap: 28px;
        }

        .brand {
          display: flex;

          align-items:
            center;

          gap: 11px;

          flex-shrink: 0;
        }

        .brandBadge {
          width: 38px;

          height: 38px;

          display: grid;

          place-items:
            center;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.62
            );

          border-radius: 9px;

          background:
            rgba(
              20,
              184,
              166,
              0.13
            );

          color: #6ee7d3;

          font-size: 12px;

          font-weight: 800;

          letter-spacing:
            0.06em;
        }

        .brandName {
          color: #f7fcfb;

          font-size: 14px;

          font-weight: 800;

          letter-spacing:
            0.08em;
        }

        .brandSub {
          margin-top: 2px;

          color: #91aaa6;

          font-size: 10px;

          white-space: nowrap;
        }

        .nav {
          flex: 1;

          display: flex;

          justify-content:
            center;

          align-items:
            center;

          gap: 25px;
        }

        .navLink {
          color: #bdd0cc;

          font-size: 13px;

          white-space: nowrap;
        }

        .navLink:hover {
          color: #f1f8f7;
        }

        .navLink.active {
          color: #64dfcb;
        }

        .adminLink {
          flex-shrink: 0;

          display:
            inline-flex;

          align-items:
            center;

          gap: 8px;

          min-height: 34px;

          padding:
            0 10px;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.33
            );

          border-radius: 7px;

          background:
            rgba(
              20,
              184,
              166,
              0.08
            );

          color: #c4d7d3;

          font-size: 10px;

          font-weight: 700;
        }

        .privateTag {
          padding:
            4px 6px;

          border-radius: 5px;

          background:
            rgba(
              20,
              184,
              166,
              0.16
            );

          color: #65e2cf;

          font-size: 8px;

          font-weight: 800;

          letter-spacing:
            0.11em;
        }

        @media (
          max-width: 1100px
        ) {
          .siteHeaderInner {
            gap: 18px;
          }

          .nav {
            gap: 16px;
          }

          .navLink {
            font-size: 12px;
          }
        }

        @media (
          max-width: 850px
        ) {
          .siteHeaderInner {
            min-height: auto;

            padding-top:
              15px;

            padding-bottom:
              13px;

            flex-wrap: wrap;
          }

          .brand {
            flex: 1;
          }

          .adminLink {
            margin-left: auto;
          }

          .nav {
            order: 3;

            flex:
              0 0 100%;

            width: 100%;

            justify-content:
              flex-start;

            overflow-x: auto;

            padding-bottom:
              2px;
          }
        }

        @media (
          max-width: 560px
        ) {
          .siteHeaderInner {
            padding-left:
              18px;

            padding-right:
              18px;
          }

          .brandSub {
            display: none;
          }

          .adminLink
            > span:first-child {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

function ModelCard({
  number,
  title,
  text,
}) {
  return (
    <>
      <div className="modelCard">
        <div className="number">
          {number}
        </div>

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>
      </div>

      <style jsx>{`
        .modelCard {
          min-height: 170px;

          padding: 20px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius: 12px;

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );
        }

        .number {
          margin-bottom: 27px;

          color: #55dbc6;

          font-size: 9px;

          font-weight: 800;
        }

        h3 {
          margin:
            0 0 8px;

          color: #edf6f4;

          font-size: 15px;
        }

        p {
          margin: 0;

          color: #a2b7b3;

          font-size: 11.5px;

          line-height: 1.65;
        }
      `}</style>
    </>
  );
}

function SiteFooter() {
  return (
    <>
      <div className="siteFooter">
        <div>
          <strong>
            BankRegX
          </strong>

          <span>
            AI Control Intelligence for Banking
          </span>
        </div>

        <div className="footerLinks">
          <Link href="/">
            Home
          </Link>

          <Link href="/regulatory-news">
            Regulatory Intelligence
          </Link>

          <Link href="/docs">
            Docs
          </Link>

          <Link href="/security-governance">
            Security &amp; Governance
          </Link>

          <Link href="/admin">
            Governance Admin · Private
          </Link>
        </div>

        <div className="footerNote">
          BankRegX provides AI-assisted
          professional analysis. Important
          conclusions should be independently
          reviewed and validated.
        </div>
      </div>

      <style jsx>{`
        .siteFooter {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            38px 28px 50px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );

          display: grid;

          grid-template-columns:
            1fr 1fr 1.4fr;

          gap: 35px;

          color: #8fa7a3;

          font-size: 11px;

          line-height: 1.65;
        }

        strong {
          display: block;

          margin-bottom: 3px;

          color: #c3d4d1;

          font-size: 12px;
        }

        span {
          display: block;
        }

        .footerLinks {
          display: flex;

          flex-direction:
            column;

          gap: 5px;
        }

        .footerLinks
          :global(a) {
          color: #a6bbb7;
        }

        .footerLinks
          :global(a:hover) {
          color: #65e0cd;
        }

        .footerNote {
          color: #8ea5a1;
        }

        @media (
          max-width: 850px
        ) {
          .siteFooter {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          max-width: 560px
        ) {
          .siteFooter {
            padding-left:
              18px;

            padding-right:
              18px;
          }
        }
      `}</style>
    </>
  );
}