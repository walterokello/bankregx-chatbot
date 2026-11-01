// pages/api/ask.js

export const config = {
  runtime: "nodejs",
};

import OpenAI from "openai";
import { adminDb, verifyMemberToken } from "../../lib/firebaseAdmin";
import { assessmentIdentity } from "../../lib/assessmentIdentity";
import { reserveAssessment, settleAssessment } from "../../lib/monthlyUsage";
import { FieldValue } from "firebase-admin/firestore";



/*
 * =========================================================
 * GENERAL HELPERS
 * =========================================================
 */

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildBaseUrlFromRequest(req) {
  const host = (
    req.headers["x-forwarded-host"] ||
    req.headers.host ||
    ""
  ).toString();

  let proto = (
    req.headers["x-forwarded-proto"] ||
    "https"
  ).toString();

  if (
    host.includes("localhost") ||
    host.includes("127.0.0.1")
  ) {
    proto = "http";
  }

  return `${proto}://${host}`;
}

/*
 * =========================================================
 * METHODOLOGY TRACE HELPERS
 * =========================================================
 */

function getGuidanceVersion(item) {
  const version = Number(
    item?.version
  );

  if (
    !Number.isFinite(version) ||
    version < 1
  ) {
    return 1;
  }

  return Math.trunc(version);
}

function buildMethodologyTrace(
  guidance
) {
  if (
    !Array.isArray(guidance) ||
    guidance.length === 0
  ) {
    return [];
  }

  return guidance.map(
    (item) => ({
      guidanceId:
        item.guidanceId ||
        item.id,

      documentId:
        item.id,

      version:
        getGuidanceVersion(
          item
        ),

      title:
        item.title ||
        null,

      category:
        item.category ||
        null,

      subcategory:
        item.subcategory ||
        null,

      priority:
        item.priority ||
        null,

      relevanceScore:
        Number.isFinite(
          Number(
            item.relevanceScore
          )
        )
          ? Number(
              item.relevanceScore
            )
          : null,
    })
  );
}

/*
 * =========================================================
 * EXPERT GUIDANCE
 * =========================================================
 */

function tokenize(text) {
  const stopWords = new Set([
    "the",
    "and",
    "that",
    "this",
    "with",
    "from",
    "into",
    "your",
    "their",
    "there",
    "what",
    "when",
    "where",
    "which",
    "would",
    "could",
    "should",
    "about",
    "have",
    "has",
    "does",
    "for",
    "are",
    "was",
    "were",
    "how",
    "why",
    "who",
    "can",
    "will",
    "may",
    "its",
    "our",
    "you",
    "use",
    "using",
    "being",
    "been",
  ]);

  return clean(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter((word) => !stopWords.has(word));
}

/*
 * =========================================================
 * INTENT / CATEGORY DETECTION
 * =========================================================
 */

function detectGuidanceCategories(userQuery) {
  const text = clean(userQuery).toLowerCase();

  const categories = new Set();

  /*
   * CONTROL DESIGN
   */

  const controlDesignIntent =
    text.includes("control") ||
    text.includes("control design") ||
    text.includes("well designed") ||
    text.includes("design effectiveness") ||
    text.includes("preventive") ||
    text.includes("detective") ||
    text.includes("mitigating control");

  if (controlDesignIntent) {
    categories.add("control_design");
  }

  /*
   * AUDIT JUDGEMENT
   *
   * Do not classify something as audit judgement merely
   * because words such as "evidence" appear in a control
   * description.
   *
   * Require clearer audit / testing / finding intent.
   */

  const auditIntent =
    text.includes("audit finding") ||
    text.includes("audit issue") ||
    text.includes("auditor") ||
    text.includes("audit conclusion") ||
    text.includes("test the control") ||
    text.includes("control testing") ||
    text.includes("sample size") ||
    text.includes("sampling") ||
    text.includes("operating effectiveness") ||
    text.includes("testing result") ||
    text.includes("deficiency") ||
    text.includes("finding severity") ||
    text.includes("issue rating");

  if (auditIntent) {
    categories.add("audit_judgement");
  }

  /*
   * REGULATORY IMPACT
   */

  const regulatoryIntent =
    text.includes("regulation") ||
    text.includes("regulatory") ||
    text.includes("regulator") ||
    text.includes("fca") ||
    text.includes("pra") ||
    text.includes("ecb") ||
    text.includes("federal reserve") ||
    text.includes("enforcement action") ||
    text.includes("consultation paper") ||
    text.includes("regulatory news") ||
    text.includes("regulatory impact");

  if (regulatoryIntent) {
    categories.add("regulatory_impact");
  }

  return Array.from(categories);
}

/*
 * =========================================================
 * EXPERT GUIDANCE SCORING
 * =========================================================
 */

function scoreGuidance(
  item,
  userQuery,
  detectedCategories
) {
  const queryTokens = tokenize(userQuery);

  const searchableText = [
    item.title,
    item.guidance,
    item.category,
    item.subcategory,
    ...(Array.isArray(item.tags)
      ? item.tags
      : []),
    ...(Array.isArray(item.appliesTo)
      ? item.appliesTo
      : []),
  ]
    .filter(Boolean)
    .join(" ");

  const guidanceTokens = new Set(
    tokenize(searchableText)
  );

  let score = 0;

  /*
   * KEYWORD MATCH
   */

  for (const token of queryTokens) {
    if (guidanceTokens.has(token)) {
      score += 2;
    }
  }

  /*
   * CATEGORY MATCH
   */

  if (
    item.category &&
    detectedCategories.includes(item.category)
  ) {
    score += 8;
  }

  /*
   * TAG MATCH
   */

  const lowerQuery = clean(
    userQuery
  ).toLowerCase();

  if (Array.isArray(item.tags)) {
    for (const tag of item.tags) {
      const normalizedTag = clean(
        tag
      ).toLowerCase();

      if (
        normalizedTag &&
        lowerQuery.includes(normalizedTag)
      ) {
        score += 4;
      }
    }
  }

  /*
   * PRIORITY
   */

  const priorityBonus = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0,
  };

  score +=
    priorityBonus[item.priority] || 0;

  return score;
}

