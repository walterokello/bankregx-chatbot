// pages/api/ask.js

export const config = {
  runtime: "nodejs",
};

import OpenAI from "openai";
import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

function detectGuidanceCategories(userQuery) {
  const text = clean(userQuery).toLowerCase();

  const categories = new Set();

  /*
   * CONTROL DESIGN
   */

  if (
    text.includes("control") ||
    text.includes("control design") ||
    text.includes("design effectiveness") ||
    text.includes("preventive") ||
    text.includes("detective") ||
    text.includes("mitigating control")
  ) {
    categories.add("control_design");
  }

  /*
   * AUDIT JUDGEMENT
   */

  if (
    text.includes("audit") ||
    text.includes("auditor") ||
    text.includes("testing") ||
    text.includes("test the control") ||
    text.includes("evidence") ||
    text.includes("sample") ||
    text.includes("finding") ||
    text.includes("deficiency") ||
    text.includes("operating effectiveness") ||
    text.includes("issue")
  ) {
    categories.add("audit_judgement");
  }

  /*
   * REGULATORY IMPACT
   */

  if (
    text.includes("regulation") ||
    text.includes("regulatory") ||
    text.includes("rule") ||
    text.includes("fca") ||
    text.includes("pra") ||
    text.includes("ecb") ||
    text.includes("fed") ||
    text.includes("regulator") ||
    text.includes("enforcement") ||
    text.includes("consultation") ||
    text.includes("regulatory news") ||
    text.includes("regulatory impact")
  ) {
    categories.add("regulatory_impact");
  }

  return Array.from(categories);
}

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
    detectedCategories.includes(
      item.category
    )
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
        lowerQuery.includes(
          normalizedTag
        )
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

