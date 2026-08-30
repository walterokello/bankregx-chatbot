import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";
import BankRegXNav from "../components/BankRegXNav";

export default function RegulatoryNews() {
  const [
    feeds,
    setFeeds,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    sourceFilter,
    setSourceFilter,
  ] = useState("all");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);

  /*
   * =====================================================
   * REGULATORY IMPACT ANALYSIS
   * =====================================================
   */

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(null);

  const [
    analysis,
    setAnalysis,
  ] = useState("");

  const [
    analysisLoading,
    setAnalysisLoading,
  ] = useState(false);

  const [
    analysisError,
    setAnalysisError,
  ] = useState("");

  const [
    expertGuidance,
    setExpertGuidance,
  ] = useState([]);

  const [
    detectedCategories,
    setDetectedCategories,
  ] = useState([]);

  /*
   * =====================================================
   * INITIAL LOAD
   * =====================================================
   */

  useEffect(() => {
    loadFeeds();
  }, []);

  async function loadFeeds() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/regulatory-news",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load regulatory intelligence."
        );
      }

      if (
        !Array.isArray(data)
      ) {
        throw new Error(
          "Regulatory intelligence returned an unexpected response."
        );
      }

      setFeeds(data);

      setLastUpdated(
        new Date()
      );
    } catch (err) {
      console.error(
        "Failed to fetch regulatory news:",
        err
      );

      setFeeds([]);

      setError(
        err.message ||
          "Unable to load regulatory intelligence."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * NORMALISE FEEDS
   * =====================================================
   */

  const allItems =
    useMemo(() => {
      const flattened = [];

      feeds.forEach(
        (feed) => {
          const items =
            Array.isArray(
              feed?.items
            )
              ? feed.items
              : [];

          items.forEach(
            (
              item,
              index
            ) => {
              flattened.push({
                ...item,

		source:
  		 item.source ||
                 feed.name ||
  		 feed.source ||
                 "Regulatory source",

		feedName:
                 feed.name ||
                 feed.source ||
                 "Regulatory source",
                
                internalId:
                  item.link ||
                  `${feed.name}-${index}`,
              });
            }
          );
        }
      );

      /*
       * Newest dated items first.
       * Undated items remain available afterwards.
       */

      flattened.sort(
        (a, b) => {
          const dateA =
            getDateValue(
              a.pubDate ||
                a.date
            );

          const dateB =
            getDateValue(
              b.pubDate ||
                b.date
            );

          return (
            dateB -
            dateA
          );
        }
      );

      return flattened;
    }, [feeds]);

  /*
   * =====================================================
   * SOURCE LIST
   * =====================================================
   */

  const sources =
    useMemo(() => {
      return Array.from(
        new Set(
          allItems
            .map(
              (item) =>
                item.source
            )
            .filter(
              Boolean
            )
        )
      ).sort();
    }, [allItems]);

  /*
   * =====================================================
   * FILTERED NEWS
   * =====================================================
   */

  const filteredItems =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return allItems.filter(
        (item) => {
          if (
            sourceFilter !==
              "all" &&
            item.source !==
              sourceFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const text = [
            item.title,
            item.description,
            item.summary,
            item.contentSnippet,
            item.source,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(
            query
          );
        }
      );
    }, [
      allItems,
      search,
      sourceFilter,
    ]);

  /*
   * =====================================================
   * STATS
   * =====================================================
   */

  const latestPublished =
    useMemo(() => {
      const dated =
        allItems
          .map(
            (item) =>
              item.pubDate ||
              item.date
          )
          .filter(Boolean)
          .map(
            (value) =>
              new Date(
                value
              )
          )
          .filter(
            (date) =>
              !Number.isNaN(
                date.getTime()
              )
          )
          .sort(
            (a, b) =>
              b.getTime() -
              a.getTime()
          );

      return dated[0] ||
        null;
    }, [allItems]);

  /*
   * =====================================================
   * ANALYSE REGULATORY IMPACT
   * =====================================================
   */

  async function analyseImpact(
    item
  ) {
    setSelectedItem(
      item
    );

    setAnalysis("");
    setAnalysisError("");
    setExpertGuidance([]);
    setDetectedCategories([]);
    setAnalysisLoading(true);

    const summary =
      getSummary(item);

    const prompt = `
Analyse the regulatory and control impact of the following development.

REGULATORY DEVELOPMENT

Source:
${item.source || "Not specified"}

Title:
${item.title || "Not specified"}

Published:
${formatDate(item.pubDate || item.date)}

Summary:
${summary || "No summary was provided in the feed."}

TASK

Assess this development from a banking controls, risk and audit perspective.

Clearly distinguish:

1. Regulatory facts provided by the source.
2. Information that is not known from the source.
3. BankRegX professional judgement.
4. Any assumptions.

Consider:

- the regulatory, conduct, prudential or operational risk involved;
- potentially affected banking activities, processes or products;
- whether existing controls may need to be assessed;
- whether the development indicates:
  - no material control impact;
  - further assessment required;
  - potential control enhancement;
  - a potential control gap;
- what evidence should be reviewed before reaching a conclusion;
- whether immediate action is justified or whether further information is required.

Do not invent regulatory obligations that are not established by the information provided.
`.trim();

    try {
      const response =
        await fetch(
          "/api/ask",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                userId:
                  "bankregx-regulatory-intelligence",

                query:
                  prompt,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to analyse this regulatory development."
        );
      }

      setAnalysis(
        data.answer ||
          "No analysis returned."
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
    } catch (err) {
      setAnalysisError(
        err.message ||
          "Unable to analyse this regulatory development."
      );
    } finally {
      setAnalysisLoading(
        false
      );
    }
  }

  function closeAnalysis() {
    setSelectedItem(
      null
    );

    setAnalysis("");
    setAnalysisError("");
    setExpertGuidance([]);
    setDetectedCategories([]);
  }

  /*
   * =====================================================
   * DISPLAY HELPERS
   * =====================================================
   */

  function getDateValue(
    value
  ) {
    if (!value) {
      return 0;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 0;
    }

    return date.getTime();
  }

  function formatDate(
    value
  ) {
    if (!value) {
      return "Date not provided";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Date not provided";
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",
      }
    );
  }

  function formatDateTime(
    value
  ) {
    if (!value) {
      return "—";
    }

    return value.toLocaleString(
      "en-GB",
      {
        day:
          "2-digit",

        month:
          "short",

        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );
  }

  function getSummary(
    item
  ) {
    const raw =
      item.description ||
      item.summary ||
      item.contentSnippet ||
      "";

    return stripHtml(
      raw
    ).trim();
  }

  function stripHtml(
    value
  ) {
    return String(
      value || ""
    )
      .replace(
        /<[^>]*>/g,
        " "
      )
      .replace(
        /&nbsp;/g,
        " "
      )
      .replace(
        /&amp;/g,
        "&"
      )
      .replace(
        /&quot;/g,
        '"'
      )
      .replace(
        /&#39;/g,
        "'"
      )
      .replace(
        /\s+/g,
        " "
      );
  }

  function displayCategory(
    value
  ) {
    return String(
      value || ""
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

  /*
   * =====================================================
   * PAGE
   * =====================================================
   */

  return (
    <>
      <div className="regPage">
        <BankRegXNav
          current="regulatory"
        />

        <main className="regMain">
          {/*
           * =================================================
           * HERO
           * =================================================
           */}

          <section className="regHero">
            <div className="regHeroTop">
              <div>
                <div className="regEyebrow">
                  MONITOR
                </div>

                <h1>
                  Regulatory
                  Intelligence
                </h1>

                <p>
                  Monitor
                  regulatory
                  developments and
                  assess what they
                  could mean for
                  banking risks,
                  controls and audit
                  priorities.
                </p>
              </div>

              <button
                type="button"
                className="regRefresh"
                onClick={
                  loadFeeds
                }
                disabled={
                  loading
                }
              >
                {loading
                  ? "Refreshing..."
                  : "Refresh intelligence"}
              </button>
            </div>
          </section>

          {/*
           * =================================================
           * STATS
           * =================================================
           */}

          <section className="regStats">
            <Stat
              label="Developments"
              value={
                allItems.length
              }
            />

            <Stat
              label="Sources"
              value={
                sources.length
              }
            />

            <Stat
              label="Latest published"
              value={
                latestPublished
                  ? formatDate(
                      latestPublished
                    )
                  : "—"
              }
              small
            />

            <Stat
              label="Feed refreshed"
              value={
                lastUpdated
                  ? formatDateTime(
                      lastUpdated
                    )
                  : "—"
              }
              small
            />
          </section>

          {/*
           * =================================================
           * FILTERS
           * =================================================
           */}

          <section className="regToolbar">
            <div className="regFilterCopy">
              <div className="regSectionEyebrow">
                LIVE FEEDS
              </div>

              <strong>
                Regulatory
                developments
              </strong>
            </div>

            <div className="regFilters">
              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search developments..."
              />

              <select
                value={
                  sourceFilter
                }
                onChange={(
                  event
                ) =>
                  setSourceFilter(
                    event.target
                      .value
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
          </section>

          {error && (
            <div className="regError">
              <strong>
                Regulatory
                intelligence could
                not be loaded.
              </strong>

              <span>
                {error}
              </span>
            </div>
          )}

          {/*
           * =================================================
           * NEWS GRID
           * =================================================
           */}

          {loading ? (
            <div className="regEmpty">
              <div className="regLoader" />

              Loading regulatory
              intelligence...
            </div>
          ) : filteredItems.length ===
            0 ? (
            <div className="regEmpty">
              No regulatory
              developments match
              this view.
            </div>
          ) : (
            <section className="regGrid">
              {filteredItems.map(
                (
                  item,
                  index
                ) => {
                  const summary =
                    getSummary(
                      item
                    );

                  return (
                    <article
                      className="regCard"
                      key={
                        item.internalId ||
                        index
                      }
                    >
                      <div className="regCardTop">
                        <span className="regSource">
                          {
                            item.source
                          }
                        </span>

                        <span className="regDate">
                          {formatDate(
                            item.pubDate ||
                              item.date
                          )}
                        </span>
                      </div>

                      <h2>
                        {item.title ||
                          "Regulatory development"}
                      </h2>

                      {summary && (
                        <p>
                          {summary.slice(
                            0,
                            320
                          )}

                          {summary.length >
                          320
                            ? "..."
                            : ""}
                        </p>
                      )}

                      {!summary && (
                        <p className="regNoSummary">
                          The feed did
                          not provide a
                          summary.
                          BankRegX can
                          still assess
                          the headline
                          and available
                          source
                          information.
                        </p>
                      )}

                      <div className="regCardActions">
                        <button
                          type="button"
                          className="regAnalyse"
                          onClick={() =>
                            analyseImpact(
                              item
                            )
                          }
                        >
                          Analyse
                          control
                          impact
                        </button>

                        {item.link && (
                          <a
                            href={
                              item.link
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open source
                            ↗
                          </a>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </section>
          )}
        </main>

        <footer className="regFooter">
          <strong>
            BANKREGX
          </strong>

          <span>
            REGULATORY
            INTELLIGENCE
          </span>
        </footer>
      </div>

      {/*
       * ===================================================
       * IMPACT ANALYSIS MODAL
       * ===================================================
       */}

      {selectedItem && (
        <div
          className="regModalBackdrop"
          onClick={
            closeAnalysis
          }
        >
          <div
            className="regModal"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="regModalHeader">
              <div>
                <div className="regEyebrow">
                  CONTROL IMPACT
                  ANALYSIS
                </div>

                <h2>
                  Regulatory
                  assessment
                </h2>

                <div className="regModalSource">
                  {
                    selectedItem.source
                  }{" "}
                  ·{" "}
                  {formatDate(
                    selectedItem.pubDate ||
                      selectedItem.date
                  )}
                </div>
              </div>

              <button
                type="button"
                className="regClose"
                onClick={
                  closeAnalysis
                }
              >
                ×
              </button>
            </div>

            <div className="regSelectedDevelopment">
              <div className="regSectionLabel">
                DEVELOPMENT
              </div>

              <h3>
                {
                  selectedItem.title
                }
              </h3>

              {selectedItem.link && (
                <a
                  href={
                    selectedItem.link
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View regulatory
                  source ↗
                </a>
              )}
            </div>

            {analysisLoading && (
              <div className="regAnalysisLoading">
                <div className="regLoader" />

                <div>
                  <strong>
                    BankRegX is
                    assessing
                    regulatory
                    impact
                  </strong>

                  <span>
                    Considering risk,
                    controls,
                    evidence and
                    expert
                    methodology.
                  </span>
                </div>
              </div>
            )}

            {analysisError && (
              <div className="regError">
                {
                  analysisError
                }
              </div>
            )}

            {analysis &&
              !analysisLoading && (
                <>
                  {detectedCategories.length >
                    0 && (
                    <div className="regCategories">
                      {detectedCategories.map(
                        (
                          category
                        ) => (
                          <span
                            key={
                              category
                            }
                          >
                            {displayCategory(
                              category
                            )}
                          </span>
                        )
                      )}
                    </div>
                  )}

                  <div className="regMarkdown">
                    <ReactMarkdown>
                      {analysis}
                    </ReactMarkdown>
                  </div>

                  {expertGuidance.length >
                    0 && (
                    <div className="regMethodology">
                      <div className="regMethodologyHeader">
                        <div>
                          <div className="regSectionLabel">
                            EXPLAINABLE
                            INTELLIGENCE
                          </div>

                          <h3>
                            Methodology
                            informing
                            this
                            assessment
                          </h3>
                        </div>

                        <span>
                          {
                            expertGuidance.length
                          }{" "}
                          principles
                        </span>
                      </div>

                      <div className="regGuidanceList">
                        {expertGuidance.map(
                          (
                            item
                          ) => (
                            <div
                              key={
                                item.id ||
                                item.guidanceId
                              }
                            >
                              <div className="regGuidanceTop">
                                <span>
                                  {
                                    item.guidanceId
                                  }
                                </span>

                                <small>
                                  {String(
                                    item.priority ||
                                      "medium"
                                  ).toUpperCase()}
                                </small>
                              </div>

                              <strong>
                                {
                                  item.title
                                }
                              </strong>

                              <p>
                                {displayCategory(
                                  item.category
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          box-sizing:
            border-box;
        }

        html,
        body {
          margin: 0;
          min-height: 100%;
          background:
            #071014;
          color:
            #edf5f3;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        body {
          background:
            radial-gradient(
              circle at top left,
              rgba(
                63,
                139,
                125,
                0.12
              ),
              transparent 34%
            ),
            #071014;
        }

        button,
        input,
        select {
          font: inherit;
        }

        button {
          cursor:
            pointer;
        }

        .regPage {
          min-height:
            100vh;
        }

        .regMain {
          width:
            min(
              1180px,
              90vw
            );
          margin:
            0 auto;
        }

        /*
         * HERO
         */

        .regHero {
          padding:
            72px 0 32px;
        }

        .regHeroTop {
          display:
            flex;
          justify-content:
            space-between;
          align-items:
            flex-start;
          gap:
            40px;
        }

        .regEyebrow,
        .regSectionEyebrow {
          color:
            #87c3b7;
          font-size:
            9px;
          font-weight:
            800;
          letter-spacing:
            0.17em;
        }

        .regHero h1 {
          margin:
            12px 0 14px;
          font-size:
            clamp(
              44px,
              5vw,
              66px
            );
          line-height:
            1;
          letter-spacing:
            -0.045em;
          color:
            #f1f6f5;
        }

        .regHero p {
          max-width:
            730px;
          color:
            #9eb2ae;
          line-height:
            1.7;
          font-size:
            14px;
        }

        .regRefresh {
          border:
            1px solid
            rgba(
              137,
              202,
              189,
              0.24
            );
          background:
            rgba(
              86,
              156,
              142,
              0.07
            );
          color:
            #b7dcd4;
          border-radius:
            9px;
          padding:
            10px 13px;
          font-size:
            10px;
        }

        .regRefresh:hover:not(
          :disabled
        ) {
          color:
            #f1f8f6;
          border-color:
            rgba(
              137,
              202,
              189,
              0.4
            );
        }

        .regRefresh:disabled {
          opacity:
            0.5;
        }

        /*
         * STATS
         */

        .regStats {
          display:
            grid;
          grid-template-columns:
            repeat(
              4,
              1fr
            );
          gap:
            10px;
          margin:
            18px 0;
        }

        .regStat {
          padding:
            19px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.075
            );
          border-radius:
            12px;
          background:
            rgba(
              255,
              255,
              255,
              0.026
            );
        }

        .regStat span {
          display:
            block;
          color:
            #82a09a;
          font-size:
            9px;
          text-transform:
            uppercase;
          letter-spacing:
            0.11em;
        }

        .regStat strong {
          display:
            block;
          margin-top:
            9px;
          color:
            #edf5f3;
          font-size:
            29px;
        }

        .regStat.regStatSmall
          strong {
          margin-top:
            11px;
          font-size:
            14px;
          font-weight:
            650;
        }

        /*
         * TOOLBAR
         */

        .regToolbar {
          display:
            flex;
          justify-content:
            space-between;
          align-items:
            flex-end;
          gap:
            20px;
          margin:
            28px 0 19px;
        }

        .regFilterCopy strong {
          display:
            block;
          margin-top:
            7px;
          font-size:
            19px;
        }

        .regFilters {
          display:
            flex;
          gap:
            8px;
        }

        .regFilters input,
        .regFilters select {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
          background:
            #071317;
          color:
            #e6efed;
          border-radius:
            9px;
          padding:
            11px 12px;
          outline:
            none;
        }

        .regFilters input {
          width:
            280px;
        }

        .regFilters select {
          width:
            180px;
        }

        .regFilters input::placeholder {
          color:
            #718a85;
        }

        .regFilters input:focus,
        .regFilters select:focus {
          border-color:
            rgba(
              129,
              199,
              185,
              0.52
            );
        }

        /*
         * GRID
         */

        .regGrid {
          display:
            grid;
          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );
          gap:
            12px;
          margin-bottom:
            80px;
        }

        .regCard {
          display:
            flex;
          flex-direction:
            column;
          min-height:
            285px;
          padding:
            22px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.075
            );
          border-radius:
            14px;
          background:
            rgba(
              10,
              23,
              28,
              0.78
            );
          transition:
            150ms ease;
        }

        .regCard:hover {
          border-color:
            rgba(
              137,
              202,
              189,
              0.2
            );
          transform:
            translateY(
              -1px
            );
        }

        .regCardTop {
          display:
            flex;
          justify-content:
            space-between;
          gap:
            12px;
          align-items:
            center;
        }

        .regSource {
          color:
            #90b0a9;
          font-size:
            8px;
          font-weight:
            750;
          letter-spacing:
            0.1em;
          text-transform:
            uppercase;
        }

        .regDate {
          color:
            #728984;
          font-size:
            9px;
        }

        .regCard h2 {
          margin:
            14px 0 11px;
          color:
            #edf4f2;
          font-size:
            17px;
          line-height:
            1.45;
        }

        .regCard p {
          margin:
            0;
          color:
            #9aadaa;
          line-height:
            1.65;
          font-size:
            11px;
          flex:
            1;
        }

        .regCard
          .regNoSummary {
          color:
            #809792;
          font-style:
            italic;
        }

        .regCardActions {
          display:
            flex;
          justify-content:
            space-between;
          align-items:
            center;
          gap:
            12px;
          margin-top:
            23px;
          padding-top:
            15px;
          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.055
            );
        }

        .regAnalyse {
          border:
            1px solid
            rgba(
              132,
              200,
              186,
              0.23
            );
          background:
            rgba(
              87,
              158,
              144,
              0.07
            );
          color:
            #b6ddd4;
          border-radius:
            8px;
          padding:
            8px 10px;
          font-size:
            10px;
        }

        .regAnalyse:hover {
          color:
            #f0f7f5;
          border-color:
            rgba(
              132,
              200,
              186,
              0.38
            );
        }

        .regCardActions a {
          color:
            #91aaa5;
          text-decoration:
            none;
          font-size:
            10px;
        }

        .regCardActions a:hover {
          color:
            #d9e7e4;
        }

        /*
         * ERROR / EMPTY
         */

        .regError {
          display:
            flex;
          flex-direction:
            column;
          gap:
            5px;
          margin:
            15px 0;
          padding:
            15px;
          border:
            1px solid
            rgba(
              202,
              109,
              109,
              0.25
            );
          background:
            rgba(
              161,
              65,
              65,
              0.07
            );
          border-radius:
            10px;
          color:
            #dba7a7;
          font-size:
            11px;
        }

        .regEmpty {
          min-height:
            180px;
          margin-bottom:
            80px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          gap:
            12px;
          color:
            #819a94;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          border-radius:
            13px;
        }

        .regLoader {
          width:
            10px;
          height:
            10px;
          border-radius:
            50%;
          background:
            #8bcabd;
          animation:
            regPulse
            1.1s
            infinite
            ease-in-out;
        }

        @keyframes regPulse {
          0%,
          100% {
            opacity:
              0.3;
          }

          50% {
            opacity:
              1;
          }
        }

        /*
         * MODAL
         */

        .regModalBackdrop {
          position:
            fixed;
          inset:
            0;
          z-index:
            100;
          overflow-y:
            auto;
          padding:
            30px;
          background:
            rgba(
              0,
              0,
              0,
              0.74
            );
          backdrop-filter:
            blur(
              7px
            );
        }

        .regModal {
          width:
            min(
              920px,
              100%
            );
          margin:
            0 auto;
          padding:
            29px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
          border-radius:
            18px;
          background:
            #09161a;
          box-shadow:
            0 40px 100px
            rgba(
              0,
              0,
              0,
              0.46
            );
        }

        .regModalHeader,
        .regMethodologyHeader {
          display:
            flex;
          justify-content:
            space-between;
          align-items:
            flex-start;
          gap:
            20px;
        }

        .regModalHeader h2 {
          margin:
            7px 0 5px;
          font-size:
            27px;
        }

        .regModalSource {
          color:
            #829b95;
          font-size:
            10px;
        }

        .regClose {
          width:
            36px;
          height:
            36px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
          border-radius:
            9px;
          background:
            rgba(
              255,
              255,
              255,
              0.035
            );
          color:
            #a9bdb9;
          font-size:
            20px;
        }

        .regSelectedDevelopment {
          margin-top:
            24px;
          padding:
            18px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.065
            );
          border-radius:
            11px;
          background:
            rgba(
              0,
              0,
              0,
              0.12
            );
        }

        .regSectionLabel {
          color:
            #78938d;
          font-size:
            8px;
          font-weight:
            800;
          letter-spacing:
            0.14em;
        }

        .regSelectedDevelopment
          h3 {
          margin:
            8px 0 10px;
          font-size:
            16px;
          line-height:
            1.45;
        }

        .regSelectedDevelopment
          a {
          color:
            #a6c8c0;
          text-decoration:
            none;
          font-size:
            10px;
        }

        .regAnalysisLoading {
          min-height:
            180px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          gap:
            14px;
        }

        .regAnalysisLoading
          strong,
        .regAnalysisLoading
          span {
          display:
            block;
        }

        .regAnalysisLoading
          span {
          margin-top:
            5px;
          color:
            #819a94;
          font-size:
            11px;
        }

        /*
         * MARKDOWN
         */

        .regMarkdown {
          margin-top:
            20px;
          color:
            #c1cfcc;
          font-size:
            13px;
          line-height:
            1.75;
        }

        .regMarkdown h1,
        .regMarkdown h2,
        .regMarkdown h3 {
          color:
            #edf5f3;
          line-height:
            1.3;
        }

        .regMarkdown h3 {
          margin-top:
            26px;
          font-size:
            17px;
        }

        .regMarkdown li {
          margin:
            6px 0;
        }

        .regCategories {
          display:
            flex;
          flex-wrap:
            wrap;
          gap:
            6px;
          margin-top:
            18px;
        }

        .regCategories span {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );
          border-radius:
            999px;
          padding:
            5px 8px;
          color:
            #90a9a4;
          font-size:
            9px;
        }

        /*
         * METHODOLOGY
         */

        .regMethodology {
          margin-top:
            27px;
          padding:
            21px;
          border:
            1px solid
            rgba(
              132,
              200,
              186,
              0.17
            );
          border-radius:
            12px;
          background:
            rgba(
              64,
              118,
              108,
              0.055
            );
        }

        .regMethodologyHeader
          h3 {
          margin:
            6px 0 0;
          font-size:
            17px;
        }

        .regMethodologyHeader
          > span {
          color:
            #88a29c;
          font-size:
            9px;
        }

        .regGuidanceList {
          margin-top:
            15px;
          display:
            grid;
          gap:
            7px;
        }

        .regGuidanceList
          > div {
          padding:
            12px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          border-radius:
            8px;
          background:
            rgba(
              0,
              0,
              0,
              0.11
            );
        }

        .regGuidanceTop {
          display:
            flex;
          justify-content:
            space-between;
          gap:
            10px;
        }

        .regGuidanceTop
          span {
          color:
            #84a19b;
          font-family:
            ui-monospace,
            monospace;
          font-size:
            9px;
        }

        .regGuidanceTop
          small {
          color:
            #d4bd89;
          font-size:
            8px;
        }

        .regGuidanceList
          strong {
          display:
            block;
          margin-top:
            7px;
          color:
            #dce8e5;
          font-size:
            11px;
        }

        .regGuidanceList
          p {
          margin:
            4px 0 0;
          color:
            #788f8a;
          font-size:
            9px;
        }

        /*
         * FOOTER
         */

        .regFooter {
          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          padding:
            25px 5vw;
          display:
            flex;
          justify-content:
            center;
          align-items:
            center;
          gap:
            10px;
          color:
            #637b76;
          font-size:
            9px;
          letter-spacing:
            0.12em;
        }

        .regFooter strong {
          color:
            #819b95;
        }

        /*
         * RESPONSIVE
         */

        @media (
          max-width:
            800px
        ) {
          .regHeroTop,
          .regToolbar {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .regStats {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .regFilters {
            width:
              100%;
            flex-direction:
              column;
          }

          .regFilters input,
          .regFilters select {
            width:
              100%;
          }

          .regGrid {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          max-width:
            500px
        ) {
          .regMain {
            width:
              92vw;
          }

          .regStats {
            grid-template-columns:
              1fr;
          }

          .regModalBackdrop {
            padding:
              12px;
          }

          .regModal {
            padding:
              20px;
          }

          .regCardActions {
            align-items:
              flex-start;
            flex-direction:
              column;
          }
        }
      `}</style>
    </>
  );
}

function Stat({
  label,
  value,
  small = false,
}) {
  return (
    <div
      className={`regStat ${
        small
          ? "regStatSmall"
          : ""
      }`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}