/*
 * =========================================================
 * BALANCED EXPERT GUIDANCE RETRIEVAL
 * =========================================================
 */

async function getRelevantExpertGuidance(
  userQuery,
  maxItems = 8
) {
  try {
    const snapshot = await adminDb
      .collection("expert_guidance")
      .where("status", "==", "approved")
      .limit(100)
      .get();

    const detectedCategories =
      detectGuidanceCategories(userQuery);

    const candidates =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    /*
     * Score all relevant approved principles.
     */

    const scored = candidates
      .map((item) => ({
        ...item,

        relevanceScore:
          scoreGuidance(
            item,
            userQuery,
            detectedCategories
          ),
      }))
      .filter(
        (item) =>
          item.relevanceScore > 0
      )
      .sort(
        (a, b) =>
          b.relevanceScore -
          a.relevanceScore
      );

    /*
     * =====================================================
     * BALANCED METHODOLOGY SELECTION
     * =====================================================
     *
     * Do not simply retrieve the highest scoring rules.
     *
     * A professional control assessment may need several
     * complementary judgement dimensions:
     *
     * - risk identification;
     * - evidence / assumption discipline;
     * - risk-control alignment;
     * - frequency and timing;
     * - design vs implementation / operating effectiveness;
     * - conclusion discipline.
     *
     * First select the strongest principle from each
     * available subcategory.
     */

    const selected = [];
    const selectedIds = new Set();
    const coveredSubcategories = new Set();

    for (const item of scored) {
      const subcategory =
        clean(item.subcategory) ||
        "general";

      if (
        !coveredSubcategories.has(
          subcategory
        )
      ) {
        selected.push(item);

        selectedIds.add(
          item.id
        );

        coveredSubcategories.add(
          subcategory
        );
      }

      if (
        selected.length >=
        maxItems
      ) {
        break;
      }
    }

    /*
     * Fill remaining capacity with the strongest remaining
     * relevant principles.
     */

    if (
      selected.length <
      maxItems
    ) {
      for (const item of scored) {
        if (
          selectedIds.has(
            item.id
          )
        ) {
          continue;
        }

        selected.push(item);

        selectedIds.add(
          item.id
        );

        if (
          selected.length >=
          maxItems
        ) {
          break;
        }
      }
    }

    /*
     * Present final guidance in relevance order.
     */

    selected.sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    );

    return {
      guidance: selected,
      detectedCategories,
    };
  } catch (error) {
    console.error(
      "Expert guidance retrieval failed:",
      error
    );

    return {
      guidance: [],
      detectedCategories: [],
    };
  }
}

/*
 * =========================================================
 * BUILD EXPERT METHODOLOGY CONTEXT
 * =========================================================
 */

