import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";

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

      /*
       * Deliberately blank.
       *
       * BankRegX should not automatically convert
       * a case-specific correction into global methodology.
       */

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
  }

  function updateDraft(
    field,
    value
  ) {
    setDraftForm(
      (current) => ({
        ...current,
        [field]: value,
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
       * Create only a DRAFT.
       *
       * This cannot influence BankRegX until someone
       * explicitly approves it in Expert Studio.
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

      /*
       * Link the review to the draft methodology record.
       */

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
        `${data.guidanceId} created as a draft. It will not affect BankRegX until approved.`
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

  if (!authenticated) {
    return (
      <>
        <div className="loginPage">
          <div className="loginCard">
            <div className="logo">
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
              href="/expert-studio"
            >
              ← Expert Studio
            </a>
          </div>
        </div>

        <GlobalStyle />
      </>
    );
  }

  return (
    <>
      <div className="page">
        <header>
          <div className="brandArea">
            <div className="logo">
              BRX
            </div>

            <div>
              <div className="brand">
                BANKREGX
              </div>

              <div className="subbrand">
                EXPERT REVIEW
              </div>
            </div>
          </div>

          <nav>
            <a href="/">
              BankRegX
            </a>

            <a href="/expert-studio">
              Methodology
            </a>

            <a
              className="activeNav"
              href="/expert-review"
            >
              Review Queue
            </a>

            <button
              onClick={
                logout
              }
            >
              Sign out
            </button>
          </nav>
        </header>

        <main>
          <section className="hero">
            <div className="eyebrow">
              GOVERNED LEARNING
            </div>

            <h1>
              Expert Review Queue
            </h1>

            <p>
              Review BankRegX
              corrections and
              rejected assessments,
              identify reusable
              lessons and decide
              whether new expert
              methodology should be
              created.
            </p>
          </section>

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

                            <span className="status">
                              {
                                review.status
                              }
                            </span>

                            <span className="category">
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
                          <div className="linkedDraft">
                            Draft:
                            {" "}
                            {
                              review.linkedGuidanceId
                            }
                          </div>
                        )}
                      </div>

                      <div className="sectionLabel">
                        QUESTION
                      </div>

                      <div className="question">
                        {
                          review.question
                        }
                      </div>

                      <div className="sectionLabel">
                        BANKREGX
                        ASSESSMENT
                      </div>

                      <div className="markdown answerPreview">
                        <ReactMarkdown>
                          {review.aiResponse}
                        </ReactMarkdown>
                      </div>

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

                      {expanded && (
                        <div className="tracePanel">
                          <div className="sectionLabel">
                            INTELLIGENCE
                            TRACE
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
                          </div>
                        </div>
                      )}

                      <div className="actions">
                        <button
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

                      {drafting && (
                        <form
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
                            Do not copy the
                            case-specific
                            answer as a
                            global rule.
                            Express the
                            reusable
                            professional
                            judgement that
                            BankRegX should
                            apply in future
                            cases.
                          </div>

                          <label>
                            Principle title
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
                              approved.
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
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        background: #071014;
        color: #edf5f3;
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
            rgba(67, 143, 128, 0.12),
            transparent 34%
          ),
          #071014;
      }

      button,
      input,
      textarea,
      select {
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      .page {
        min-height: 100vh;
      }

      .loadingPage,
      .loginPage {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .loadingPage {
        color: #78908c;
      }

      .loginPage {
        padding: 30px;
      }

      .loginCard {
        width: min(440px, 100%);
        padding: 36px;
        border-radius: 18px;
        border: 1px solid
          rgba(255, 255, 255, 0.08);
        background:
          rgba(11, 24, 29, 0.85);
      }

      .logo {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        border: 1px solid
          rgba(145, 210, 197, 0.3);
        color: #9fd3c8;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .eyebrow {
        color: #78b3a7;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.16em;
      }

      .loginCard .eyebrow {
        margin-top: 20px;
      }

      .loginCard h1 {
        margin: 9px 0;
        font-size: 40px;
        letter-spacing: -0.04em;
      }

      .loginCard p {
        color: #829894;
        line-height: 1.6;
      }

      label {
        display: block;
        margin: 15px 0 7px;
        color: #8fa5a1;
        font-size: 10px;
        font-weight: 650;
      }

      input,
      textarea,
      select {
        width: 100%;
        outline: none;
        border: 1px solid
          rgba(255, 255, 255, 0.09);
        background: #071317;
        color: #e8f0ef;
        border-radius: 9px;
        padding: 11px 12px;
      }

      textarea {
        min-height: 125px;
        resize: vertical;
        line-height: 1.6;
      }

      input:focus,
      textarea:focus,
      select:focus {
        border-color:
          rgba(128, 199, 185, 0.5);
      }

      .loginCard button {
        width: 100%;
        border: 0;
        margin-top: 18px;
        padding: 12px;
        border-radius: 9px;
        background: #9cd5ca;
        color: #071311;
        font-weight: 800;
      }

      button:disabled {
        opacity: 0.45;
      }

      .error {
        color: #d8a0a0;
        font-size: 11px;
        margin-top: 10px;
      }

      .backLink {
        display: inline-block;
        margin-top: 20px;
        color: #82aca4;
        text-decoration: none;
        font-size: 11px;
      }

      header {
        min-height: 76px;
        padding: 0 5vw;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid
          rgba(255, 255, 255, 0.06);
      }

      .brandArea {
        display: flex;
        align-items: center;
        gap: 13px;
      }

      .brand {
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.15em;
      }

      .subbrand {
        margin-top: 3px;
        color: #617a75;
        font-size: 9px;
        letter-spacing: 0.12em;
      }

      nav {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      nav a,
      nav button {
        color: #829a95;
        text-decoration: none;
        background: transparent;
        border: 1px solid
          rgba(255, 255, 255, 0.07);
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 10px;
      }

      nav .activeNav {
        color: #b0d9d0;
        border-color:
          rgba(134, 203, 189, 0.26);
      }

      main {
        width: min(1180px, 90vw);
        margin: 0 auto;
      }

      .hero {
        padding: 70px 0 30px;
      }

      .hero h1 {
        margin: 10px 0 12px;
        font-size:
          clamp(40px, 5vw, 66px);
        letter-spacing: -0.045em;
      }

      .hero p {
        max-width: 720px;
        color: #809793;
        line-height: 1.7;
      }

      .stats {
        display: grid;
        grid-template-columns:
          repeat(4, 1fr);
        gap: 10px;
        margin: 20px 0;
      }

      .stat {
        padding: 18px;
        border: 1px solid
          rgba(255, 255, 255, 0.07);
        border-radius: 12px;
        background:
          rgba(255, 255, 255, 0.025);
      }

      .stat span {
        display: block;
        color: #67807b;
        font-size: 9px;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .stat strong {
        display: block;
        margin-top: 9px;
        font-size: 27px;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        gap: 15px;
        margin: 22px 0;
      }

      .filterButtons {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
      }

      .filterButtons button {
        border: 1px solid
          rgba(255, 255, 255, 0.07);
        color: #78908b;
        background:
          rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        padding: 9px 11px;
        font-size: 10px;
      }

      .filterButtons .selected {
        color: #b3d9d1;
        border-color:
          rgba(132, 201, 187, 0.32);
        background:
          rgba(92, 160, 147, 0.08);
      }

      .toolbar > input {
        width: 270px;
      }

      .message {
        margin: 14px 0;
        padding: 12px 14px;
        border-radius: 9px;
        background:
          rgba(94, 158, 146, 0.07);
        color: #91b6af;
        font-size: 11px;
      }

      .reviewList {
        display: grid;
        gap: 14px;
        margin-bottom: 80px;
      }

      .reviewCard {
        padding: 25px;
        border: 1px solid
          rgba(255, 255, 255, 0.07);
        border-radius: 15px;
        background:
          rgba(10, 23, 28, 0.78);
      }

      .reviewTop {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 22px;
      }

      .badgeRow {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .feedbackType,
      .status,
      .category {
        border-radius: 999px;
        padding: 5px 8px;
        font-size: 8px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .corrected {
        color: #d5c07e;
        background:
          rgba(188, 153, 65, 0.08);
      }

      .rejected {
        color: #d69b9b;
        background:
          rgba(182, 79, 79, 0.08);
      }

      .status,
      .category {
        color: #77918c;
        border: 1px solid
          rgba(255, 255, 255, 0.06);
      }

      .date {
        margin-top: 8px;
        color: #546c67;
        font-size: 9px;
      }

      .linkedDraft {
        color: #8eb7ae;
        font-family:
          ui-monospace,
          monospace;
        font-size: 9px;
      }

      .sectionLabel {
        margin-top: 22px;
        color: #66817b;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.15em;
      }

      .question {
        margin-top: 8px;
        color: #e2ecea;
        font-size: 14px;
        line-height: 1.6;
      }

      .markdown {
        margin-top: 6px;
        color: #aebfbc;
        font-size: 12px;
        line-height: 1.7;
      }

      .markdown h1,
      .markdown h2,
      .markdown h3 {
        color: #e8f1ef;
      }

      .markdown h3 {
        font-size: 15px;
        margin-top: 20px;
      }

      .markdown li {
        margin: 5px 0;
      }

      .answerPreview {
        max-height: 320px;
        overflow: auto;
        padding-right: 10px;
      }

      .correctionLabel {
        color: #b69f65;
      }

      .correction {
        margin-top: 8px;
        padding: 16px;
        border-radius: 10px;
        border: 1px solid
          rgba(202, 174, 98, 0.14);
        background:
          rgba(170, 140, 62, 0.035);
        color: #c9d4d1;
        line-height: 1.7;
        font-size: 12px;
      }

      .correction p:first-child {
        margin-top: 0;
      }

      .rationale {
        margin-top: 8px;
        color: #93a7a3;
        line-height: 1.6;
        font-size: 11px;
      }

      .tracePanel {
        margin-top: 22px;
        padding: 17px;
        border-radius: 11px;
        background:
          rgba(0, 0, 0, 0.15);
      }

      .tracePanel .sectionLabel {
        margin-top: 0;
      }

      .guidanceTrace {
        margin-top: 12px;
        display: grid;
        gap: 7px;
      }

      .guidanceTrace > div {
        display: grid;
        grid-template-columns:
          130px 1fr;
        gap: 12px;
        padding: 9px;
        border-radius: 8px;
        background:
          rgba(255, 255, 255, 0.025);
      }

      .guidanceTrace span {
        color: #6d8983;
        font-family:
          ui-monospace,
          monospace;
        font-size: 9px;
      }

      .guidanceTrace strong {
        color: #9eb2ae;
        font-size: 10px;
        font-weight: 600;
      }

      .traceMeta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 13px;
        color: #58716c;
        font-size: 9px;
      }

      .muted {
        margin-top: 10px;
        color: #5c746f;
        font-size: 10px;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 22px;
        padding-top: 17px;
        border-top: 1px solid
          rgba(255, 255, 255, 0.05);
      }

      .actions button,
      .draftHeader button {
        border: 1px solid
          rgba(255, 255, 255, 0.08);
        color: #829a95;
        background:
          rgba(255, 255, 255, 0.025);
        border-radius: 8px;
        padding: 8px 11px;
        font-size: 10px;
      }

      .actions .createDraft {
        color: #a8d0c7;
        border-color:
          rgba(132, 200, 186, 0.22);
      }

      .draftBuilder {
        margin-top: 20px;
        padding: 21px;
        border-radius: 12px;
        border: 1px solid
          rgba(132, 200, 186, 0.16);
        background:
          rgba(63, 116, 106, 0.045);
      }

      .draftHeader {
        display: flex;
        justify-content: space-between;
        gap: 15px;
      }

      .draftHeader h3 {
        margin: 7px 0 0;
      }

      .draftNotice {
        margin: 17px 0;
        padding: 12px;
        border-left: 2px solid
          rgba(132, 200, 186, 0.35);
        color: #839b96;
        background:
          rgba(0, 0, 0, 0.12);
        font-size: 10px;
        line-height: 1.6;
      }

      .formGrid {
        display: grid;
        grid-template-columns:
          repeat(2, 1fr);
        gap: 11px;
      }

      .smallTextarea {
        min-height: 85px;
      }

      .draftFooter {
        margin-top: 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
      }

      .draftFooter span {
        color: #647d78;
        font-size: 9px;
        line-height: 1.5;
      }

      .primaryButton {
        width: auto;
        border: 0;
        border-radius: 9px;
        padding: 10px 14px;
        background: #9dd5ca;
        color: #071311;
        font-weight: 800;
      }

      .empty {
        margin: 30px 0 80px;
        padding: 35px;
        text-align: center;
        color: #607772;
        border: 1px solid
          rgba(255, 255, 255, 0.06);
        border-radius: 13px;
      }

      @media (
        max-width: 760px
      ) {
        header,
        .toolbar,
        .reviewTop,
        .draftHeader,
        .draftFooter {
          align-items: flex-start;
          flex-direction: column;
        }

        header {
          height: auto;
          padding-top: 15px;
          padding-bottom: 15px;
        }

        nav {
          flex-wrap: wrap;
        }

        .stats,
        .formGrid {
          grid-template-columns:
            repeat(2, 1fr);
        }

        .toolbar > input {
          width: 100%;
        }

        .guidanceTrace > div {
          grid-template-columns:
            1fr;
        }
      }

      @media (
        max-width: 500px
      ) {
        .stats,
        .formGrid {
          grid-template-columns:
            1fr;
        }
      }
    `}</style>
  );
}