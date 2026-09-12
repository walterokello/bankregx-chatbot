import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

function createUserId() {
  if (typeof window === "undefined") {
    return "bankregx-regulatory";
  }

  const existing =
    window.localStorage.getItem(
      "bankregxUserId"
    );

  if (existing) {
    return existing;
  }

  const generated =
    `brx_${Date.now().toString(
      36
    )}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

  window.localStorage.setItem(
    "bankregxUserId",
    generated
  );

  return generated;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function formatDate(value) {
  const date =
    parseDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatRefreshTime(
  value
) {
  const date =
    parseDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}

export default function RegulatoryIntelligence() {
  const [feeds, setFeeds] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    sourceFilter,
    setSourceFilter,
  ] = useState("all");

  const [
    refreshedAt,
    setRefreshedAt,
  ] = useState(null);

  const [userId, setUserId] =
    useState(
      "bankregx-regulatory"
    );

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(null);

  const [
    analysis,
    setAnalysis,
  ] = useState(null);

  const [
    analysisLoading,
    setAnalysisLoading,
  ] = useState(false);

  const [
    analysisError,
    setAnalysisError,
  ] = useState("");

  useEffect(() => {
    setUserId(
      createUserId()
    );

    loadFeeds();
  }, []);

  const allItems =
    useMemo(() => {
      const rows = [];

      feeds.forEach(
        (feed) => {
          const source =
            feed?.source ||
            feed?.name ||
            "Regulator";

          (
            feed?.items || []
          ).forEach(
            (item) => {
              rows.push({
                ...item,
                source,
              });
            }
          );
        }
      );

      return rows.sort(
        (a, b) => {
          const aDate =
            parseDate(
              a?.isoDate ||
                a?.pubDate
            )?.getTime() ||
            0;

          const bDate =
            parseDate(
              b?.isoDate ||
                b?.pubDate
            )?.getTime() ||
            0;

          return (
            bDate -
            aDate
          );
        }
      );
    }, [feeds]);

  const sources =
    useMemo(() => {
      return [
        ...new Set(
          allItems
            .map(
              (item) =>
                item.source
            )
            .filter(Boolean)
        ),
      ].sort();
    }, [allItems]);

  const filteredItems =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return allItems.filter(
        (item) => {
          const matchesSource =
            sourceFilter ===
              "all" ||
            item.source ===
              sourceFilter;

          if (
            !matchesSource
          ) {
            return false;
          }

          if (!term) {
            return true;
          }

          const haystack = [
            item?.title,
            item?.summary,
            item?.description,
            item?.contentSnippet,
            item?.source,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            term
          );
        }
      );
    }, [
      allItems,
      search,
      sourceFilter,
    ]);

  const latestPublished =
    allItems.length
      ? allItems[0]
          ?.isoDate ||
        allItems[0]
          ?.pubDate
      : null;

  async function loadFeeds() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/regulatory-news"
        );

      const text =
        await response.text();

      let data = [];

      try {
        data = text
          ? JSON.parse(text)
          : [];
      } catch {
        throw new Error(
          text ||
            "Unexpected regulatory feed response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to load regulatory intelligence."
        );
      }

      setFeeds(
        Array.isArray(data)
          ? data
          : []
      );

      setRefreshedAt(
        new Date()
      );
    } catch (loadError) {
      console.error(
        "Regulatory intelligence load failed:",
        loadError
      );

      setError(
        loadError?.message ||
          "Unable to load regulatory intelligence."
      );

      setFeeds([]);
    } finally {
      setLoading(false);
    }
  }

  async function analyseItem(
    item
  ) {
    if (
      !item ||
      analysisLoading
    ) {
      return;
    }

    setSelectedItem(item);

    setAnalysis(null);

    setAnalysisError("");

    setAnalysisLoading(
      true
    );

    const summary =
      item?.summary ||
      item?.description ||
      item?.contentSnippet ||
      "No detailed summary was available from the feed.";

    const prompt = `Analyse the potential control impact of the regulatory development below.

First establish what is actually stated by the regulator. Then identify what is not known, assess which banking products, businesses, processes, risks or controls may be affected, consider whether existing controls may already address the issue, and distinguish clearly between REGULATORY FACT, BANKREGX JUDGEMENT and RECOMMENDED ACTION.

Regulator: ${
      item?.source ||
      "Unknown"
    }
Title: ${
      item?.title ||
      "Untitled development"
    }
Published: ${formatDate(
      item?.isoDate ||
        item?.pubDate
    )}
Summary: ${summary}
Source: ${
      item?.link ||
      "Not available"
    }`;

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

            body: JSON.stringify(
              {
                query:
                  prompt,

                userId,
              }
            ),
          }
        );

      const text =
        await response.text();

      let data = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          text ||
            "BankRegX returned an unexpected response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to analyse this development."
        );
      }

      setAnalysis(data);
    } catch (
      analysisFailure
    ) {
      setAnalysisError(
        analysisFailure
          ?.message ||
          "Unable to analyse this development."
      );
    } finally {
      setAnalysisLoading(
        false
      );
    }
  }

  function closeAnalysis() {
    setSelectedItem(null);

    setAnalysis(null);

    setAnalysisError("");

    setAnalysisLoading(
      false
    );
  }

  return (
    <>
      <main className="page">
        <SiteHeader />

        <section className="hero">
          <div>
            <div className="eyebrow">
              MONITOR
            </div>

            <h1>
              Regulatory Intelligence
            </h1>

            <p>
              Monitor regulatory
              developments and assess what
              they could mean for banking
              risks, controls and audit
              priorities.
            </p>
          </div>

          <button
            type="button"
            className="refreshButton"
            onClick={loadFeeds}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh feeds"}
          </button>
        </section>

        <section className="statsGrid">
          <StatCard
            label="Developments"
            value={String(
              allItems.length
            )}
          />

          <StatCard
            label="Sources"
            value={String(
              sources.length
            )}
          />

          <StatCard
            label="Latest published"
            value={formatDate(
              latestPublished
            )}
          />

          <StatCard
            label="Feed refreshed"
            value={formatRefreshTime(
              refreshedAt
            )}
          />
        </section>

        <section className="feedSection">
          <div className="feedHeading">
            <div>
              <div className="eyebrow">
                LIVE FEEDS
              </div>

              <h2>
                Regulatory developments
              </h2>

              <p>
                Review current
                developments from
                connected regulatory
                sources, then ask BankRegX
                to assess potential control
                implications.
              </p>
            </div>
          </div>

          <div className="filters">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search developments..."
            />

            <select
              value={
                sourceFilter
              }
              onChange={(event) =>
                setSourceFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All sources
              </option>

              {sources.map(
                (source) => (
                  <option
                    key={
                      source
                    }
                    value={
                      source
                    }
                  >
                    {
                      source
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {error ? (
            <div className="errorBox">
              {error}
            </div>
          ) : null}

          {loading &&
          allItems.length ===
            0 ? (
            <div className="statePanel">
              Loading regulatory
              intelligence...
            </div>
          ) : filteredItems.length >
            0 ? (
            <div className="newsGrid">
              {filteredItems.map(
                (
                  item,
                  index
                ) => (
                  <article
                    className="newsCard"
                    key={`${
                      item?.link ||
                      item?.title
                    }-${index}`}
                  >
                    <div className="cardMeta">
                      <span className="sourceBadge">
                        {
                          item?.source
                        }
                      </span>

                      <span className="dateText">
                        {formatDate(
                          item?.isoDate ||
                            item?.pubDate
                        )}
                      </span>
                    </div>

                    <h3>
                      {item?.title ||
                        "Untitled regulatory development"}
                    </h3>

                    <p className="summary">
                      {item?.summary ||
                        item?.description ||
                        item?.contentSnippet ||
                        "The feed did not provide a substantive summary. BankRegX can still assess the headline and available source information."}
                    </p>

                    {item?.summarySource ? (
                      <div className="summaryMeta">
                        {item.summarySource ===
                        "source_page"
                          ? "Source-page summary"
                          : item.summarySource ===
                            "rss"
                          ? "Feed summary"
                          : "Headline only"}
                      </div>
                    ) : null}

                    <div className="cardActions">
                      <button
                        type="button"
                        onClick={() =>
                          analyseItem(
                            item
                          )
                        }
                      >
                        Analyse control impact
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
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="statePanel">
              No developments match the
              current search and source
              filter.
            </div>
          )}
        </section>

        <section className="disciplineSection">
          <div className="disciplineIntro">
            <div className="eyebrow">
              BANKREGX REGULATORY INTELLIGENCE
            </div>

            <h2>
              Source first. Judgement second.
            </h2>

            <p>
              BankRegX is designed to
              separate authoritative
              regulatory facts from
              assumptions, professional
              interpretation and
              recommended actions.
            </p>
          </div>

          <div className="disciplineGrid">
            <DisciplineCard
              number="01"
              title="Regulatory fact"
              text="Start with what the regulator or authoritative source actually states."
            />

            <DisciplineCard
              number="02"
              title="Unknowns"
              text="Identify material information that is not established by the publication."
            />

            <DisciplineCard
              number="03"
              title="BankRegX judgement"
              text="Assess likely relevance to businesses, risks, processes and controls."
            />

            <DisciplineCard
              number="04"
              title="Recommended action"
              text="Identify proportionate next steps without assuming every development creates a new control gap."
            />
          </div>
        </section>

        <SiteFooter />

        {selectedItem ? (
          <div
            className="modalBackdrop"
            role="presentation"
            onMouseDown={
              closeAnalysis
            }
          >
            <div
              className="analysisModal"
              role="dialog"
              aria-modal="true"
              aria-label="Regulatory control impact analysis"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="modalHeader">
                <div>
                  <div className="eyebrow">
                    CONTROL IMPACT ANALYSIS
                  </div>

                  <h2>
                    {
                      selectedItem
                        ?.title
                    }
                  </h2>

                  <div className="modalMeta">
                    {
                      selectedItem
                        ?.source
                    }{" "}
                    ·{" "}
                    {formatDate(
                      selectedItem
                        ?.isoDate ||
                        selectedItem
                          ?.pubDate
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="closeButton"
                  onClick={
                    closeAnalysis
                  }
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="modalBody">
                {analysisLoading ? (
                  <div className="analysisState">
                    BankRegX is assessing
                    the potential control
                    impact...
                  </div>
                ) : analysisError ? (
                  <div className="analysisError">
                    {
                      analysisError
                    }
                  </div>
                ) : analysis?.answer ? (
                  <>
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
                        {
                          analysis.answer
                        }
                      </ReactMarkdown>
                    </div>

                    {Array.isArray(
                      analysis?.browsedPages
                    ) &&
                    analysis
                      .browsedPages
                      .length >
                      0 ? (
                      <div className="sourceBlock">
                        <div className="smallLabel">
                          SOURCES USED
                        </div>

                        <div className="sourceLinks">
                          {analysis.browsedPages.map(
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
                  </>
                ) : null}
              </div>

              <div className="modalFooter">
                {selectedItem?.link ? (
                  <a
                    href={
                      selectedItem.link
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open original source ↗
                  </a>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={
                    closeAnalysis
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(html) {
          background: #0a1a1c;

          scroll-behavior:
            smooth;
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

          text-decoration:
            none !important;
        }

        :global(button),
        :global(input),
        :global(select) {
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
            90px 28px 46px;

          display: flex;

          justify-content:
            space-between;

          align-items:
            flex-end;

          gap: 35px;
        }

        .eyebrow,
        .smallLabel {
          color: #55dbc6;

          font-size: 10px;

          font-weight: 800;

          letter-spacing:
            0.18em;
        }

        .hero h1 {
          margin:
            15px 0 16px;

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

        .hero p {
          max-width: 720px;

          margin: 0;

          color: #d1dfdc;

          font-size: 18px;

          line-height: 1.65;
        }

        .refreshButton {
          min-height: 42px;

          padding:
            0 15px;

          flex-shrink: 0;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.32
            );

          border-radius: 8px;

          background:
            rgba(
              20,
              184,
              166,
              0.09
            );

          color: #68dfcd;

          cursor: pointer;

          font-size: 11px;

          font-weight: 800;
        }

        .refreshButton:disabled {
          opacity: 0.55;

          cursor: default;
        }

        .statsGrid {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            0 28px 66px;

          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(
                0,
                1fr
              )
            );

          gap: 11px;
        }

        .feedSection,
        .disciplineSection {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            74px 28px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .feedHeading,
        .disciplineIntro {
          max-width: 720px;

          margin-bottom: 28px;
        }

        .feedHeading h2,
        .disciplineIntro h2,
        .modalHeader h2 {
          margin:
            8px 0 10px;

          color: #f7fcfb;

          font-size: 30px;

          letter-spacing:
            -0.025em;
        }

        .feedHeading p,
        .disciplineIntro p {
          margin: 0;

          color: #a2b7b3;

          font-size: 14px;

          line-height: 1.7;
        }

        .filters {
          display: grid;

          grid-template-columns:
            minmax(
              0,
              1fr
            )
            210px;

          gap: 10px;

          margin-bottom: 20px;
        }

        .filters input,
        .filters select {
          min-height: 44px;

          padding:
            0 13px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius: 8px;

          outline: none;

          background:
            rgba(
              5,
              19,
              20,
              0.48
            );

          color: #dce8e5;

          font-size: 12px;
        }

        .filters input::placeholder {
          color: #78918d;
        }

        .filters input:focus,
        .filters select:focus {
          border-color:
            rgba(
              45,
              212,
              191,
              0.48
            );
        }

        .errorBox,
        .statePanel {
          padding: 18px;

          border-radius: 10px;

          font-size: 12px;
        }

        .errorBox {
          margin-bottom: 18px;

          border:
            1px solid
            rgba(
              248,
              113,
              113,
              0.28
            );

          background:
            rgba(
              248,
              113,
              113,
              0.06
            );

          color: #fecaca;
        }

        .statePanel {
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
              0.03
            );

          color: #9fb3af;
        }

        .newsGrid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );

          gap: 13px;
        }

        .newsCard {
          min-height: 310px;

          padding: 22px;

          display: flex;

          flex-direction:
            column;

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
        }

        .cardMeta {
          display: flex;

          justify-content:
            space-between;

          align-items:
            center;

          gap: 12px;
        }

        .sourceBadge {
          padding:
            5px 7px;

          border-radius: 6px;

          background:
            rgba(
              20,
              184,
              166,
              0.12
            );

          color: #67dfcd;

          font-size: 8px;

          font-weight: 800;

          letter-spacing:
            0.09em;

          text-transform:
            uppercase;
        }

        .dateText {
          color: #8fa6a2;

          font-size: 9.5px;
        }

        .newsCard h3 {
          margin:
            18px 0 11px;

          color: #eef7f5;

          font-size: 17px;

          line-height: 1.45;

          letter-spacing:
            -0.012em;
        }

        .summary {
          margin: 0;

          color: #a3b8b4;

          font-size: 12px;

          line-height: 1.7;

          display:
            -webkit-box;

          -webkit-line-clamp:
            5;

          -webkit-box-orient:
            vertical;

          overflow: hidden;
        }

        .summaryMeta {
          margin-top: 10px;

          color: #728d88;

          font-size: 9px;
        }

        .cardActions {
          display: flex;

          align-items: center;

          gap: 14px;

          margin-top: auto;

          padding-top: 22px;
        }

        .cardActions button {
          min-height: 36px;

          padding:
            0 11px;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.28
            );

          border-radius: 7px;

          background:
            rgba(
              20,
              184,
              166,
              0.08
            );

          color: #67dfcd;

          cursor: pointer;

          font-size: 10px;

          font-weight: 800;
        }

        .cardActions button:hover {
          background:
            rgba(
              20,
              184,
              166,
              0.13
            );

          border-color:
            rgba(
              45,
              212,
              191,
              0.46
            );
        }

        .cardActions a {
          color: #9ab0ac;

          font-size: 10px;
        }

        .disciplineGrid {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );

          gap: 11px;
        }

        .modalBackdrop {
          position: fixed;

          inset: 0;

          z-index: 100;

          display: grid;

          place-items: center;

          padding: 24px;

          background:
            rgba(
              2,
              9,
              10,
              0.76
            );

          backdrop-filter:
            blur(8px);
        }

        .analysisModal {
          width:
            min(
              930px,
              100%
            );

          max-height:
            calc(
              100vh -
              48px
            );

          display: flex;

          flex-direction:
            column;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );

          border-radius: 16px;

          background: #0d2022;

          box-shadow:
            0 25px 80px
            rgba(
              0,
              0,
              0,
              0.35
            );
        }

        .modalHeader {
          padding: 24px;

          display: flex;

          justify-content:
            space-between;

          gap: 24px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.09
            );
        }

        .modalHeader h2 {
          max-width: 760px;

          font-size: 23px;

          line-height: 1.35;
        }

        .modalMeta {
          margin-top: 8px;

          color: #91a9a5;

          font-size: 10px;
        }

        .closeButton {
          width: 34px;

          height: 34px;

          flex-shrink: 0;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius: 8px;

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );

          color: #cbdad7;

          cursor: pointer;

          font-size: 21px;

          line-height: 1;
        }

        .modalBody {
          overflow-y: auto;

          padding: 24px;
        }

        .analysisState,
        .analysisError {
          padding: 18px;

          border-radius: 10px;

          font-size: 12px;
        }

        .analysisState {
          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.16
            );

          background:
            rgba(
              20,
              184,
              166,
              0.05
            );

          color: #b4cbc7;
        }

        .analysisError {
          border:
            1px solid
            rgba(
              248,
              113,
              113,
              0.24
            );

          background:
            rgba(
              248,
              113,
              113,
              0.05
            );

          color: #fecaca;
        }

        .markdown {
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
          margin-top: 22px;

          font-size: 15px;
        }

        .markdown :global(strong) {
          color: #edf7f5;
        }

        .markdown :global(a) {
          color: #5adac6;
        }

        .sourceBlock {
          margin-top: 24px;

          padding-top: 18px;

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

        .modalFooter {
          padding:
            15px 24px;

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 20px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.09
            );
        }

        .modalFooter a {
          color: #67dfcd;

          font-size: 10px;

          font-weight: 700;
        }

        .modalFooter button {
          min-height: 35px;

          padding:
            0 12px;

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

          color: #c2d2ce;

          cursor: pointer;

          font-size: 10px;
        }

        @media (
          max-width: 950px
        ) {
          .statsGrid,
          .disciplineGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }
        }

        @media (
          max-width: 760px
        ) {
          .hero {
            align-items:
              flex-start;

            flex-direction:
              column;

            padding-top:
              66px;
          }

          .newsGrid {
            grid-template-columns:
              1fr;
          }

          .filters {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          max-width: 560px
        ) {
          .hero,
          .statsGrid,
          .feedSection,
          .disciplineSection {
            padding-left:
              18px;

            padding-right:
              18px;
          }

          .statsGrid,
          .disciplineGrid {
            grid-template-columns:
              1fr;
          }

          .hero h1 {
            font-size:
              43px;
          }

          .hero p {
            font-size:
              16px;
          }

          .modalBackdrop {
            padding: 10px;
          }

          .modalHeader,
          .modalBody,
          .modalFooter {
            padding-left:
              17px;

            padding-right:
              17px;
          }
        }
      `}</style>
    </>
  );
}

