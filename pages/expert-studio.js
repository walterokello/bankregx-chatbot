import {
  useEffect,
  useMemo,
  useState,
} from "react";

import BankRegXNav from "../components/BankRegXNav";

const EMPTY_FORM = {
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
  status: "draft",
};

export default function ExpertStudio() {
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
    guidance,
    setGuidance,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  /*
   * =====================================================
   * VERSION HISTORY
   * =====================================================
   */

  const [
    historyData,
    setHistoryData,
  ] = useState(null);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

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
        await loadGuidance();
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

      await loadGuidance();
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

    setGuidance([]);
    setHistoryData(null);
  }

  /*
   * =====================================================
   * LOAD METHODOLOGY
   * =====================================================
   */

  async function loadGuidance() {
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/admin/guidance",
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
            "Unable to load guidance"
        );
      }

      setGuidance(
        Array.isArray(
          data.guidance
        )
          ? data.guidance
          : []
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
   * VERSION HISTORY
   * =====================================================
   */

  async function openHistory(
    item
  ) {
    setHistoryData(null);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const response =
        await fetch(
          `/api/admin/guidance-history?guidanceId=${encodeURIComponent(
            item.guidanceId
          )}`,
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
            "Unable to load version history"
        );
      }

      setHistoryData(
        data
      );
    } catch (error) {
      setHistoryError(
        error.message
      );
    } finally {
      setHistoryLoading(
        false
      );
    }
  }

  function closeHistory() {
    setHistoryData(null);
    setHistoryError("");
    setHistoryLoading(
      false
    );
  }

  function compareValues(
    first,
    second
  ) {
    if (
      Array.isArray(first) ||
      Array.isArray(second)
    ) {
      return (
        JSON.stringify(
          first || []
        ) ===
        JSON.stringify(
          second || []
        )
      );
    }

    return (
      String(
        first ?? ""
      ) ===
      String(
        second ?? ""
      )
    );
  }

  function getChanges(
    version,
    previousVersion
  ) {
    if (!previousVersion) {
      return [
        "Original version",
      ];
    }

    const fields = [
      [
        "title",
        "Title",
      ],

      [
        "guidance",
        "Expert principle",
      ],

      [
        "category",
        "Category",
      ],

      [
        "subcategory",
        "Subcategory",
      ],

      [
        "tags",
        "Tags",
      ],

      [
        "priority",
        "Priority",
      ],

      [
        "rationale",
        "Rationale",
      ],

      [
        "appliesTo",
        "Applies to",
      ],

      [
        "status",
        "Status",
      ],
    ];

    const changes =
      fields
        .filter(
          ([
            field,
          ]) =>
            !compareValues(
              version[field],
              previousVersion[
                field
              ]
            )
        )
        .map(
          ([
            ,
            label,
          ]) => label
        );

    return changes.length
      ? changes
      : [
          "Administrative update",
        ];
  }

  /*
   * =====================================================
   * FORM HELPERS
   * =====================================================
   */

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

  function updateForm(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,

        [field]:
          value,
      })
    );
  }

  function resetForm() {
    setForm(
      EMPTY_FORM
    );

    setEditingId(
      null
    );

    setMessage("");
  }

  function editItem(
    item
  ) {
    setEditingId(
      item.id
    );

    setForm({
      title:
        item.title ||
        "",

      guidance:
        item.guidance ||
        "",

      category:
        item.category ||
        "control_design",

      subcategory:
        item.subcategory ||
        "",

      tags:
        (
          item.tags || []
        ).join(", "),

      priority:
        item.priority ||
        "medium",

      rationale:
        item.rationale ||
        "",

      appliesTo:
        (
          item.appliesTo ||
          []
        ).join(", "),

      status:
        item.status ||
        "draft",
    });

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  /*
   * =====================================================
   * SAVE METHODOLOGY
   * =====================================================
   */

  async function saveGuidance(
    event
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        title:
          form.title,

        guidance:
          form.guidance,

        category:
          form.category,

        subcategory:
          form.subcategory,

        tags:
          splitList(
            form.tags
          ),

        priority:
          form.priority,

        rationale:
          form.rationale,

        appliesTo:
          splitList(
            form.appliesTo
          ),

        status:
          form.status,
      };

      if (editingId) {
        payload.id =
          editingId;
      }

      const response =
        await fetch(
          "/api/admin/guidance",
          {
            method:
              editingId
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
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
            "Unable to save guidance"
        );
      }

      setMessage(
        editingId
          ? `Saved as version ${data.version}.`
          : `Created ${data.guidanceId}.`
      );

      setForm(
        EMPTY_FORM
      );

      setEditingId(
        null
      );

      await loadGuidance();
    } catch (error) {
      setMessage(
        error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =====================================================
   * STATUS GOVERNANCE
   * =====================================================
   */

  async function changeStatus(
    item,
    status
  ) {
    const label =
      status ===
      "approved"
        ? "approve"
        : status ===
          "deprecated"
        ? "deprecate"
        : "move to draft";

    if (
      !window.confirm(
        `Are you sure you want to ${label} ${item.guidanceId}?`
      )
    ) {
      return;
    }

    setMessage("");

    try {
      const response =
        await fetch(
          "/api/admin/guidance",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  item.id,

                status,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update status"
        );
      }

      setMessage(
        `${item.guidanceId} updated to ${status}.`
      );

      await loadGuidance();
    } catch (error) {
      setMessage(
        error.message
      );
    }
  }

  /*
   * =====================================================
   * DASHBOARD STATS
   * =====================================================
   */

  const stats =
    useMemo(() => {
      return {
        total:
          guidance.length,

        approved:
          guidance.filter(
            (item) =>
              item.status ===
              "approved"
          ).length,

        draft:
          guidance.filter(
            (item) =>
              item.status ===
              "draft"
          ).length,

        deprecated:
          guidance.filter(
            (item) =>
              item.status ===
              "deprecated"
          ).length,
      };
    }, [guidance]);

  /*
   * =====================================================
   * SEARCH / FILTER
   * =====================================================
   */

  const filteredGuidance =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return guidance.filter(
        (item) => {
          if (
            statusFilter !==
              "all" &&
            item.status !==
              statusFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const text = [
            item.guidanceId,
            item.title,
            item.guidance,
            item.category,
            item.subcategory,
            ...(item.tags ||
              []),
          ]
            .join(" ")
            .toLowerCase();

          return text.includes(
            query
          );
        }
      );
    }, [
      guidance,
      search,
      statusFilter,
    ]);

  /*
   * =====================================================
   * DISPLAY HELPERS
   * =====================================================
   */

  function formatDate(
    value
  ) {
    if (!value) {
      return "Never";
    }

    try {
      return new Date(
        value
      ).toLocaleString();
    } catch {
      return value;
    }
  }

  function displayCategory(
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
          Studio session...
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
              Expert Studio
            </h1>

            <p>
              Private access to
              governed BankRegX
              professional
              methodology.
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
                  : "Enter Expert Studio"}
              </button>
            </form>

            <div className="securityNote">
              Your admin key is
              exchanged for a
              secure HTTP-only
              session and is not
              stored in the
              browser.
            </div>

            <a
              href="/"
              className="homeLink"
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
   * MAIN EXPERT STUDIO
   * =====================================================
   */

  return (
    <>
      <div className="page">
        <BankRegXNav
          current="studio"
        />

        <main className="studioMain">
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
                  INTELLIGENCE
                </div>

                <h1>
                  Expert
                  methodology
                </h1>

                <p>
                  Create, review,
                  approve, version
                  and retire the
                  professional
                  principles that
                  inform BankRegX
                  assessments.
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
              label="Total"
              value={
                stats.total
              }
            />

            <Stat
              label="Approved"
              value={
                stats.approved
              }
            />

            <Stat
              label="Draft"
              value={
                stats.draft
              }
            />

            <Stat
              label="Deprecated"
              value={
                stats.deprecated
              }
            />
          </section>

          {/*
           * =================================================
           * EDITOR
           * =================================================
           */}

          <section className="editor">
            <div className="editorHeader">
              <div>
                <div className="eyebrow">
                  {editingId
                    ? "EDIT PRINCIPLE"
                    : "NEW PRINCIPLE"}
                </div>

                <h2>
                  {editingId
                    ? "Update expert guidance"
                    : "Teach BankRegX"}
                </h2>

                <p className="sectionIntro">
                  Create reusable
                  professional
                  methodology.
                  Draft principles
                  cannot influence
                  BankRegX until
                  explicitly
                  approved.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  className="ghostButton"
                  onClick={
                    resetForm
                  }
                >
                  Cancel edit
                </button>
              )}
            </div>

            <form
              onSubmit={
                saveGuidance
              }
            >
              <div className="field">
                <label>
                  Principle title
                </label>

                <input
                  value={
                    form.title
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "title",
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Assess the causal relationship between risk and control"
                  required
                />
              </div>

              <div className="field">
                <label>
                  Expert principle
                </label>

                <textarea
                  value={
                    form.guidance
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "guidance",
                      event.target
                        .value
                    )
                  }
                  placeholder="Describe the reusable professional judgement BankRegX should apply..."
                  required
                />
              </div>

              <div className="grid">
                <div className="field">
                  <label>
                    Category
                  </label>

                  <select
                    value={
                      form.category
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "category",
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="control_design">
                      Control Design
                    </option>

                    <option value="audit_judgement">
                      Audit Judgement
                    </option>

                    <option value="regulatory_impact">
                      Regulatory Impact
                    </option>

                    <option value="general">
                      General
                    </option>
                  </select>
                </div>

                <div className="field">
                  <label>
                    Subcategory
                  </label>

                  <input
                    value={
                      form.subcategory
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "subcategory",
                        event.target
                          .value
                      )
                    }
                    placeholder="e.g. risk_control_alignment"
                  />
                </div>

                <div className="field">
                  <label>
                    Priority
                  </label>

                  <select
                    value={
                      form.priority
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
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

                <div className="field">
                  <label>
                    Status
                  </label>

                  <select
                    value={
                      form.status
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "status",
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="draft">
                      Draft
                    </option>

                    <option value="approved">
                      Approved
                    </option>

                    <option value="deprecated">
                      Deprecated
                    </option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>
                  Tags
                </label>

                <input
                  value={
                    form.tags
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "tags",
                      event.target
                        .value
                    )
                  }
                  placeholder="risk, control design, timing, detective"
                />

                <span className="hint">
                  Separate tags
                  with commas.
                </span>
              </div>

              <div className="field">
                <label>
                  Applies to
                </label>

                <input
                  value={
                    form.appliesTo
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "appliesTo",
                      event.target
                        .value
                    )
                  }
                  placeholder="control assessment, audit finding review"
                />
              </div>

              <div className="field">
                <label>
                  Rationale
                </label>

                <textarea
                  className="rationaleInput"
                  value={
                    form.rationale
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "rationale",
                      event.target
                        .value
                    )
                  }
                  placeholder="Why is this principle important?"
                />
              </div>

              <div className="saveRow">
                <div className="saveMessage">
                  {message}
                </div>

                <button
                  className="primaryButton"
                  type="submit"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save new version"
                    : "Create principle"}
                </button>
              </div>
            </form>
          </section>

          {/*
           * =================================================
           * LIBRARY
           * =================================================
           */}

          <section className="library">
            <div className="libraryHeader">
              <div>
                <div className="eyebrow">
                  METHODOLOGY
                  LIBRARY
                </div>

                <h2>
                  Expert
                  intelligence
                </h2>

                <p className="sectionIntro">
                  Governed
                  methodology
                  available to
                  BankRegX
                  assessments.
                </p>
              </div>

              <div className="filters">
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
                  placeholder="Search methodology..."
                />

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusFilter(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="all">
                    All status
                  </option>

                  <option value="approved">
                    Approved
                  </option>

                  <option value="draft">
                    Draft
                  </option>

                  <option value="deprecated">
                    Deprecated
                  </option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="empty">
                Loading expert
                methodology...
              </div>
            ) : filteredGuidance.length ===
              0 ? (
              <div className="empty">
                No principles
                match this view.
              </div>
            ) : (
              <div className="guidanceList">
                {filteredGuidance.map(
                  (item) => (
                    <article
                      key={
                        item.id
                      }
                      className="guidanceCard"
                    >
                      <div className="cardTop">
                        <div>
                          <div className="idRow">
                            <span className="guidanceId">
                              {
                                item.guidanceId
                              }
                            </span>

                            <span
                              className={`status status-${item.status}`}
                            >
                              {
                                item.status
                              }
                            </span>

                            <span
                              className={`priority priority-${item.priority}`}
                            >
                              {
                                item.priority
                              }
                            </span>
                          </div>

                          <h3>
                            {
                              item.title
                            }
                          </h3>

                          <div className="category">
                            {displayCategory(
                              item.category
                            )}

                            {item.subcategory
                              ? ` · ${displayCategory(
                                  item.subcategory
                                )}`
                              : ""}
                          </div>
                        </div>

                        <div className="version">
                          v
                          {
                            item.version
                          }
                        </div>
                      </div>

                      <p className="principle">
                        {
                          item.guidance
                        }
                      </p>

                      {item.rationale && (
                        <div className="rationaleText">
                          <strong>
                            Rationale
                          </strong>

                          <br />

                          {
                            item.rationale
                          }
                        </div>
                      )}

                      {item.tags.length >
                        0 && (
                        <div className="tags">
                          {item.tags.map(
                            (tag) => (
                              <span
                                key={
                                  tag
                                }
                              >
                                {
                                  tag
                                }
                              </span>
                            )
                          )}
                        </div>
                      )}

                      <div className="usage">
                        <div>
                          <span>
                            USED
                          </span>

                          <strong>
                            {
                              item.usageCount
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            LAST USED
                          </span>

                          <strong>
                            {formatDate(
                              item.lastUsedAt
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            UPDATED
                          </span>

                          <strong>
                            {formatDate(
                              item.updatedAt
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="cardActions">
                        <button
                          className="historyButton"
                          onClick={() =>
                            openHistory(
                              item
                            )
                          }
                        >
                          View history
                        </button>

                        <button
                          onClick={() =>
                            editItem(
                              item
                            )
                          }
                        >
                          Edit
                        </button>

                        {item.status !==
                          "approved" && (
                          <button
                            className="approveButton"
                            onClick={() =>
                              changeStatus(
                                item,
                                "approved"
                              )
                            }
                          >
                            Approve
                          </button>
                        )}

                        {item.status ===
                          "approved" && (
                          <button
                            onClick={() =>
                              changeStatus(
                                item,
                                "draft"
                              )
                            }
                          >
                            Move to
                            draft
                          </button>
                        )}

                        {item.status !==
                          "deprecated" && (
                          <button
                            className="danger"
                            onClick={() =>
                              changeStatus(
                                item,
                                "deprecated"
                              )
                            }
                          >
                            Deprecate
                          </button>
                        )}
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </main>

        <footer className="studioFooter">
          <strong>
            BANKREGX
          </strong>

          <span>
            GOVERNED EXPERT
            INTELLIGENCE
          </span>
        </footer>
      </div>

      {/*
       * ===================================================
       * VERSION HISTORY MODAL
       * ===================================================
       */}

      {(historyLoading ||
        historyData ||
        historyError) && (
        <div
          className="modalBackdrop"
          onClick={
            closeHistory
          }
        >
          <div
            className="historyModal"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="historyHeader">
              <div>
                <div className="eyebrow">
                  METHODOLOGY
                  AUDIT TRAIL
                </div>

                <h2>
                  Version history
                </h2>

                {historyData && (
                  <div className="historyId">
                    {
                      historyData.guidanceId
                    }
                  </div>
                )}
              </div>

              <button
                className="closeButton"
                onClick={
                  closeHistory
                }
              >
                ×
              </button>
            </div>

            {historyLoading && (
              <div className="historyLoading">
                Loading
                methodology audit
                trail...
              </div>
            )}

            {historyError && (
              <div className="historyError">
                {historyError}
              </div>
            )}

            {historyData && (
              <>
                <div className="historySummary">
                  <div>
                    <span>
                      CURRENT VERSION
                    </span>

                    <strong>
                      v
                      {
                        historyData.currentVersion
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      VERSIONS
                    </span>

                    <strong>
                      {
                        historyData.versionCount
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      DOCUMENT
                    </span>

                    <strong className="documentId">
                      {
                        historyData.documentId
                      }
                    </strong>
                  </div>
                </div>

                <div className="timeline">
                  {historyData.versions.map(
                    (
                      version,
                      index
                    ) => {
                      const previousVersion =
                        historyData
                          .versions[
                          index + 1
                        ];

                      const changes =
                        getChanges(
                          version,
                          previousVersion
                        );

                      return (
                        <article
                          key={
                            version.isCurrent
                              ? `current-${version.version}`
                              : version.historyId ||
                                `history-${version.version}`
                          }
                          className={`versionCard ${
                            version.isCurrent
                              ? "currentVersion"
                              : ""
                          }`}
                        >
                          <div className="versionTop">
                            <div className="versionIdentity">
                              <span className="versionNumber">
                                v
                                {
                                  version.version
                                }
                              </span>

                              {version.isCurrent ? (
                                <span className="currentBadge">
                                  CURRENT
                                </span>
                              ) : (
                                <span className="archivedBadge">
                                  ARCHIVED
                                </span>
                              )}

                              <span
                                className={`status status-${version.status}`}
                              >
                                {
                                  version.status
                                }
                              </span>

                              <span
                                className={`priority priority-${version.priority}`}
                              >
                                {
                                  version.priority
                                }
                              </span>
                            </div>

                            <div className="versionDate">
                              {formatDate(
                                version.isCurrent
                                  ? version.updatedAt
                                  : version.archivedAt
                              )}
                            </div>
                          </div>

                          <h3>
                            {
                              version.title
                            }
                          </h3>

                          <div className="historyCategory">
                            {displayCategory(
                              version.category
                            )}

                            {version.subcategory
                              ? ` · ${displayCategory(
                                  version.subcategory
                                )}`
                              : ""}
                          </div>

                          <div className="changeRow">
                            {changes.map(
                              (
                                change
                              ) => (
                                <span
                                  key={
                                    change
                                  }
                                >
                                  {
                                    change
                                  }
                                </span>
                              )
                            )}
                          </div>

                          <div className="versionSection">
                            <div className="versionLabel">
                              EXPERT
                              PRINCIPLE
                            </div>

                            <p>
                              {
                                version.guidance
                              }
                            </p>
                          </div>

                          {version.rationale && (
                            <div className="versionSection">
                              <div className="versionLabel">
                                RATIONALE
                              </div>

                              <p>
                                {
                                  version.rationale
                                }
                              </p>
                            </div>
                          )}

                          {Array.isArray(
                            version.tags
                          ) &&
                            version.tags
                              .length >
                              0 && (
                              <div className="historyTags">
                                {version.tags.map(
                                  (
                                    tag
                                  ) => (
                                    <span
                                      key={
                                        tag
                                      }
                                    >
                                      {
                                        tag
                                      }
                                    </span>
                                  )
                                )}
                              </div>
                            )}

                          {version.isCurrent && (
                            <div className="currentUsage">
                              Used{" "}
                              {
                                version.usageCount
                              }{" "}
                              times · Last
                              used{" "}
                              {formatDate(
                                version.lastUsedAt
                              )}
                            </div>
                          )}

                          {!version.isCurrent &&
                            version.archivedBy && (
                              <div className="archiveMeta">
                                Archived by{" "}
                                {
                                  version.archivedBy
                                }
                              </div>
                            )}
                        </article>
                      );
                    }
                  )}
                </div>

                <div className="auditNote">
                  Previous versions
                  are retained for
                  audit purposes.
                  Editing the
                  current principle
                  creates a new
                  version rather
                  than overwriting
                  the historical
                  record.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <GlobalStyle />
    </>
  );
}

/*
 * =========================================================
 * STAT
 * =========================================================
 */

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

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

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
          #94aaa6;
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
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.09
          );
        border-radius:
          20px;
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
            141,
            213,
            198,
            0.3
          );
        color:
          #b6e2d8;
        font-size:
          11px;
        font-weight:
          800;
        letter-spacing:
          0.08em;
      }

      .loginCard h1 {
        margin:
          10px 0;
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
        margin-top:
          18px;
        border:
          0;
        border-radius:
          10px;
        padding:
          12px 18px;
        background:
          #9bd4c8;
        color:
          #071311;
        font-weight:
          800;
      }

      .securityNote {
        margin-top:
          16px;
        color:
          #7f9792;
        font-size:
          10px;
        line-height:
          1.5;
      }

      .homeLink {
        display:
          inline-block;
        margin-top:
          22px;
        color:
          #a1c4bc;
        text-decoration:
          none;
        font-size:
          11px;
      }

      .error {
        margin-top:
          10px;
        color:
          #e0a7a7;
        font-size:
          11px;
      }

      /*
       * PAGE
       */

      .studioMain {
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
          700px;
        color:
          #9eb2ae;
        line-height:
          1.7;
        font-size:
          14px;
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

      .signOutButton,
      .ghostButton {
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

      .signOutButton:hover,
      .ghostButton:hover {
        color:
          #edf5f3;
        border-color:
          rgba(
            157,
            214,
            202,
            0.25
          );
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
        text-transform:
          uppercase;
        letter-spacing:
          0.12em;
      }

      .stat strong {
        display:
          block;
        margin-top:
          9px;
        color:
          #eef5f3;
        font-size:
          29px;
      }

      /*
       * PANELS
       */

      .editor,
      .library {
        margin-top:
          18px;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.075
          );
        border-radius:
          17px;
        background:
          rgba(
            11,
            24,
            29,
            0.74
          );
        padding:
          29px;
      }

      .editorHeader,
      .libraryHeader,
      .cardTop,
      .saveRow {
        display:
          flex;
        justify-content:
          space-between;
        align-items:
          flex-start;
        gap:
          20px;
      }

      .editor h2,
      .library h2 {
        margin:
          7px 0 5px;
        font-size:
          26px;
        letter-spacing:
          -0.025em;
      }

      .sectionIntro {
        margin:
          7px 0 18px;
        max-width:
          580px;
        color:
          #8fa6a1;
        font-size:
          11px;
        line-height:
          1.6;
      }

      /*
       * FORM
       */

      label {
        display:
          block;
        margin:
          16px 0 7px;
        color:
          #a5b8b4;
        font-size:
          11px;
        font-weight:
          650;
      }

      input,
      textarea,
      select {
        width:
          100%;
        color:
          #e7efed;
        background:
          #071317;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.1
          );
        border-radius:
          10px;
        outline:
          none;
        padding:
          12px 13px;
      }

      input::placeholder,
      textarea::placeholder {
        color:
          #657d78;
      }

      input:focus,
      textarea:focus,
      select:focus {
        border-color:
          rgba(
            129,
            199,
            185,
            0.52
          );
        box-shadow:
          0 0 0 3px
          rgba(
            108,
            176,
            163,
            0.04
          );
      }

      textarea {
        min-height:
          130px;
        resize:
          vertical;
        line-height:
          1.6;
      }

      .rationaleInput {
        min-height:
          90px;
      }

      .grid {
        display:
          grid;
        grid-template-columns:
          repeat(
            2,
            1fr
          );
        gap:
          12px;
      }

      .hint {
        display:
          block;
        margin-top:
          6px;
        color:
          #6e8782;
        font-size:
          9px;
      }

      .saveRow {
        margin-top:
          20px;
        align-items:
          center;
      }

      .saveMessage {
        color:
          #9fc0b9;
        font-size:
          11px;
      }

      .primaryButton {
        width:
          auto;
        margin:
          0;
        border:
          0;
        border-radius:
          10px;
        padding:
          12px 18px;
        background:
          #9dd6ca;
        color:
          #071311;
        font-weight:
          800;
        box-shadow:
          0 8px 24px
          rgba(
            91,
            161,
            147,
            0.14
          );
      }

      .primaryButton:hover:not(
        :disabled
      ) {
        transform:
          translateY(
            -1px
          );
      }

      button:disabled {
        opacity:
          0.45;
        cursor:
          default;
      }

      /*
       * LIBRARY
       */

      .library {
        margin-bottom:
          80px;
      }

      .filters {
        display:
          flex;
        gap:
          8px;
      }

      .filters input {
        width:
          250px;
      }

      .filters select {
        width:
          145px;
      }

      .guidanceList {
        display:
          grid;
        gap:
          11px;
      }

      .guidanceCard {
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.07
          );
        background:
          rgba(
            4,
            13,
            16,
            0.52
          );
        border-radius:
          13px;
        padding:
          21px;
        transition:
          150ms ease;
      }

      .guidanceCard:hover {
        border-color:
          rgba(
            137,
            200,
            187,
            0.17
          );
      }

      .idRow {
        display:
          flex;
        flex-wrap:
          wrap;
        gap:
          6px;
        align-items:
          center;
      }

      .guidanceId {
        color:
          #84a29c;
        font-family:
          ui-monospace,
          monospace;
        font-size:
          9px;
      }

      .status,
      .priority {
        border-radius:
          999px;
        padding:
          4px 7px;
        font-size:
          8px;
        text-transform:
          uppercase;
        letter-spacing:
          0.08em;
      }

      .status-approved {
        color:
          #a8d9bf;
        background:
          rgba(
            94,
            177,
            139,
            0.1
          );
      }

      .status-draft {
        color:
          #dec98f;
        background:
          rgba(
            187,
            158,
            86,
            0.09
          );
      }

      .status-deprecated {
        color:
          #d1a0a0;
        background:
          rgba(
            170,
            95,
            95,
            0.09
          );
      }

      .priority-critical {
        color:
          #e1a3a3;
      }

      .priority-high {
        color:
          #dec58d;
      }

      .priority-medium {
        color:
          #9eb2ae;
      }

      .priority-low {
        color:
          #7a918d;
      }

      .guidanceCard h3 {
        margin:
          10px 0 5px;
        color:
          #edf4f2;
        font-size:
          17px;
      }

      .category {
        color:
          #76918b;
        font-size:
          10px;
      }

      .version {
        color:
          #809b95;
        font-family:
          ui-monospace,
          monospace;
        font-size:
          10px;
      }

      .principle {
        color:
          #bdcbc8;
        line-height:
          1.7;
        font-size:
          13px;
      }

      .rationaleText {
        border-left:
          2px solid
          rgba(
            124,
            179,
            168,
            0.3
          );
        padding-left:
          13px;
        color:
          #879d99;
        font-size:
          11px;
        line-height:
          1.65;
      }

      .rationaleText strong {
        color:
          #a9bbb7;
      }

      .tags {
        display:
          flex;
        flex-wrap:
          wrap;
        gap:
          5px;
        margin-top:
          14px;
      }

      .tags span {
        padding:
          5px 7px;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.065
          );
        border-radius:
          999px;
        color:
          #819b95;
        font-size:
          9px;
      }

      .usage {
        display:
          grid;
        grid-template-columns:
          120px
          1fr
          1fr;
        gap:
          15px;
        margin-top:
          17px;
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

      .usage span {
        display:
          block;
        color:
          #66807a;
        font-size:
          8px;
        letter-spacing:
          0.1em;
      }

      .usage strong {
        display:
          block;
        margin-top:
          4px;
        color:
          #8fa5a1;
        font-size:
          10px;
        font-weight:
          500;
      }

      /*
       * CARD ACTIONS
       */

      .cardActions {
        display:
          flex;
        flex-wrap:
          wrap;
        gap:
          7px;
        margin-top:
          17px;
      }

      .cardActions button {
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
            255,
            255,
            255,
            0.028
          );
        color:
          #9cb1ad;
        border-radius:
          8px;
        padding:
          8px 11px;
        font-size:
          10px;
      }

      .cardActions button:hover {
        color:
          #e5eeec;
        border-color:
          rgba(
            157,
            214,
            202,
            0.22
          );
      }

      .cardActions .historyButton {
        color:
          #acd1c8;
        border-color:
          rgba(
            132,
            200,
            186,
            0.21
          );
      }

      .cardActions .approveButton {
        color:
          #acd6bf;
      }

      .cardActions .danger {
        color:
          #c99d9d;
      }

      .empty {
        padding:
          35px 0;
        color:
          #7d9691;
        font-size:
          12px;
      }

      /*
       * FOOTER
       */

      .studioFooter {
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
        align-items:
          center;
        justify-content:
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

      .studioFooter strong {
        color:
          #819b95;
      }

      /*
       * HISTORY MODAL
       */

      .modalBackdrop {
        position:
          fixed;
        inset:
          0;
        z-index:
          100;
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
        padding:
          32px;
        overflow-y:
          auto;
      }

      .historyModal {
        width:
          min(
            900px,
            100%
          );
        margin:
          0 auto;
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
        padding:
          28px;
      }

      .historyHeader {
        display:
          flex;
        justify-content:
          space-between;
        gap:
          20px;
        align-items:
          flex-start;
      }

      .historyHeader .eyebrow {
        margin:
          0;
      }

      .historyHeader h2 {
        margin:
          7px 0 5px;
        font-size:
          27px;
      }

      .historyId {
        color:
          #87a29c;
        font-family:
          ui-monospace,
          monospace;
        font-size:
          10px;
      }

      .closeButton {
        width:
          36px;
        height:
          36px;
        border-radius:
          9px;
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
            0.035
          );
        color:
          #a9bdb9;
        font-size:
          20px;
      }

      .historyLoading,
      .historyError {
        margin-top:
          25px;
        padding:
          25px;
        color:
          #879e99;
        text-align:
          center;
      }

      .historyError {
        color:
          #d9a4a4;
      }

      .historySummary {
        margin-top:
          25px;
        display:
          grid;
        grid-template-columns:
          150px
          150px
          1fr;
        gap:
          9px;
      }

      .historySummary > div {
        padding:
          15px;
        border-radius:
          10px;
        background:
          rgba(
            255,
            255,
            255,
            0.028
          );
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.06
          );
      }

      .historySummary span {
        display:
          block;
        color:
          #69847d;
        font-size:
          8px;
        letter-spacing:
          0.11em;
      }

      .historySummary strong {
        display:
          block;
        margin-top:
          7px;
        color:
          #bdceca;
        font-size:
          15px;
      }

      .historySummary .documentId {
        font-size:
          9px;
        font-family:
          ui-monospace,
          monospace;
        word-break:
          break-all;
      }

      .timeline {
        margin-top:
          22px;
        display:
          grid;
        gap:
          12px;
      }

      .versionCard {
        position:
          relative;
        padding:
          20px;
        border-radius:
          12px;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.07
          );
        background:
          rgba(
            0,
            0,
            0,
            0.13
          );
      }

      .versionCard.currentVersion {
        border-color:
          rgba(
            124,
            195,
            181,
            0.27
          );
        background:
          rgba(
            67,
            126,
            114,
            0.065
          );
      }

      .versionTop {
        display:
          flex;
        justify-content:
          space-between;
        gap:
          15px;
      }

      .versionIdentity {
        display:
          flex;
        flex-wrap:
          wrap;
        gap:
          6px;
        align-items:
          center;
      }

      .versionNumber {
        color:
          #dce8e5;
        font-family:
          ui-monospace,
          monospace;
        font-size:
          11px;
        font-weight:
          800;
      }

      .currentBadge,
      .archivedBadge {
        border-radius:
          999px;
        padding:
          4px 7px;
        font-size:
          7px;
        letter-spacing:
          0.09em;
      }

      .currentBadge {
        color:
          #a8d9cd;
        background:
          rgba(
            86,
            172,
            148,
            0.1
          );
      }

      .archivedBadge {
        color:
          #829b96;
        background:
          rgba(
            255,
            255,
            255,
            0.04
          );
      }

      .versionDate {
        color:
          #718984;
        font-size:
          9px;
      }

      .versionCard h3 {
        margin:
          14px 0 5px;
        color:
          #edf4f2;
        font-size:
          17px;
      }

      .historyCategory {
        color:
          #738e88;
        font-size:
          9px;
      }

      .changeRow {
        display:
          flex;
        flex-wrap:
          wrap;
        gap:
          5px;
        margin-top:
          13px;
      }

      .changeRow span {
        padding:
          5px 7px;
        border-radius:
          999px;
        background:
          rgba(
            127,
            178,
            168,
            0.08
          );
        color:
          #8fa9a3;
        font-size:
          8px;
      }

      .versionSection {
        margin-top:
          17px;
      }

      .versionLabel {
        color:
          #6c8780;
        font-size:
          8px;
        font-weight:
          800;
        letter-spacing:
          0.12em;
      }

      .versionSection p {
        margin:
          7px 0 0;
        color:
          #b1c2be;
        line-height:
          1.67;
        font-size:
          12px;
      }

      .historyTags {
        display:
          flex;
        flex-wrap:
          wrap;
        gap:
          5px;
        margin-top:
          15px;
      }

      .historyTags span {
        padding:
          5px 7px;
        border-radius:
          999px;
        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.06
          );
        color:
          #819b95;
        font-size:
          8px;
      }

      .currentUsage,
      .archiveMeta {
        margin-top:
          17px;
        padding-top:
          13px;
        border-top:
          1px solid
          rgba(
            255,
            255,
            255,
            0.05
          );
        color:
          #728b85;
        font-size:
          9px;
      }

      .auditNote {
        margin-top:
          18px;
        padding:
          14px;
        border-left:
          2px solid
          rgba(
            123,
            191,
            178,
            0.32
          );
        background:
          rgba(
            255,
            255,
            255,
            0.02
          );
        color:
          #7e9892;
        font-size:
          10px;
        line-height:
          1.6;
      }

      /*
       * RESPONSIVE
       */

      @media (
        max-width:
          800px
      ) {
        .heroTop,
        .editorHeader,
        .libraryHeader,
        .saveRow,
        .versionTop {
          flex-direction:
            column;
        }

        .sessionPanel {
          width:
            100%;
          justify-content:
            space-between;
        }

        .stats {
          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }

        .grid,
        .usage,
        .historySummary {
          grid-template-columns:
            1fr;
        }

        .filters {
          width:
            100%;
          flex-direction:
            column;
        }

        .filters input,
        .filters select {
          width:
            100%;
        }

        .saveRow .primaryButton {
          width:
            100%;
        }

        .modalBackdrop {
          padding:
            12px;
        }

        .historyModal {
          padding:
            20px;
        }
      }

      @media (
        max-width:
          500px
      ) {
        .studioMain {
          width:
            92vw;
        }

        .stats {
          grid-template-columns:
            1fr;
        }
      }
    `}</style>
  );
}