async function getRelevantExpertGuidance(
  userQuery,
  maxItems = 5
) {
  try {
    const snapshot = await adminDb
      .collection("expert_guidance")
      .where("status", "==", "approved")
      .limit(100)
      .get();

    const detectedCategories =
      detectGuidanceCategories(
        userQuery
      );

    const candidates =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    const guidance = candidates
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
      )
      .slice(0, maxItems);

    return {
      guidance,
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
        }`
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
 * INTERNET SEARCH
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
      Math.min(count, 10)
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
 * WEB PAGE BROWSING
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
        text.slice(0, 500),
      url: url.toString(),
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
        text.slice(0, 500),
      url: url.toString(),
    };
  }
}

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

  (browsedPages || []).forEach(
    (page, index) => {
      lines.push(
        `(WEB #${index + 1}) ${
          clean(page.title) ||
          "Untitled"
        }
Link: ${clean(page.url)}
Text: ${clean(page.text)}`
      );
    }
  );

  return lines.join("\n\n");
}

/*
 * =========================================================
 * OPENAI
 * =========================================================
 */

async function getChatGPTResponse(
  messages
) {
  const response =
    await openai.chat.completions.create(
      {
        model: "gpt-4o",

        messages,

        temperature: 0.1,

        max_tokens: 1400,
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
 * MAIN HANDLER
 * =========================================================
 */

export default async function handler(
  req,
  res
) {
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
      userId,
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

    if (!userId) {
      return res
        .status(400)
        .json({
          message:
            "userId is required",
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
        5
      );

    const expertGuidanceContext =
      buildExpertGuidanceContext(
        expertGuidance
      );

    /*
     * =====================================================
     * 2. DETERMINE WHETHER LIVE WEB RESEARCH IS REQUIRED
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
     * 3. BROWSE TOP SOURCES
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
Information required or relevant to the assessment but not supplied.

3. ASSUMPTIONS
Possible interpretations that might be reasonable but have not been established.

4. PROFESSIONAL JUDGEMENT
A conclusion drawn from the available facts, clearly distinguished from fact itself.

Never convert a plausible assumption into a known fact.

Never invent missing control attributes merely to complete an assessment.

If material information is missing, say so.

Examples:

If the user states:
"The Finance Manager reviews a monthly exception report"

KNOWN:
- the stated reviewer is the Finance Manager;
- there is an exception report;
- the stated frequency is monthly.

NOT KNOWN unless separately provided:
- the underlying risk;
- what transactions or activities are included;
- how exceptions are defined;
- where the control operates;
- whether the report is complete and accurate;
- whether the Finance Manager has sufficient competence or independence;
- the escalation process;
- evidence retained;
- the required response time.

Do not invent any of those attributes.

=========================================================
CONTROL DESIGN ASSESSMENT
=========================================================

When assessing control design, first identify the underlying risk that the control is intended to mitigate.

If the underlying risk has NOT been specified or reliably established:

- explicitly state that it is not known;
- do not select a likely risk and present it as fact;
- you may provide possible examples only if clearly labelled as hypothetical;
- do not reach a definitive design-effectiveness conclusion where understanding that risk is necessary.

Assess the control, where information is available, using:

WHO
Who performs, owns, reviews or approves the control?

WHAT
What activity is actually performed?

WHY
What underlying risk is the activity intended to mitigate?

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

=========================================================
FREQUENCY
=========================================================

Never say that a control frequency is appropriate merely because a frequency has been provided.

The adequacy of frequency depends on matters such as:

- nature of the underlying risk;
- risk velocity;
- transaction or event volume;
- potential impact;
- required response time;
- whether the control is preventive or detective.

For example:

"Monthly" is a known frequency if stated by the user.

Whether monthly is appropriate is a professional judgement that requires additional risk context.

=========================================================
CONTROL OWNERSHIP
=========================================================

Do not say a person or role is an "appropriate owner" simply because the role sounds plausible.

Consider whether sufficient information exists about:

- competence;
- authority;
- independence;
- segregation of duties;
- proximity to the activity being controlled.

If these are unknown, identify them as unknown.

=========================================================
DESIGN VS IMPLEMENTATION VS OPERATING EFFECTIVENESS
=========================================================

Always distinguish:

1. Design effectiveness
Would the control, if performed as designed, be capable of mitigating the identified risk?

2. Implementation
Has the designed control actually been put in place?

3. Operating effectiveness
Has the implemented control operated consistently and effectively over the relevant period?

Do not treat missing operating evidence as automatic evidence of poor control design.

=========================================================
CONCLUSION DISCIPLINE
=========================================================

Do not force a positive or negative conclusion.

Where material information required for the assessment is missing, use a conclusion such as:

"Insufficient information to conclude on design effectiveness."

Then explain exactly what additional information is required.

Do not use unsupported language such as:

- "the control has a solid foundation";
- "the control is generally appropriate";
- "the reviewer is appropriate";
- "the frequency is suitable";

unless the available information genuinely supports that conclusion.

=========================================================
RECOMMENDATION DISCIPLINE
=========================================================

Do not generate generic recommendations simply because they are common control practices.

Every recommendation should respond to:

- an identified design gap;
- an identified risk;
- missing information necessary to assess the control;
- or a clearly explained weakness.

For example, do not recommend adding a second reviewer merely because only one reviewer was mentioned.

First establish whether independence, segregation or review risk makes this necessary.

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

=========================================================
LIVE INTERNET MATERIAL
=========================================================

${webContext}

Search status:
${searchStatus}

Rules for external material:

- Prefer browsed source content over search snippets.
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

State whether there is:
- sufficient information to assess design;
- insufficient information to conclude;
- or a supported design conclusion.

### Known from the description

Only state facts actually supplied.

### Information not provided

Identify material unknowns.

### Control design assessment

Assess only attributes supported by the information available.

Use Who / What / Why / When / Where / How where useful.

Do not invent missing answers merely to complete the framework.

### Key design considerations

Explain genuine strengths, gaps or dependencies.

### Information required to conclude

List the additional information genuinely needed.

Do NOT use a "Recommendations" section unless there is sufficient evidence for a specific recommendation.

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

It is better to say "not known" than to fill a gap with a plausible assumption.

The objective is not merely to produce an answer.

The objective is to help a professional make a better and more defensible judgement.
`.trim(),
    };

    /*
     * =====================================================
     * 5. BUILD CLEAN ASSESSMENT PROMPT
     * =====================================================
     *
     * IMPORTANT:
     *
     * Previous AI responses are deliberately NOT inserted
     * here.
     *
     * This prevents incorrect conclusions from earlier
     * assessments becoming apparent "evidence" in later
     * assessments.
     *
     * We still save every response below for auditability.
     * Proper case/thread memory can be introduced later.
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

    /*
     * =====================================================
     * 7. SAVE RESPONSE AND INTELLIGENCE TRACE
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

            guidanceTitles:
              expertGuidance.map(
                (item) =>
                  item.title
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

            reasoningMode:
              "standalone_assessment",

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
     * 8. RECORD GUIDANCE USAGE
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

    return res
      .status(200)
      .json({
        answer:
          aiResponse,

        responseId,

        expertGuidance:
          expertGuidance.map(
            (item) => ({
              id:
                item.id,

              guidanceId:
                item.guidanceId,

              title:
                item.title,

              category:
                item.category,

              priority:
                item.priority,

              relevanceScore:
                item.relevanceScore,
            })
          ),

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

          historyIncluded:
            false,

          reasoningMode:
            "standalone_assessment",

          browseDebug,

          baseUrl:
            buildBaseUrlFromRequest(
              req
            ),
        },
      });
  } catch (error) {
    console.error(
      "/api/ask fatal error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Internal server error",

        error:
          error?.message ||
          "Unknown error",
      });
  }
}