function SiteHeader() {
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
              className="navLink"
            >
              Home
            </Link>

            <Link
              href="/regulatory-news"
              className="navLink active"
            >
              Regulatory Intelligence
            </Link>

            <Link
              href="/docs"
              className="navLink"
            >
              Docs
            </Link>

            <Link
              href="/security-governance"
              className="navLink"
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

function StatCard({
  label,
  value,
}) {
  return (
    <>
      <div className="statCard">
        <div className="value">
          {value}
        </div>

        <div className="label">
          {label}
        </div>
      </div>

      <style jsx>{`
        .statCard {
          min-height: 105px;

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

        .value {
          color: #edf7f5;

          font-size: 20px;

          font-weight: 700;

          line-height: 1.2;
        }

        .label {
          margin-top: 9px;

          color: #91aaa6;

          font-size: 10px;
        }
      `}</style>
    </>
  );
}

function DisciplineCard({
  number,
  title,
  text,
}) {
  return (
    <>
      <div className="disciplineCard">
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
        .disciplineCard {
          min-height: 180px;

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
          margin-bottom: 28px;

          color: #55dbc6;

          font-size: 9px;

          font-weight: 800;
        }

        h3 {
          margin:
            0 0 8px;

          color: #edf6f4;

          font-size: 14px;
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
          BankRegX regulatory analysis
          supports professional judgement
          and should be validated against
          the authoritative source.
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