function buildExpertGuidanceContext(
  guidance
) {
  if (
    !Array.isArray(guidance) ||
    guidance.length === 0
  ) {
    return `
No specifically relevant approved BankRegX Expert Guidance was retrieved for this question.
`.trim();
  }

  const lines = [
    "APPROVED BANKREGX EXPERT GUIDANCE",
    "",
    "The following principles are approved BankRegX professional methodology.",
    "Apply each principle where relevant.",
    "These principles are not legislation or external evidence.",
    "",
  ];

  guidance.forEach(
    (item, index) => {
      lines.push(
        `${index + 1}. ${
          item.guidanceId ||
          item.id
        } · v${getGuidanceVersion(
          item
        )}`
      );

      lines.push(
        `Title: ${clean(
          item.title
        )}`
      );

      lines.push(
        `Category: ${clean(
          item.category
        )}${
          item.subcategory
            ? ` / ${clean(
                item.subcategory
              )}`
            : ""
        }`
      );

      lines.push(
        `Expert principle: ${clean(
          item.guidance
        )}`
      );

      if (item.rationale) {
        lines.push(
          `Rationale: ${clean(
            item.rationale
          )}`
        );
      }

      lines.push("");
    }
  );

  return lines.join("\n");
}

/*
 * =========================================================
 * RECORD GUIDANCE USAGE
 * =========================================================
 */

