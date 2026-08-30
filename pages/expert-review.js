import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";
import BankRegXNav from "../components/BankRegXNav";

const EMPTY_DRAFT = {
  title: "",
  guidance: "",
  category:
    "control_design",
  subcategory: "",
  tags: "",
  priority: "medium",
  rationale: "",
  appliesTo:
    "control assessment",
};

export default function ExpertReview() {
  const [
    authenticated,
    setAuthenticated,
  ] = useState(null);

  const [
    adminKey,
    setAdminKey,
  ] = useState("");

  const [
    loginError,
    setLoginError,
  ] = useState("");

  const [
    reviews,
    setReviews,
  ] = useState([]);

  const [
    counts,
    setCounts,
  ] = useState({
    total: 0,
    open: 0,
    corrected: 0,
    rejected: 0,
    closed: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("open");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    expandedId,
    setExpandedId,
  ] = useState(null);

  const [
    draftReviewId,
    setDraftReviewId,
  ] = useState(null);

  const [
    draftForm,
    setDraftForm,
  ] = useState(
    EMPTY_DRAFT
  );

  const [
    creatingDraft,
    setCreatingDraft,
  ] = useState(false);

  /*
   * =====================================================
   * SESSION
   * =====================================================
   */

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response =
        await fetch(
          "/api/admin/session",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      const loggedIn =
        Boolean(
          data.authenticated
        );

      setAuthenticated(
        loggedIn
      );

      if (loggedIn) {
        await loadReviews();
      }
    } catch {
      setAuthenticated(
        false
      );
    }
  }

  async function login(
    event
  ) {
    event.preventDefault();

    setLoginError("");
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/admin/login",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                adminKey,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Login failed"
        );
      }

      setAdminKey("");

      setAuthenticated(
        true
      );

      await loadReviews();
    } catch (error) {
      setLoginError(
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch(
      "/api/admin/logout",
      {
        method:
          "POST",
      }
    );

    setAuthenticated(
      false
    );

    setReviews([]);
  }

  /*
   * =====================================================
   * LOAD REVIEW QUEUE
   * =====================================================
   */

  async function loadReviews() {
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/admin/reviews",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (
        response.status ===
        401
      ) {
        setAuthenticated(
          false
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load review queue"
        );
      }

      setReviews(
        Array.isArray(
          data.reviews
        )
          ? data.reviews
          : []
      );

      setCounts(
        data.counts || {
          total: 0,
          open: 0,
          corrected: 0,
          rejected: 0,
          closed: 0,
        }
      );
    } catch (error) {
      setMessage(
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * UPDATE REVIEW
   * =====================================================
   */

  async function updateReview(
    id,
    payload
  ) {
    const response =
      await fetch(
        "/api/admin/reviews",
        {
          method:
            "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              id,
              ...payload,
            }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to update review"
      );
    }

    return data;
  }

  async function closeReview(
    review
  ) {
    if (
      !window.confirm(
        "Close this expert review?"
      )
    ) {
      return;
    }

    try {
      await updateReview(
        review.id,
        {
          status:
            "closed",
        }
      );

      setMessage(
        "Review closed."
      );

      await loadReviews();
    } catch (error) {
      setMessage(
        error.message
      );
    }
  }

  async function reopenReview(
    review
  ) {
    try {
      await updateReview(
        review.id,
        {
          status:
            "submitted",
        }
      );

      setMessage(
        "Review reopened."
      );

      await loadReviews();
    } catch (error) {
      setMessage(
        error.message
      );
    }
  }

  /*
   * =====================================================
   * CREATE DRAFT METHODOLOGY FROM REVIEW
   * =====================================================
   */

  function startDraft(
    review
  ) {
    const category =
      [
        "control_design",
        "audit_judgement",
        "regulatory_impact",
        "general",
      ].includes(
        review.category
      )
        ? review.category
        : "general";

    setDraftReviewId(
      review.id
    );

    setDraftForm({
      title:
        "New methodology principle from expert review",

      guidance: "",

      category,

      subcategory: "",

      tags:
        Array.isArray(
          review.tags
        )
          ? review.tags.join(
              ", "
            )
          : "",

      priority:
        "medium",

      rationale:
        review.rationale ||
        "",

      appliesTo:
        category ===
        "control_design"
          ? "control assessment"
          : category ===
            "audit_judgement"
          ? "audit finding review"
          : category ===
            "regulatory_impact"
          ? "regulatory impact assessment"
          : "BankRegX assessment",
    });

    setTimeout(() => {
      document
        .getElementById(
          `draft-${review.id}`
        )
        ?.scrollIntoView({
          behavior:
            "smooth",

          block:
            "center",
        });
    }, 50);
  }

  function updateDraft(
    field,
    value
  ) {
    setDraftForm(
      (current) => ({
        ...current,

        [field]:
          value,
      })
    );
  }

  function splitList(
    value
  ) {
    return String(
      value || ""
    )
      .split(",")
      .map((item) =>
        item.trim()
      )
      .filter(Boolean);
  }

  async function createDraftPrinciple(
    event,
    review
  ) {
    event.preventDefault();

    if (
      !draftForm.title.trim() ||
      !draftForm.guidance.trim()
    ) {
      setMessage(
        "Enter a reusable principle title and expert principle."
      );

      return;
    }

    setCreatingDraft(true);
    setMessage("");

    try {
      /*
       * Always create as DRAFT.
       *
       * Review feedback cannot directly influence
       * BankRegX methodology.
       */

      const response =
        await fetch(
          "/api/admin/guidance",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                title:
                  draftForm.title,

                guidance:
                  draftForm.guidance,

                category:
                  draftForm.category,

                subcategory:
                  draftForm.subcategory,

                tags:
                  splitList(
                    draftForm.tags
                  ),

                priority:
                  draftForm.priority,

                rationale:
                  draftForm.rationale,

                appliesTo:
                  splitList(
                    draftForm.appliesTo
                  ),

                status:
                  "draft",
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create draft principle"
        );
      }

      await updateReview(
        review.id,
        {
          status:
            "reviewed",

          linkedGuidanceId:
            data.guidanceId,

          linkedGuidanceDocumentId:
            data.id,
        }
      );

      setMessage(
        `${data.guidanceId} created as a draft. It cannot influence BankRegX until approved in Expert Studio.`
      );

      setDraftReviewId(
        null
      );

      setDraftForm(
        EMPTY_DRAFT
      );

      await loadReviews();
    } catch (error) {
      setMessage(
        error.message
      );
    } finally {
      setCreatingDraft(
        false
      );
    }
  }

  /*
   * =====================================================
   * FILTERING
   * =====================================================
   */

  const filteredReviews =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return reviews.filter(
        (review) => {
          if (
            filter ===
              "open" &&
            review.status ===
              "closed"
          ) {
            return false;
          }

          if (
            filter ===
              "corrected" &&
            review.feedbackType !==
              "correct"
          ) {
            return false;
          }

          if (
            filter ===
              "rejected" &&
            review.feedbackType !==
              "reject"
          ) {
            return false;
          }

          if (
            filter ===
              "closed" &&
            review.status !==
              "closed"
          ) {
            return false;
          }

          if (!searchText) {
            return true;
          }

          const searchable = [
            review.question,
            review.aiResponse,
            review.correctedAnswer,
            review.rationale,
            review.category,
            review.linkedGuidanceId,
            ...(review.guidanceIds ||
              []),
            ...(review.guidanceTitles ||
              []),
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            searchText
          );
        }
      );
    }, [
      reviews,
      filter,
      search,
    ]);

  /*
   * =====================================================
   * DISPLAY
   * =====================================================
   */

  function formatCategory(
    value
  ) {
    return String(
      value || "general"
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

  function formatDate(
    value
  ) {
    if (!value) {
      return "—";
    }

    try {
      return new Date(
        value
      ).toLocaleString();
    } catch {
      return value;
    }
  }

  /*
   * =====================================================
   * SESSION CHECK
   * =====================================================
   */

  if (
    authenticated === null
  ) {
    return (
      <>
        <div className="loadingPage">
          Checking Expert
          Review session...
        </div>

        <GlobalStyle />
      </>
    );
  }

  /*
   * =====================================================
   * LOGIN
   * =====================================================
   */

  if (!authenticated) {
    return (
      <>
        <div className="loginPage">
          <div className="loginCard">
            <div className="loginLogo">
              BRX
            </div>

            <div className="eyebrow">
              BANKREGX
              GOVERNANCE
            </div>

            <h1>
              Expert Review
            </h1>

            <p>
              Review corrections
              and rejected
              assessments before
              deciding whether
              BankRegX methodology
              should change.
            </p>

            <form
              onSubmit={
                login
              }
            >
              <label>
                Admin key
              </label>

              <input
                type="password"
                value={
                  adminKey
                }
                onChange={(
                  event
                ) =>
                  setAdminKey(
                    event.target
                      .value
                  )
                }
                autoComplete="current-password"
                autoFocus
              />

              {loginError && (
                <div className="error">
                  {
                    loginError
                  }
                </div>
              )}

              <button
                className="loginButton"
                type="submit"
                disabled={
                  loading ||
                  !adminKey
                }
              >
                {loading
                  ? "Signing in..."
                  : "Enter Review Queue"}
              </button>
            </form>

            <a
              className="backLink"
              href="/"
            >
              ← Return to
              BankRegX
            </a>
          </div>
        </div>

        <GlobalStyle />
      </>
    );
  }

  /*
   * =====================================================
   * MAIN PAGE
   * =====================================================
   */

  return (
    <>
      <div className="page">
        <BankRegXNav
          current="review"
        />

        <main className="reviewMain">
          {/*
           * =================================================
           * HERO
           * =================================================
           */}

          <section className="hero">
            <div className="heroTop">
              <div>
                <div className="eyebrow">
                  GOVERNED
                  LEARNING
                </div>

                <h1>
                  Expert Review
                  Queue
                </h1>

                <p>
                  Review BankRegX
                  corrections and
                  rejected
                  assessments,
                  identify reusable
                  lessons and decide
                  whether expert
                  methodology should
                  change.
                </p>
              </div>

              <div className="sessionPanel">
                <div className="sessionStatus">
                  <span className="sessionDot" />

                  SECURE ADMIN
                  SESSION
                </div>

                <button
                  type="button"
                  className="signOutButton"
                  onClick={
                    logout
                  }
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>

          {/*
           * =================================================
           * STATS
           * =================================================
           */}

          <section className="stats">
            <Stat
              label="Open"
              value={
                counts.open
              }
            />

            <Stat
              label="Corrected"
              value={
                counts.corrected
              }
            />

            <Stat
              label="Rejected"
              value={
                counts.rejected
              }
            />

            <Stat
              label="Closed"
              value={
                counts.closed
              }
            />
          </section>

          {/*
           * =================================================
           * FILTERS
           * =================================================
           */}

          <section className="toolbar">
            <div className="filterButtons">
              {[
                [
                  "open",
                  "Open",
                ],

                [
                  "all",
                  "All",
                ],

                [
                  "corrected",
                  "Corrected",
                ],

                [
                  "rejected",
                  "Rejected",
                ],

                [
                  "closed",
                  "Closed",
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (
                  <button
                    key={
                      value
                    }
                    type="button"
                    className={
                      filter ===
                      value
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setFilter(
                        value
                      )
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </div>

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
              placeholder="Search reviews..."
            />
          </section>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          {/*
           * =================================================
           * QUEUE
           * =================================================
           */}

          {loading ? (
            <div className="empty">
              Loading Expert
              Review Queue...
            </div>
          ) : filteredReviews.length ===
            0 ? (
            <div className="empty">
              No reviews match
              this view.
            </div>
          ) : (
            <section className="reviewList">
              {filteredReviews.map(
                (review) => {
                  const expanded =
                    expandedId ===
                    review.id;

                  const drafting =
                    draftReviewId ===
                    review.id;

                  return (
                    <article
                      className="reviewCard"
                      key={
                        review.id
                      }
                    >
                      <div className="reviewTop">
                        <div>
                          <div className="badgeRow">
                            <span
                              className={`feedbackType ${
                                review.feedbackType ===
                                "correct"
                                  ? "corrected"
                                  : "rejected"
                              }`}
                            >
                              {review.feedbackType ===
                              "correct"
                                ? "CORRECTED"
                                : "REJECTED"}
                            </span>

                            <span className="reviewStatus">
                              {
                                review.status
                              }
                            </span>

                            <span className="reviewCategory">
                              {formatCategory(
                                review.category
                              )}
                            </span>
                          </div>

                          <div className="date">
                            {formatDate(
                              review.createdAt
                            )}
                          </div>
                        </div>

                        {review.linkedGuidanceId && (
                          <a
                            href="/expert-studio"
                            className="linkedDraft"
                          >
                            DRAFT METHODOLOGY ·{" "}
                            {
                              review.linkedGuidanceId
                            }
                          </a>
                        )}
                      </div>

                      {/*
                       * QUESTION
                       */}

                      <div className="sectionLabel">
                        QUESTION
                      </div>

                      <div className="question">
                        {
                          review.question
                        }
                      </div>

                      {/*
                       * BANKREGX ANSWER
                       */}

                      <div className="sectionLabel">
                        BANKREGX
                        ASSESSMENT
                      </div>

                      <div className="assessmentContainer">
                        <div className="markdown answerPreview">
                          <ReactMarkdown>
                            {
                              review.aiResponse
                            }
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/*
                       * EXPERT CORRECTION
                       */}

                      {review.feedbackType ===
                        "correct" &&
                        review.correctedAnswer && (
                          <>
                            <div className="sectionLabel correctionLabel">
                              EXPERT
                              CORRECTION
                            </div>

                            <div className="correction">
                              <ReactMarkdown>
                                {
                                  review.correctedAnswer
                                }
                              </ReactMarkdown>
                            </div>
                          </>
                        )}

                      {review.rationale && (
                        <>
                          <div className="sectionLabel">
                            EXPERT
                            RATIONALE
                          </div>

                          <div className="rationale">
                            {
                              review.rationale
                            }
                          </div>
                        </>
                      )}

                      {/*
                       * INTELLIGENCE TRACE
                       */}

                      {expanded && (
                        <div className="tracePanel">
                          <div className="traceHeader">
                            <div>
                              <div className="sectionLabel traceLabel">
                                INTELLIGENCE
                                TRACE
                              </div>

                              <h3>
                                Methodology
                                used in this
                                assessment
                              </h3>
                            </div>

                            <span>
                              {
                                review.guidanceIds
                                  .length
                              }{" "}
                              principles
                            </span>
                          </div>

                          {review.guidanceIds.length >
                          0 ? (
                            <div className="guidanceTrace">
                              {review.guidanceIds.map(
                                (
                                  guidanceId,
                                  index
                                ) => (
                                  <div
                                    key={`${guidanceId}-${index}`}
                                  >
                                    <span>
                                      {
                                        guidanceId
                                      }
                                    </span>

                                    <strong>
                                      {review
                                        .guidanceTitles[
                                        index
                                      ] ||
                                        "Expert principle"}
                                    </strong>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="muted">
                              No expert
                              methodology
                              trace was
                              recorded for
                              this response.
                            </div>
                          )}

                          <div className="traceMeta">
                            <span>
                              Reasoning:
                              {" "}
                              {review.reasoningMode ||
                                "—"}
                            </span>

                            <span>
                              Retrieval:
                              {" "}
                              {review.retrievalMode ||
                                "—"}
                            </span>

                            <span>
                              Live web:
                              {" "}
                              {review.usedWebSearch
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/*
                       * ACTIONS
                       */}

                      <div className="actions">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expanded
                                ? null
                                : review.id
                            )
                          }
                        >
                          {expanded
                            ? "Hide intelligence trace"
                            : "View intelligence trace"}
                        </button>

                        {!review.linkedGuidanceId && (
                          <button
                            type="button"
                            className="createDraft"
                            onClick={() =>
                              startDraft(
                                review
                              )
                            }
                          >
                            Create draft
                            principle from
                            lesson
                          </button>
                        )}

                        {review.status !==
                          "closed" ? (
                          <button
                            type="button"
                            onClick={() =>
                              closeReview(
                                review
                              )
                            }
                          >
                            Close review
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              reopenReview(
                                review
                              )
                            }
                          >
                            Reopen
                          </button>
                        )}
                      </div>

                      {/*
                       * DRAFT BUILDER
                       */}

                      {drafting && (
                        <form
                          id={`draft-${review.id}`}
                          className="draftBuilder"
                          onSubmit={(
                            event
                          ) =>
                            createDraftPrinciple(
                              event,
                              review
                            )
                          }
                        >
                          <div className="draftHeader">
                            <div>
                              <div className="eyebrow">
                                GOVERNED
                                LEARNING
                              </div>

                              <h3>
                                Create
                                reusable
                                methodology
                              </h3>
                            </div>

                            <button
                              type="button"
                              className="cancelButton"
                              onClick={() =>
                                setDraftReviewId(
                                  null
                                )
                              }
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="draftNotice">
                            Do not copy
                            the
                            case-specific
                            correction as
                            a global
                            rule. Express
                            the reusable
                            professional
                            judgement that
                            BankRegX
                            should apply
                            in future
                            cases.
                          </div>

                          <label>
                            Principle
                            title
                          </label>

                          <input
                            value={
                              draftForm.title
                            }
                            onChange={(
                              event
                            ) =>
                              updateDraft(
                                "title",
                                event.target
                                  .value
                              )
                            }
                          />

                          <label>
                            Reusable expert
                            principle
                          </label>

                          <textarea
                            value={
                              draftForm.guidance
                            }
                            onChange={(
                              event
                            ) =>
                              updateDraft(
                                "guidance",
                                event.target
                                  .value
                              )
                            }
                            placeholder="What reusable professional judgement should BankRegX learn from this review?"
                          />

                          <div className="formGrid">
                            <div>
                              <label>
                                Category
                              </label>

                              <select
                                value={
                                  draftForm.category
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateDraft(
                                    "category",
                                    event.target
                                      .value
                                  )
                                }
                              >
                                <option value="control_design">
                                  Control
                                  Design
                                </option>

                                <option value="audit_judgement">
                                  Audit
                                  Judgement
                                </option>

                                <option value="regulatory_impact">
                                  Regulatory
                                  Impact
                                </option>

                                <option value="general">
                                  General
                                </option>
                              </select>
                            </div>

                            <div>
                              <label>
                                Subcategory
                              </label>

                              <input
                                value={
                                  draftForm.subcategory
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateDraft(
                                    "subcategory",
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="e.g. risk_control_alignment"
                              />
                            </div>

                            <div>
                              <label>
                                Priority
                              </label>

                              <select
                                value={
                                  draftForm.priority
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateDraft(
                                    "priority",
                                    event.target
                                      .value
                                  )
                                }
                              >
                                <option value="critical">
                                  Critical
                                </option>

                                <option value="high">
                                  High
                                </option>

                                <option value="medium">
                                  Medium
                                </option>

                                <option value="low">
                                  Low
                                </option>
                              </select>
                            </div>

                            <div>
                              <label>
                                Tags
                              </label>

                              <input
                                value={
                                  draftForm.tags
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateDraft(
                                    "tags",
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="risk, evidence, timing"
                              />
                            </div>
                          </div>

                          <label>
                            Rationale
                          </label>

                          <textarea
                            className="smallTextarea"
                            value={
                              draftForm.rationale
                            }
                            onChange={(
                              event
                            ) =>
                              updateDraft(
                                "rationale",
                                event.target
                                  .value
                              )
                            }
                          />

                          <label>
                            Applies to
                          </label>

                          <input
                            value={
                              draftForm.appliesTo
                            }
                            onChange={(
                              event
                            ) =>
                              updateDraft(
                                "appliesTo",
                                event.target
                                  .value
                              )
                            }
                          />

                          <div className="draftFooter">
                            <span>
                              This will be
                              created as
                              DRAFT and
                              cannot
                              influence
                              BankRegX
                              until
                              explicitly
                              approved in
                              Expert
                              Studio.
                            </span>

                            <button
                              className="primaryButton"
                              type="submit"
                              disabled={
                                creatingDraft
                              }
                            >
                              {creatingDraft
                                ? "Creating..."
                                : "Create draft principle"}
                            </button>
                          </div>
                        </form>
                      )}
                    </article>
                  );
                }
              )}
            </section>
          )}
        </main>

        <footer className="reviewFooter">
          <strong>
            BANKREGX
          </strong>

          <span>
            GOVERNED EXPERT
            LEARNING
          </span>
        </footer>
      </div>

      <GlobalStyle />
    </>
  );
}

function Stat({
  label,
  value,
}) {
  return (
    <div className="stat">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function GlobalStyle() {
  return (
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
      textarea,
      select {
        font:
          inherit;
      }

      button {
        cursor:
          pointer;
      }

      .page {
        min-height:
          100vh;
      }

      /*
       * LOGIN
       */

      .loadingPage,
      .loginPage {
        min-height:
          100vh;
        display:
          flex;
        align-items:
          center;
        justify-content:
          center;
      }

      .loadingPage {
        color:
          #93aaa5;
      }

      .loginPage {
        padding:
          30px;
      }

      .loginCard {
        width:
          min(
            440px,
            100%
          );
        padding:
          36px;
        border-radius:
          18px;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.09
          );
        background:
          rgba(
            11,
            24,
            29,
            0.88
          );
      }

      .loginLogo {
        width:
          44px;
        height:
          44px;
        display:
          flex;
        align-items:
          center;
        justify-content:
          center;
        border-radius:
          12px;
        border:
          1px solid
          rgba(
            145,
            210,
            197,
            0.3
          );
        color:
          #b9e2da;
        font-size:
          10px;
        font-weight:
          800;
        letter-spacing:
          0.08em;
      }

      .loginCard .eyebrow {
        margin-top:
          20px;
      }

      .loginCard h1 {
        margin:
          9px 0;
        font-size:
          40px;
        letter-spacing:
          -0.04em;
      }

      .loginCard p {
        color:
          #9db0ac;
        line-height:
          1.65;
      }

      .loginButton {
        width:
          100%;
        border:
          0;
        margin-top:
          18px;
        padding:
          12px;
        border-radius:
          9px;
        background:
          #9cd5ca;
        color:
          #071311;
        font-weight:
          800;
      }

      .backLink {
        display:
          inline-block;
        margin-top:
          20px;
        color:
          #9fc1ba;
        text-decoration:
          none;
        font-size:
          11px;
      }

      .error {
        color:
          #dca4a4;
        font-size:
          11px;
        margin-top:
          10px;
      }

      /*
       * MAIN
       */

      .reviewMain {
        width:
          min(
            1180px,
            90vw
          );
        margin:
          0 auto;
      }

      .hero {
        padding:
          72px 0 32px;
      }

      .heroTop {
        display:
          flex;
        justify-content:
          space-between;
        align-items:
          flex-start;
        gap:
          40px;
      }

      .eyebrow {
        color:
          #87c3b7;
        font-size:
          9px;
        font-weight:
          800;
        letter-spacing:
          0.17em;
      }

      .hero h1 {
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

      .hero p {
        max-width:
          720px;
        color:
          #9eb2ae;
        line-height:
          1.7;
        font-size:
          14px;
      }

      /*
       * SESSION
       */

      .sessionPanel {
        display:
          flex;
        align-items:
          center;
        gap:
          9px;
        padding-top:
          3px;
      }

      .sessionStatus {
        display:
          flex;
        align-items:
          center;
        gap:
          7px;
        color:
          #8eaaa4;
        font-size:
          8px;
        font-weight:
          700;
        letter-spacing:
          0.09em;
      }

      .sessionDot {
        width:
          6px;
        height:
          6px;
        border-radius:
          50%;
        background:
          #7fc4b4;
        box-shadow:
          0 0 10px
          rgba(
            127,
            196,
            180,
            0.45
          );
      }

      .signOutButton {
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
        color:
          #a8bbb7;
        border-radius:
          8px;
        padding:
          8px 11px;
        font-size:
          10px;
      }

      /*
       * STATS
       */

      .stats {
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

      .stat {
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

      .stat span {
        display:
          block;
        color:
          #82a09a;
        font-size:
          9px;
        letter-spacing:
          0.11em;
        text-transform:
          uppercase;
      }

      .stat strong {
        display:
          block;
        margin-top:
          9px;
        color:
          #edf5f3;
        font-size:
          29px;
      }

      /*
       * TOOLBAR
       */

      .toolbar {
        display:
          flex;
        justify-content:
          space-between;
        align-items:
          center;
        gap:
          15px;
        margin:
          22px 0;
      }

      .filterButtons {
        display:
          flex;
        gap:
          7px;
        flex-wrap:
          wrap;
      }

      .filterButtons button {
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.08
          );
        color:
          #98aca8;
        background:
          rgba(
            255,
            255,
            255,
            0.025
          );
        border-radius:
          8px;
        padding:
          9px 11px;
        font-size:
          10px;
      }

      .filterButtons button:hover {
        color:
          #e5efed;
      }

      .filterButtons .selected {
        color:
          #c4e3dc;
        border-color:
          rgba(
            132,
            201,
            187,
            0.34
          );
        background:
          rgba(
            92,
            160,
            147,
            0.1
          );
      }

      .toolbar > input {
        width:
          280px;
      }

      /*
       * INPUTS
       */

      label {
        display:
          block;
        margin:
          15px 0 7px;
        color:
          #a4b7b3;
        font-size:
          10px;
        font-weight:
          650;
      }

      input,
      textarea,
      select {
        width:
          100%;
        outline:
          none;
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
          #e8f0ef;
        border-radius:
          9px;
        padding:
          11px 12px;
      }

      textarea {
        min-height:
          125px;
        resize:
          vertical;
        line-height:
          1.6;
      }

      input::placeholder,
      textarea::placeholder {
        color:
          #667e79;
      }

      input:focus,
      textarea:focus,
      select:focus {
        border-color:
          rgba(
            128,
            199,
            185,
            0.52
          );
      }

      /*
       * MESSAGE
       */

      .message {
        margin:
          14px 0;
        padding:
          12px 14px;
        border-radius:
          9px;
        background:
          rgba(
            94,
            158,
            146,
            0.08
          );
        border:
          1px solid
          rgba(
            137,
            202,
            189,
            0.09
          );
        color:
          #a7c7c0;
        font-size:
          11px;
      }

      /*
       * REVIEWS
       */

      .reviewList {
        display:
          grid;
        gap:
          14px;
        margin-bottom:
          80px;
      }

      .reviewCard {
        padding:
          26px;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.075
          );
        border-radius:
          15px;
        background:
          rgba(
            10,
            23,
            28,
            0.8
          );
      }

      .reviewTop {
        display:
          flex;
        justify-content:
          space-between;
        gap:
          20px;
        margin-bottom:
          22px;
      }

      .badgeRow {
        display:
          flex;
        flex-wrap:
          wrap;
        gap:
          6px;
      }

      .feedbackType,
      .reviewStatus,
      .reviewCategory {
        border-radius:
          999px;
        padding:
          5px 8px;
        font-size:
          8px;
        letter-spacing:
          0.08em;
        text-transform:
          uppercase;
      }

      .feedbackType.corrected {
        color:
          #dcc98e;
        background:
          rgba(
            188,
            153,
            65,
            0.1
          );
      }

      .feedbackType.rejected {
        color:
          #dda3a3;
        background:
          rgba(
            182,
            79,
            79,
            0.1
          );
      }

      .reviewStatus,
      .reviewCategory {
        color:
          #879f9a;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.065
          );
      }

      .date {
        margin-top:
          8px;
        color:
          #728a85;
        font-size:
          9px;
      }

      .linkedDraft {
        color:
          #a2c9c0;
        border:
          1px solid
          rgba(
            137,
            202,
            189,
            0.16
          );
        border-radius:
          7px;
        padding:
          7px 9px;
        text-decoration:
          none;
        font-family:
          ui-monospace,
          monospace;
        font-size:
          9px;
      }

      /*
       * REVIEW CONTENT
       */

      .sectionLabel {
        margin-top:
          24px;
        color:
          #79958f;
        font-size:
          8px;
        font-weight:
          800;
        letter-spacing:
          0.15em;
      }

      .question {
        margin-top:
          8px;
        color:
          #e7efed;
        font-size:
          14px;
        line-height:
          1.65;
      }

      .assessmentContainer {
        margin-top:
          8px;
        padding:
          0 17px;
        border-radius:
          11px;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.055
          );
        background:
          rgba(
            0,
            0,
            0,
            0.11
          );
      }

      .markdown {
        color:
          #bac9c6;
        font-size:
          12px;
        line-height:
          1.72;
      }

      .markdown h1,
      .markdown h2,
      .markdown h3 {
        color:
          #eaf2f0;
      }

      .markdown h3 {
        font-size:
          15px;
        margin-top:
          21px;
      }

      .markdown li {
        margin:
          5px 0;
      }

      .answerPreview {
        max-height:
          360px;
        overflow-y:
          auto;
        padding:
          12px 10px
          12px 0;
      }

      /*
       * CORRECTION
       */

      .correctionLabel {
        color:
          #c6ad70;
      }

      .correction {
        margin-top:
          8px;
        padding:
          17px;
        border-radius:
          10px;
        border:
          1px solid
          rgba(
            202,
            174,
            98,
            0.17
          );
        background:
          rgba(
            170,
            140,
            62,
            0.045
          );
        color:
          #cdd8d5;
        line-height:
          1.7;
        font-size:
          12px;
      }

      .correction p:first-child {
        margin-top:
          0;
      }

      .rationale {
        margin-top:
          8px;
        color:
          #9baea9;
        line-height:
          1.65;
        font-size:
          11px;
      }

      /*
       * TRACE
       */

      .tracePanel {
        margin-top:
          22px;
        padding:
          18px;
        border-radius:
          11px;
        border:
          1px solid
          rgba(
            137,
            202,
            189,
            0.1
          );
        background:
          rgba(
            0,
            0,
            0,
            0.15
          );
      }

      .traceHeader {
        display:
          flex;
        justify-content:
          space-between;
        align-items:
          flex-start;
        gap:
          15px;
      }

      .traceHeader h3 {
        margin:
          6px 0 0;
        font-size:
          16px;
      }

      .traceHeader > span {
        color:
          #829c96;
        font-size:
          9px;
      }

      .traceLabel {
        margin-top:
          0;
      }

      .guidanceTrace {
        margin-top:
          14px;
        display:
          grid;
        gap:
          7px;
      }

      .guidanceTrace > div {
        display:
          grid;
        grid-template-columns:
          140px
          1fr;
        gap:
          12px;
        padding:
          10px;
        border-radius:
          8px;
        background:
          rgba(
            255,
            255,
            255,
            0.028
          );
      }

      .guidanceTrace span {
        color:
          #82a099;
        font-family:
          ui-monospace,
          monospace;
        font-size:
          9px;
      }

      .guidanceTrace strong {
        color:
          #a9bbb7;
        font-size:
          10px;
        font-weight:
          600;
      }

      .traceMeta {
        display:
          flex;
        flex-wrap:
          wrap;
        gap:
          16px;
        margin-top:
          14px;
        color:
          #6f8882;
        font-size:
          9px;
      }

      .muted {
        margin-top:
          10px;
        color:
          #718a84;
        font-size:
          10px;
      }

      /*
       * ACTIONS
       */

      .actions {
        display:
          flex;
        flex-wrap:
          wrap;
        gap:
          8px;
        margin-top:
          22px;
        padding-top:
          18px;
        border-top:
          1px solid
          rgba(
            255,
            255,
            255,
            0.055
          );
      }

      .actions button,
      .cancelButton {
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.09
          );
        color:
          #a0b4b0;
        background:
          rgba(
            255,
            255,
            255,
            0.028
          );
        border-radius:
          8px;
        padding:
          8px 11px;
        font-size:
          10px;
      }

      .actions button:hover {
        color:
          #e5efed;
      }

      .actions .createDraft {
        color:
          #b3d9d0;
        border-color:
          rgba(
            132,
            200,
            186,
            0.24
          );
      }

      /*
       * DRAFT BUILDER
       */

      .draftBuilder {
        margin-top:
          20px;
        padding:
          22px;
        border-radius:
          12px;
        border:
          1px solid
          rgba(
            132,
            200,
            186,
            0.18
          );
        background:
          rgba(
            63,
            116,
            106,
            0.055
          );
      }

      .draftHeader {
        display:
          flex;
        justify-content:
          space-between;
        gap:
          15px;
      }

      .draftHeader h3 {
        margin:
          7px 0 0;
      }

      .draftNotice {
        margin:
          17px 0;
        padding:
          13px;
        border-left:
          2px solid
          rgba(
            132,
            200,
            186,
            0.38
          );
        color:
          #91a7a2;
        background:
          rgba(
            0,
            0,
            0,
            0.12
          );
        font-size:
          10px;
        line-height:
          1.65;
      }

      .formGrid {
        display:
          grid;
        grid-template-columns:
          repeat(
            2,
            1fr
          );
        gap:
          11px;
      }

      .smallTextarea {
        min-height:
          85px;
      }

      .draftFooter {
        margin-top:
          18px;
        display:
          flex;
        justify-content:
          space-between;
        align-items:
          center;
        gap:
          18px;
      }

      .draftFooter span {
        max-width:
          520px;
        color:
          #7d9791;
        font-size:
          9px;
        line-height:
          1.6;
      }

      .primaryButton {
        width:
          auto;
        border:
          0;
        border-radius:
          9px;
        padding:
          11px 14px;
        background:
          #9dd5ca;
        color:
          #071311;
        font-weight:
          800;
      }

      /*
       * EMPTY
       */

      .empty {
        margin:
          30px 0 80px;
        padding:
          35px;
        text-align:
          center;
        color:
          #7c9690;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.065
          );
        border-radius:
          13px;
      }

      /*
       * FOOTER
       */

      .reviewFooter {
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

      .reviewFooter strong {
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
        .heroTop,
        .toolbar,
        .reviewTop,
        .draftHeader,
        .draftFooter {
          align-items:
            flex-start;
          flex-direction:
            column;
        }

        .sessionPanel {
          width:
            100%;
          justify-content:
            space-between;
        }

        .stats,
        .formGrid {
          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }

        .toolbar > input {
          width:
            100%;
        }

        .guidanceTrace > div {
          grid-template-columns:
            1fr;
        }
      }

      @media (
        max-width:
          500px
      ) {
        .reviewMain {
          width:
            92vw;
        }

        .stats,
        .formGrid {
          grid-template-columns:
            1fr;
        }

        .reviewCard {
          padding:
            20px;
        }
      }
    `}</style>
  );
}