async function recordGuidanceUsage(
  guidance
) {
  if (
    !Array.isArray(guidance) ||
    guidance.length === 0
  ) {
    return;
  }

  try {
    const batch = adminDb.batch();

    guidance.forEach((item) => {
      const ref = adminDb
        .collection(
          "expert_guidance"
        )
        .doc(item.id);

      batch.update(ref, {
        usageCount:
          FieldValue.increment(1),

        lastUsedAt:
          FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error(
      "Expert guidance usage update failed:",
      error
    );
  }
}

/*
 * =========================================================
 * INTERNET SEARCH DECISION
 * =========================================================
 */

function shouldUseWebSearch(
  userQuery
) {
  const text = clean(
    userQuery
  ).toLowerCase();

  const indicators = [
    "latest",
    "current",
    "today",
    "recent",
    "news",
    "regulation",
    "regulatory",
    "rule",
    "rules",
    "law",
    "legislation",
    "consultation",
    "enforcement",
    "fca",
    "pra",
    "ecb",
    "fed",
    "sec",
    "finra",
    "basel",
  ];

  return indicators.some(
    (term) =>
      text.includes(term)
  );
}

/*
 * =========================================================
 * BRAVE SEARCH
 * =========================================================
 */

async function braveSearch(
  queryText,
  count = 5
) {
  if (
    !process.env
      .BRAVE_SEARCH_API_KEY
  ) {
    return {
      results: [],
      error:
        "Missing BRAVE_SEARCH_API_KEY",
    };
  }

  const url = new URL(
    "https://api.search.brave.com/res/v1/web/search"
  );

  url.searchParams.set(
    "q",
    queryText
  );

  url.searchParams.set(
    "count",
    String(
      Math.min(
        count,
        10
      )
    )
  );

  const response = await fetch(
    url.toString(),
    {
      headers: {
        Accept:
          "application/json",

        "X-Subscription-Token":
          process.env
            .BRAVE_SEARCH_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const text =
      await response
        .text()
        .catch(() => "");

    return {
      results: [],

      error: `Search failed: ${
        response.status
      } ${clean(text).slice(
        0,
        200
      )}`,
    };
  }

  const data =
    await response.json();

  const results = (
    data?.web?.results || []
  ).map((result) => ({
    title: result.title,
    url: result.url,
    description:
      result.description,
  }));

  return {
    results,
    error: null,
  };
}

/*
 * =========================================================
 * BROWSE WEB PAGE
 * =========================================================
 */

async function browseUrl(
  req,
  targetUrl
) {
  const base =
    buildBaseUrlFromRequest(req);

  const url = new URL(
    "/api/browse",
    base
  );

  url.searchParams.set(
    "url",
    targetUrl
  );

  url.searchParams.set(
    "maxChars",
    "12000"
  );

  const response = await fetch(
    url.toString(),
    {
      headers: {
        Accept:
          "application/json",
      },
    }
  );

  const text =
    await response
      .text()
      .catch(() => "");

  if (!response.ok) {
    return {
      ok: false,

      status:
        response.status,

      error: `browse failed (${response.status})`,

      bodyPreview:
        text.slice(
          0,
          500
        ),

      url:
        url.toString(),
    };
  }

  try {
    const data =
      JSON.parse(text);

    return {
      ok: true,
      data,
    };
  } catch (error) {
    return {
      ok: false,

      status: 500,

      error:
        "browse returned non-JSON",

      bodyPreview:
        text.slice(
          0,
          500
        ),

      url:
        url.toString(),
    };
  }
}

/*
 * =========================================================
 * BUILD EXTERNAL WEB CONTEXT
 * =========================================================
 */

function buildWebContext(
  searchResults,
  browsedPages
) {
  if (
    (!searchResults ||
      searchResults.length ===
        0) &&
    (!browsedPages ||
      browsedPages.length ===
        0)
  ) {
    return `
No live internet material was retrieved for this question.
`.trim();
  }

  const lines = [];

  lines.push(
    "SEARCH RESULTS:"
  );

  (searchResults || [])
    .slice(0, 5)
    .forEach(
      (result, index) => {
        lines.push(
          `(${index + 1}) ${clean(
            result.title
          )}
Snippet: ${clean(
            result.description
          )}
Link: ${clean(
            result.url
          )}`
        );
      }
    );

  lines.push(
    "\nBROWSED PAGES:"
  );

  (browsedPages || [])
    .forEach(
      (page, index) => {
        lines.push(
          `(WEB #${index + 1}) ${
            clean(
              page.title
            ) ||
            "Untitled"
          }
Link: ${clean(
            page.url
          )}
Text: ${clean(
            page.text
          )}`
        );
      }
    );

  return lines.join(
    "\n\n"
  );
}

/*
 * =========================================================
 * OPENAI RESPONSE
 * =========================================================
 */

async function getChatGPTResponse(
  messages
) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response =
    await openai.chat.completions.create(
      {
        model: "gpt-4o",

        messages,

        temperature: 0.1,

        max_tokens: 1600,
      }
    );

  return (
    response.choices?.[0]
      ?.message?.content?.trim() ||
    ""
  );
}

/*
 * =========================================================
 * MAIN API HANDLER
 * =========================================================
 */

export default async function handler(
  req,
  res
) {
  let reservation;
  res.setHeader("Cache-Control", "private, no-store");
  try {
    if (
      req.method !== "POST"
    ) {
      return res
        .status(405)
        .json({
          message:
            "Method Not Allowed",
        });
    }

    const {
      query: userQuery,
    } = req.body || {};

    if (
      !userQuery ||
      !String(
        userQuery
      ).trim()
    ) {
      return res
        .status(400)
        .json({
          message:
            "Query is required",
        });
    }

    // Never trust a browser-supplied userId to identify a member or set a limit.
    if (!req.headers["content-type"]?.startsWith("application/json")) {
      return res.status(415).json({ message: "Send assessments as application/json." });
    }
    const identity = await assessmentIdentity(req, res, verifyMemberToken);
    const userId = identity.userId;
    reservation = await reserveAssessment(adminDb, identity);
    if (!reservation.allowed) {
      return res.status(429).json({
        code: "MONTHLY_LIMIT_REACHED",
        message: identity.plan === "member"
          ? "You have used your five assessments this month. Your allowance resets on the first of next month (UTC)."
          : "You have used your free assessment this month. Join BankRegX for free to get five assessments per month.",
        usage: reservation.usage,
      });
    }

    const normalizedQuery =
      String(
        userQuery
      ).trim();

    /*
     * =====================================================
     * 1. RETRIEVE BANKREGX EXPERT INTELLIGENCE
     * =====================================================
     */

    const {
      guidance:
        expertGuidance,

      detectedCategories,
    } =
      await getRelevantExpertGuidance(
        normalizedQuery,
        8
      );

    const expertGuidanceContext =
      buildExpertGuidanceContext(
        expertGuidance
      );

    /*
     * =====================================================
     * 2. DETERMINE WHETHER LIVE WEB RESEARCH IS NEEDED
     * =====================================================
     */

    const useWebSearch =
      shouldUseWebSearch(
        normalizedQuery
      );

    let searchResults = [];

    let searchStatus =
      "Live web research was not required for this question.";

    if (useWebSearch) {
      const searchResult =
        await braveSearch(
          normalizedQuery,
          5
        );

      searchResults =
        searchResult.results;

      searchStatus =
        searchResult.error ||
        "Search succeeded.";
    }

    /*
     * =====================================================
     * 3. BROWSE TOP SEARCH RESULTS
     * =====================================================
     */

    const topUrls = (
      searchResults || []
    )
      .map(
        (result) =>
          result.url
      )
      .filter(Boolean)
      .slice(0, 2);

    const browsedPages = [];
    const browseDebug = [];

    for (
      const targetUrl of topUrls
    ) {
      const browseResult =
        await browseUrl(
          req,
          targetUrl
        );

      if (
        browseResult.ok
      ) {
        browsedPages.push(
          browseResult.data
        );
      } else {
        browseDebug.push(
          browseResult
        );
      }
    }

    const webContext =
      buildWebContext(
        searchResults,
        browsedPages
      );

    /*
     * =====================================================
     * 4. BANKREGX SYSTEM INSTRUCTIONS
     * =====================================================
     */

    const systemMessage = {
      role: "system",

      content: `
You are BankRegX, an AI Control Intelligence assistant for banking and financial services professionals.

Your primary users include:
- Internal Audit;
- first-line Controls;
- Compliance;
- Operational Risk;
- Regulatory Risk;
- Assurance and Testing teams.

Your role is to support disciplined professional judgement.

Accuracy, evidence discipline and intellectual honesty are more important than appearing decisive.

=========================================================
CORE EVIDENCE DISCIPLINE
=========================================================

Before reaching any professional conclusion, distinguish internally between:

1. KNOWN FACTS

Information explicitly provided by the user or reliably established from an authoritative source.

2. UNKNOWN / NOT PROVIDED

Information relevant to the assessment but not supplied.

3. ASSUMPTIONS

Possible interpretations that may be reasonable but have not been established.

4. PROFESSIONAL JUDGEMENT

A conclusion drawn from the available facts and clearly distinguished from fact itself.

Never convert a plausible assumption into a known fact.

Never invent missing control attributes merely to complete an assessment.

If material information is missing, say so.

However, do not confuse missing operating evidence with missing control-design information.

If an attribute is explicitly stated in the control description, treat it as part of the described design unless there is a specific reason to clarify it.

=========================================================
CONTROL DESIGN PURPOSE
=========================================================

A control-design assessment asks:

"If this control were implemented and operated as described, would it be capable of mitigating the identified risk to an acceptable degree?"

The purpose is NOT to prove that the control actually operated.

That is a separate implementation or operating-effectiveness question.

=========================================================
RISK FIRST
=========================================================

When assessing a control, first identify the underlying risk the control is intended to mitigate.

If the risk has not been provided or reliably established:

- explicitly state that the underlying risk is unknown;
- do not invent a likely risk and present it as fact;
- possible risks may only be presented as clearly labelled hypotheses;
- do not reach a definitive design conclusion if the risk is necessary to assess the control.

If the risk IS provided, use that stated risk as the basis of the assessment.

=========================================================
RISK-TO-CONTROL CAUSAL ASSESSMENT
=========================================================

Do not assess a control merely by checking whether descriptive elements exist.

Determine whether the control mechanism is actually capable of mitigating the stated risk.

Ask:

1. What event or failure creates the risk?
2. At what point could the harm occur?
3. Is the control preventive, detective, corrective or a combination?
4. Does the control operate before or after the harmful event?
5. If detective, is detection sufficiently timely to prevent, recover or limit the harm?
6. Does the control cover the relevant risk population?
7. Are thresholds appropriate to the risk?
8. Is the control sufficiently precise to identify the relevant failures or exceptions?
9. Does the control provide an effective response when a problem is identified?

A well-documented control may still be poorly designed if:

- it operates too late;
- it excludes a material part of the risk population;
- its threshold is unjustified;
- it lacks sufficient precision;
- or detecting the issue does not allow the harm to be prevented or reduced.

=========================================================
PREVENTIVE VS DETECTIVE CONTROLS
=========================================================

Explicitly consider whether a control is preventive or detective when relevant.

A preventive control acts before the risk event or harm occurs.

A detective control identifies an event or failure after it has occurred or begun to occur.

Do not automatically treat a detective control as ineffective.

Instead assess whether:

- detection occurs quickly enough;
- the event can still be stopped, recalled, corrected, recovered or remediated;
- loss or harm can be materially limited;
- escalation is timely enough to support that response.

For payment controls, if payments have already been processed before review occurs, recognise that the review is detective rather than preventive.

Then assess whether post-processing detection is sufficiently timely and effective against the stated risk.

=========================================================
CONTROL DESIGN ATTRIBUTES
=========================================================

Assess the control, where relevant, using:

WHO

Who performs, owns, reviews or approves the control?

WHAT

What activity is actually performed?

WHY

What underlying risk is the control intended to mitigate?

WHEN

What is the frequency or trigger?

WHERE

Where is the activity performed and where is evidence retained?

HOW

How is the activity performed, evidenced, challenged, investigated, escalated and documented?

Also consider where relevant:

- scope and population;
- precision;
- thresholds;
- completeness and accuracy of information used;
- segregation of duties;
- independence;
- exception management;
- escalation;
- evidence retained;
- system and data dependencies;
- preventive versus detective nature.

Do not invent missing answers merely to complete this framework.

=========================================================
STATED DESIGN ATTRIBUTES
=========================================================

Treat attributes explicitly stated in the control description as part of the proposed design.

For example, if the user says:

"The report reconciles the number and value of transactions to the source population"

then the design includes a stated completeness mechanism.

For a design assessment, assess whether that mechanism appears capable of addressing completeness risk.

Do NOT automatically say:

"Assurance is required that the report is complete and accurate"

as a reason to withhold a design conclusion.

Testing whether the reconciliation actually operated belongs to implementation or operating-effectiveness testing.

Similarly, if the design states:

"Unresolved exceptions are escalated to the Head of Payments by 2:00pm"

then the design contains an escalation route and deadline.

Whether that escalation actually occurred effectively during the period is an operating-effectiveness question.

=========================================================
DESIGN VS IMPLEMENTATION VS OPERATING EFFECTIVENESS
=========================================================

Always distinguish:

1. DESIGN EFFECTIVENESS

Would the described control, if implemented and operated as designed, be capable of mitigating the identified risk?

2. IMPLEMENTATION

Has the designed control actually been put in place?

3. OPERATING EFFECTIVENESS

Has the implemented control operated consistently and effectively during the relevant period?

Do not require operating-effectiveness evidence before reaching a design conclusion.

Examples of operating-effectiveness matters include:

- whether the reviewer actually performed the control consistently;
- whether escalation actually occurred;
- whether evidence was retained in practice;
- whether the system report was actually generated correctly throughout the period;
- whether exceptions were actually investigated adequately.

These may later need testing, but their absence from a design-assessment prompt does not automatically prevent a design conclusion when the intended design is clearly specified.

=========================================================
CONTROL FREQUENCY
=========================================================

Never say that a control frequency is appropriate merely because a frequency has been provided.

Assess frequency against:

- nature of the underlying risk;
- risk velocity;
- transaction or event volume;
- potential impact;
- time available to prevent or reduce harm;
- whether the control is preventive or detective.

For example:

"Daily" is a known frequency if stated by the user.

Whether daily is sufficiently timely depends on the nature of the risk and when harm occurs.

=========================================================
THRESHOLDS AND SCOPE
=========================================================

Do not assume a threshold is appropriate merely because it sounds consistent with the risk description.

For example:

A risk described as "high-value payment risk" does not automatically establish that Â£50,000 is the appropriate threshold.

Assess whether:

- the threshold has a risk-based rationale;
- material events could occur below the threshold;
- the control covers the relevant population;
- another control covers excluded transactions where necessary.

A threshold may represent a legitimate design choice, but its appropriateness should be supported by the risk.

=========================================================
CONTROL OWNERSHIP
=========================================================

Do not say a person or role is an "appropriate owner" merely because the role sounds plausible.

Where relevant, consider:

- competence;
- authority;
- segregation of duties;
- independence;
- proximity to the activity being controlled.

However, distinguish between:

DESIGN ATTRIBUTE:
The design specifies that the reviewer is independent.

OPERATING TEST:
Evidence demonstrating that the reviewer actually remained independent.

Do not demand operating evidence when only assessing design.

=========================================================
CONCLUSION DISCIPLINE
=========================================================

Do not automatically default to:

"Insufficient information to conclude."

A professional control-design assessment should reach a supported conclusion where the described design contains enough information to do so.

Possible conclusions include:

- Appears well designed based on the information provided.
- Broadly well designed, subject to specific design questions.
- Material design weakness identified.
- Insufficient information to conclude.

Use "insufficient information" only where the missing information is genuinely material to assessing the design.

Do not withhold a conclusion merely because operating-effectiveness evidence has not been supplied.

Where there is a significant unresolved design question, explain precisely what it is.

For example:

"The control is well structured as a detective control, but the adequacy of its timing and threshold relative to the stated risk should be established before concluding that it fully mitigates the risk."

=========================================================
RECOMMENDATION DISCIPLINE
=========================================================

Do not generate generic recommendations simply because they are common control practices.

Every recommendation should respond to:

- an identified design gap;
- an identified risk;
- a material uncertainty;
- or a clearly explained weakness.

Do not recommend:

- extra reviewers;
- segregation of duties;
- more evidence;
- more frequent reviews;
- additional escalation;

unless the risk and control assessment supports that recommendation.

=========================================================
REGULATORY IMPACT
=========================================================

Do not assume every regulatory publication, consultation, enforcement action or emerging issue requires a new control.

First determine:

1. What actually changed or occurred?
2. What regulatory obligation, expectation or risk is involved?
3. Which products, businesses, legal entities, activities or processes may be affected?
4. Which existing controls may already mitigate the risk?
5. Whether there is:
   - no material impact;
   - insufficient information;
   - a need for further assessment;
   - a potential enhancement;
   - or a genuine control gap.

Clearly distinguish:

REGULATORY FACT

What an authoritative source actually states.

BANKREGX JUDGEMENT

BankRegX's analysis of likely relevance or control implications.

RECOMMENDED ACTION

What should reasonably be considered next.

=========================================================
APPROVED BANKREGX EXPERT METHODOLOGY
=========================================================

${expertGuidanceContext}

Rules:

- Apply relevant approved Expert Guidance.
- Expert Guidance represents BankRegX professional methodology.
- It is not legislation or regulatory text.
- Do not invent BankRegX principles that were not supplied.
- If authoritative regulation conflicts with BankRegX methodology, the authoritative source takes precedence.
- Apply critical guidance especially carefully.
- Where multiple principles apply, reconcile them into one coherent professional judgement rather than treating them as isolated checklist items.

=========================================================
LIVE INTERNET MATERIAL
=========================================================

${webContext}

Search status:
${searchStatus}

Rules for external material:

- Prefer browsed source content over search-result snippets.
- Cite browsed sources as (WEB #N).
- Never fabricate a source.
- Never fabricate regulatory requirements, dates, enforcement outcomes or quotations.
- Search-result snippets may be incomplete.
- If evidence is insufficient to establish a regulatory fact, say so.
- Separate external facts from BankRegX professional judgement.

=========================================================
OUTPUT FOR CONTROL ASSESSMENTS
=========================================================

For a control-design question, where appropriate use:

### Preliminary conclusion

Give the clearest supported design judgement available.

Do not automatically default to insufficient information.

### Known from the description

Only state facts or design attributes actually supplied.

### Material information not provided

Include only missing information that genuinely affects the design assessment.

Do NOT populate this section with matters that are primarily operating-effectiveness testing requirements.

### Risk-to-control assessment

Explain whether the control mechanism is capable of mitigating the stated risk.

Where relevant address:

- preventive vs detective nature;
- timing;
- scope;
- threshold;
- precision;
- population;
- response and escalation;
- point at which harm occurs.

### Control design assessment

Use Who / What / Why / When / Where / How where useful.

Do not allow this framework to replace risk-based judgement.

### Key design strengths

Identify genuine strengths supported by the stated design.

### Key design questions or weaknesses

Identify genuine weaknesses, gaps or material uncertainties.

### Overall design conclusion

Provide a clear professional judgement and explain any qualification.

=========================================================
STYLE
=========================================================

Write for experienced banking, audit, controls, risk and compliance professionals.

Be:

- precise;
- sceptical;
- evidence-led;
- practical;
- concise;
- transparent about uncertainty.

Do not reward completeness over accuracy.

Do not simply fill a template.

The central question is:

"Is this control, as designed, actually capable of mitigating the stated risk?"

It is better to identify one material risk-control design problem than to produce ten generic observations.

The objective is not merely to produce an answer.

The objective is to help a professional make a better and more defensible judgement.
`.trim(),
    };

    /*
     * =====================================================
     * 5. BUILD CLEAN STANDALONE ASSESSMENT
     * =====================================================
     *
     * Previous AI responses are deliberately NOT included.
     *
     * This prevents prior incorrect AI conclusions from
     * contaminating subsequent assessments.
     *
     * Proper case-specific conversation memory can be
     * introduced later.
     * =====================================================
     */

    const messages = [
      systemMessage,

      {
        role: "user",
        content:
          normalizedQuery,
      },
    ];

    /*
     * =====================================================
     * 6. GENERATE BANKREGX RESPONSE
     * =====================================================
     */

    const aiResponse =
      await getChatGPTResponse(
        messages
      );

    if (!aiResponse) throw new Error("The assessment returned an empty response.");

    /*
     * Capture the exact methodology snapshot used for this
     * assessment before any usage counters or future edits
     * can change the underlying guidance records.
     */
    const methodologyTrace =
      buildMethodologyTrace(
        expertGuidance
      );

    /*
     * =====================================================
     * 7. SAVE RESPONSE + INTELLIGENCE TRACE
     * =====================================================
     */

    let responseId = null;

    try {
      const chatRef =
        await adminDb
          .collection(
            "chat_history"
          )
          .add({
            userId,

            userMessage:
              normalizedQuery,

            aiResponse,

            guidanceIds:
              expertGuidance.map(
                (item) =>
                  item.guidanceId ||
                  item.id
              ),

            guidanceDocumentIds:
              expertGuidance.map(
                (item) =>
                  item.id
              ),

            guidanceVersions:
              methodologyTrace.map(
                (item) =>
                  item.version
              ),

            methodologyTraceSchemaVersion:
              1,

            methodologyTrace,

            guidanceTitles:
              expertGuidance.map(
                (item) =>
                  item.title
              ),

            guidanceSubcategories:
              expertGuidance.map(
                (item) =>
                  item.subcategory ||
                  null
              ),

            guidanceScores:
              expertGuidance.map(
                (item) => ({
                  guidanceId:
                    item.guidanceId ||
                    item.id,

                  relevanceScore:
                    item.relevanceScore,
                })
              ),

            detectedCategories,

            browsedSources:
              browsedPages.map(
                (page) => ({
                  title:
                    page.title ||
                    null,

                  url:
                    page.url ||
                    null,
                })
              ),

            usedWebSearch:
              useWebSearch,

            expertGuidanceCount:
              expertGuidance.length,

            reasoningMode:
              "standalone_assessment",

            retrievalMode:
              "balanced_methodology",

            historyIncluded:
              false,

            timestamp:
              new Date().toISOString(),

            createdAt:
              FieldValue.serverTimestamp(),
          });

      responseId =
        chatRef.id;
    } catch (error) {
      console.error(
        "Failed saving chat history:",
        error
      );
    }

    /*
     * =====================================================
     * 8. RECORD EXPERT GUIDANCE USAGE
     * =====================================================
     */

    await recordGuidanceUsage(
      expertGuidance
    );

    /*
     * =====================================================
     * 9. RETURN RESULT
     * =====================================================
     */

    await settleAssessment(adminDb, reservation, true);
    return res
      .status(200)
      .json({
        usage: reservation.usage,
        answer:
          aiResponse,

        responseId,

        expertGuidance:
          expertGuidance.map(
            (item) => ({
              id:
                item.id,

              documentId:
                item.id,

              guidanceId:
                item.guidanceId,

              version:
                getGuidanceVersion(
                  item
                ),

              title:
                item.title,

              category:
                item.category,

              subcategory:
                item.subcategory,

              priority:
                item.priority,

              relevanceScore:
                item.relevanceScore,
            })
          ),

        methodologyTraceSchemaVersion:
          1,

        methodologyTrace,

        detectedCategories,

        browsedPages:
          browsedPages.map(
            (page) => ({
              url:
                page.url,

              title:
                page.title,
            })
          ),

        debug: {
          webSearchUsed:
            useWebSearch,

          expertGuidanceCount:
            expertGuidance.length,

          methodologyTraceCaptured:
            true,

          historyIncluded:
            false,

          reasoningMode:
            "standalone_assessment",

          retrievalMode:
            "balanced_methodology",

          browseDebug,

          baseUrl:
            buildBaseUrlFromRequest(
              req
            ),
        },
      });
  } catch (error) {
    try { await settleAssessment(adminDb, reservation, false); }
    catch (refundError) { console.error("Unable to refund assessment allowance:", refundError.message); }
    console.error(
      "/api/ask fatal error:",
      error
    );

    return res
      .status(error.status || 503)
      .json({
        message: error.status ? error.message : "Unable to complete the assessment. Please try again later.",
      });
  }
}
