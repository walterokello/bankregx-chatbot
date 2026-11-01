import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; BankRegX/1.0; +https://www.bankregx.com)",
    Accept:
      "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
  },
});

const FEEDS = [
  {
    name: "Federal Reserve",
    key: "federal_reserve",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
  },
  {
    name: "FCA",
    key: "fca",
    url: "https://www.fca.org.uk/news/rss.xml",
  },
  {
    name: "ECB",
    key: "ecb",
    url: "https://www.ecb.europa.eu/rss/press.html",
  },
];

const FEED_SCAN_LIMIT = 15;
const ENRICH_CANDIDATE_LIMIT = 9;
const RETURN_ITEMS_PER_FEED = 5;
const MIN_RELEVANCE_SCORE = 6;

const FALLBACK_MIN_RELEVANCE_SCORE = -10;
const FALLBACK_ITEMS_PER_EMPTY_FEED = 1;
const FALLBACK_ENRICHMENT_SLOTS = 2;

const ARTICLE_TIMEOUT_MS = 7000;
const MIN_USEFUL_SUMMARY_LENGTH = 90;
const MAX_SUMMARY_LENGTH = 900;
const TARGET_PAGE_SUMMARY_LENGTH = 650;

const BOILERPLATE_PHRASES = [
  "accept the use of cookies",
  "cookie preference",
  "privacy statement",
  "skip to navigation",
  "skip to content",
  "skip to footer",
  "subscribe to",
  "follow us",
  "copyright",
  "all rights reserved",
  "javascript is disabled",
  "enable javascript",
  "please enable javascript",
  "access the information through the links provided below",
  "secure .gov websites use https",
  "you've safely connected to the .gov website",
  "you’ve safely connected to the .gov website",
  "share sensitive information only on official, secure websites",
  "an official website of the united states government",
  "here's how you know",
  "here’s how you know",
  "media contacts",
  "for media inquiries",
  "last update",
];

const GENERIC_REGULATOR_PHRASES = [
  "the european central bank is",
  "the european central bank (ecb) is",
  "the ecb is the central bank",
  "central bank for the euro",
  "central bank of the european union",
  "our main task is to maintain price stability",
  "we work to keep prices stable",
  "maintain price stability in the euro area",
  "official website of the european central bank",
  "the european central bank manages the euro",
  "the federal reserve, the central bank of the united states",
  "provides the nation with a safe, flexible, and stable monetary and financial system",
  "board of governors of the federal reserve system",
  "review of monetary policy strategy, tools, and communications",
];

const SUBSTANTIVE_ACTION_PHRASES = [
  "issued",
  "issues",
  "announced",
  "announces",
  "requested comment",
  "requests comment",
  "seeking comment",
  "seek comment",
  "proposed guidance",
  "proposed rule",
  "final rule",
  "interim final rule",
  "guidance",
  "supervisory",
  "regulatory agencies",
  "federal bank regulatory agencies",
  "federal reserve board",
  "effective immediately",
  "federal register",
  "enforcement action",
  "banking organizations",
  "financial institutions",
  "banks and credit unions",
];

const RELEVANCE_RULES = [
  [
    "Enforcement / remediation",
    16,
    [
      "enforcement action",
      "enforcement actions",
      "consent order",
      "cease and desist",
      "penalty",
      "penalties",
      "sanction",
      "sanctions",
      "remediation",
      "misconduct",
      "regulatory breach",
      "regulatory violation",
    ],
  ],

  [
    "Rulemaking / formal requirements",
    14,
    [
      "final rule",
      "proposed rule",
      "interim final rule",
      "rulemaking",
      "regulatory requirement",
      "regulatory requirements",
      "regulatory framework",
      "technical standard",
      "technical standards",
      "implementing standard",
      "implementing standards",
      "delegated regulation",
      "supervisory statement",
    ],
  ],

  [
    "Consultation / proposed change",
    12,
    [
      "consultation",
      "consultation paper",
      "call for input",
      "discussion paper",
      "seeking comment",
      "seek comment",
      "request for comment",
      "requests comment",
      "proposed guidance",
      "draft guidance",
    ],
  ],

  [
    "Supervision / examination",
    13,
    [
      "supervisory",
      "supervision",
      "examination cycle",
      "exam cycle",
      "supervisory review",
      "supervisory expectations",
      "supervisory priorities",
      "supervisory approach",
      "supervisory letter",
      "dear ceo letter",
      "portfolio letter",
      "regulatory burden",
      "eligibility threshold",
      "stress test",
      "stress testing",
    ],
  ],

  [
    "Operational resilience",
    12,
    [
      "operational resilience",
      "operational risk",
      "business continuity",
      "cybersecurity",
      "cyber security",
      "ict risk",
      "technology risk",
      "incident reporting",
      "outsourcing",
      "third-party risk",
      "third party risk",
      "third-party relationship",
      "third party relationship",
      "critical third party",
      "critical third-party",
      "core service provider",
    ],
  ],

  [
    "Financial crime",
    12,
    [
      "financial crime",
      "money laundering",
      "anti-money laundering",
      "terrorist financing",
      "sanctions compliance",
      "fraud prevention",
      "market abuse",
      "suspicious activity",
    ],
  ],

  [
    "Consumer protection",
    10,
    [
      "consumer duty",
      "consumer protection",
      "customer outcomes",
      "vulnerable customers",
      "fair treatment",
      "complaints",
      "redress",
      "financial promotion",
      "financial promotions",
    ],
  ],

  [
    "Governance / accountability",
    10,
    [
      "governance",
      "accountability",
      "board oversight",
      "senior management",
      "senior managers",
      "risk management",
      "internal controls",
      "control framework",
      "controls framework",
      "compliance framework",
    ],
  ],

  [
    "Prudential / capital / liquidity",
    11,
    [
      "capital requirement",
      "capital requirements",
      "capital buffer",
      "liquidity requirement",
      "liquidity requirements",
      "prudential",
      "basel",
      "leverage ratio",
      "resolution planning",
      "recovery planning",
      "resolution plan",
      "capital adequacy",
    ],
  ],

  [
    "Reporting / disclosure",
    9,
    [
      "regulatory reporting",
      "reporting requirement",
      "reporting requirements",
      "disclosure requirement",
      "disclosure requirements",
      "data submission",
      "data quality",
      "regulatory return",
      "regulatory returns",
    ],
  ],

  [
    "Payments / market infrastructure",
    9,
    [
      "payment services",
      "payment system",
      "payment systems",
      "instant payments",
      "financial market infrastructure",
      "clearing",
      "settlement",
      "custody",
    ],
  ],

  [
    "Markets / conduct",
    9,
    [
      "market conduct",
      "market integrity",
      "market abuse",
      "trading controls",
      "best execution",
      "transaction reporting",
      "benchmarks",
      "securities markets",
    ],
  ],

  [
    "Authorisation / permissions",
    9,
    [
      "authorisation",
      "authorization",
      "licensing",
      "registration requirements",
      "approval requirement",
      "permissions",
    ],
  ],
];

/*
 * These are the only signals allowed to rescue
 * a macro / monetary-policy publication.
 *
 * Deliberately excludes ambiguous phrases such
 * as "policy statement".
 */
const STRONG_REGULATORY_SIGNALS = [
  "enforcement action",
  "consent order",
  "cease and desist",
  "proposed rule",
  "final rule",
  "interim final rule",
  "proposed guidance",
  "draft guidance",
  "supervisory statement",
  "supervisory expectations",
  "supervisory priorities",
  "supervisory review",
  "supervisory approach",
  "supervisory letter",
  "consultation paper",
  "consultation",
  "request for comment",
  "seeking comment",
  "regulatory requirement",
  "regulatory requirements",
  "prudential",
  "capital requirement",
  "capital requirements",
  "liquidity requirement",
  "liquidity requirements",
  "operational resilience",
  "third-party risk",
  "third party risk",
  "anti-money laundering",
  "money laundering",
  "financial crime",
  "sanctions compliance",
  "consumer duty",
  "regulatory reporting",
  "examination cycle",
  "exam cycle",
  "stress testing",
  "stress test",
];

const LOW_VALUE_RULES = [
  [
    "General speech / remarks",
    -8,
    [
      "speech by",
      "remarks by",
      "keynote",
      "lecture",
      "opening remarks",
      "closing remarks",
      "welcome remarks",
      "fireside chat",
      "interview with",
    ],
  ],

  [
    "Ceremonial / general event",
    -10,
    [
      "anniversary",
      "commemorating",
      "commemoration",
      "award ceremony",
      "opening ceremony",
      "welcome address",
      "seen from normandy",
    ],
  ],
];

const HARD_EXCLUSION_RULES = [
  [
    "General monetary policy",
    [
      "monetary policy statement",
      "monetary policy decisions",
      "monetary policy decision",
      "monetary policy meeting",
      "monetary policy outlook",
      "interest rate decision",
      "interest rate decisions",
      "key interest rates",
      "deposit facility rate",
      "main refinancing operations",
      "marginal lending facility",
    ],
  ],

  [
    "General macroeconomic outlook",
    [
      "economic outlook",
      "outlook for the euro area economy",
      "macroeconomic outlook",
      "inflation outlook",
      "growth outlook",
      "economic projections",
      "staff projections",
      "macroeconomic projections",
      "inflation projections",
      "growth projections",
    ],
  ],
];

/*
 * Controlled fallback signals.
 *
 * These are used only where a regulator would
 * otherwise return zero developments.
 */
const FALLBACK_BANKING_SIGNALS = [
  "bank",
  "banks",
  "banking",
  "banking sector",
  "banking union",
  "credit institution",
  "credit institutions",
  "financial institution",
  "financial institutions",
  "financial stability",
  "financial markets",
  "risk management",
  "risk framework",
  "capital",
  "liquidity",
  "resilience",
  "supervision",
  "supervisory",
  "payments",
  "payment system",
  "digital euro",
  "governance",
  "controls",
  "compliance",
];

const CEREMONIAL_PHRASES = [
  "anniversary",
  "commemorating",
  "commemoration",
  "award ceremony",
  "opening ceremony",
  "welcome address",
  "seen from normandy",
];

function cleanWhitespace(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value) {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "-",
    mdash: "-",
    lsquo: "'",
    rsquo: "'",
    ldquo: '"',
    rdquo: '"',
    hellip: "...",
  };

  return String(value || "").replace(
    /&(#x?[0-9a-f]+|[a-z]+);/gi,
    (match, entity) => {
      const key =
        String(entity).toLowerCase();

      if (key.startsWith("#x")) {
        const code =
          Number.parseInt(
            key.slice(2),
            16
          );

        if (
          Number.isFinite(code)
        ) {
          try {
            return String.fromCodePoint(
              code
            );
          } catch {
            return match;
          }
        }
      }

      if (key.startsWith("#")) {
        const code =
          Number.parseInt(
            key.slice(1),
            10
          );

        if (
          Number.isFinite(code)
        ) {
          try {
            return String.fromCodePoint(
              code
            );
          } catch {
            return match;
          }
        }
      }

      return named[key] ?? match;
    }
  );
}

function stripHtml(value) {
  return cleanWhitespace(
    decodeHtmlEntities(
      String(value || "")
        .replace(
          /<script\b[^>]*>[\s\S]*?<\/script>/gi,
          " "
        )
        .replace(
          /<style\b[^>]*>[\s\S]*?<\/style>/gi,
          " "
        )
        .replace(
          /<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,
          " "
        )
        .replace(
          /<svg\b[^>]*>[\s\S]*?<\/svg>/gi,
          " "
        )
        .replace(
          /<!--[\s\S]*?-->/g,
          " "
        )
        .replace(
          /<br\s*\/?\s*>/gi,
          " "
        )
        .replace(
          /<\/p>/gi,
          " "
        )
        .replace(
          /<[^>]+>/g,
          " "
        )
    )
  );
}

const containsAny = (
  text,
  phrases
) =>
  phrases.some(
    (phrase) =>
      text.includes(
        phrase
      )
  );

function isLikelyNavigationOrContact(
  value
) {
  const text =
    cleanWhitespace(
      value
    ).toLowerCase();

  if (!text) {
    return true;
  }

  const labels = [
    "press releases",
    "speeches & testimony",
    "monetary policy",
    "supervision & regulation",
    "financial stability",
    "payment systems",
    "economic research",
    "data",
    "consumers & communities",
    "about the fed",
    "news & events",
  ];

  return (
    labels.includes(text) ||
    text.includes(
      "@federalreserve.gov"
    ) ||
    text.startsWith(
      "for media inquiries"
    ) ||
    text.startsWith(
      "for release at "
    ) ||
    /^\(?\d{3}\)?[\s-]\d{3}-\d{4}$/.test(
      text
    ) ||
    [
      "frb",
      "fdic",
      "occ",
      "ncua",
    ].includes(text)
  );
}

function isUsefulSummary(
  value,
  title = ""
) {
  const text =
    cleanWhitespace(
      value
    );

  if (
    !text ||
    text.length <
      MIN_USEFUL_SUMMARY_LENGTH
  ) {
    return false;
  }

  const lower =
    text.toLowerCase();

  if (
    containsAny(
      lower,
      BOILERPLATE_PHRASES
    ) ||
    containsAny(
      lower,
      GENERIC_REGULATOR_PHRASES
    ) ||
    isLikelyNavigationOrContact(
      text
    )
  ) {
    return false;
  }

  const normalizedTitle =
    cleanWhitespace(
      title
    ).toLowerCase();

  return (
    !normalizedTitle ||
    lower !==
      normalizedTitle
  );
}

function truncateSummary(
  value,
  maxLength =
    MAX_SUMMARY_LENGTH
) {
  const text =
    cleanWhitespace(
      value
    );

  if (
    text.length <=
    maxLength
  ) {
    return text;
  }

  const shortened =
    text.slice(
      0,
      maxLength
    );

  const sentenceEnd =
    Math.max(
      shortened.lastIndexOf(
        ". "
      ),
      shortened.lastIndexOf(
        "! "
      ),
      shortened.lastIndexOf(
        "? "
      )
    );

  if (
    sentenceEnd >
    maxLength * 0.55
  ) {
    return shortened
      .slice(
        0,
        sentenceEnd + 1
      )
      .trim();
  }

  const lastSpace =
    shortened.lastIndexOf(
      " "
    );

  return `${shortened
    .slice(
      0,
      lastSpace > 0
        ? lastSpace
        : maxLength
    )
    .trim()}...`;
}

function getAttribute(
  tag,
  name
) {
  const quoted =
    tag.match(
      new RegExp(
        `${name}\\s*=\\s*["']([^"']*)["']`,
        "i"
      )
    );

  if (
    quoted?.[1]
  ) {
    return decodeHtmlEntities(
      quoted[1]
    );
  }

  const unquoted =
    tag.match(
      new RegExp(
        `${name}\\s*=\\s*([^\\s>]+)`,
        "i"
      )
    );

  return unquoted?.[1]
    ? decodeHtmlEntities(
        unquoted[1]
      )
    : "";
}

function extractMetaDescription(
  html
) {
  const tags =
    String(
      html || ""
    ).match(
      /<meta\b[^>]*>/gi
    ) || [];

  for (
    const wanted of [
      "description",
      "og:description",
      "twitter:description",
    ]
  ) {
    for (
      const tag of tags
    ) {
      const key =
        cleanWhitespace(
          getAttribute(
            tag,
            "name"
          ) ||
          getAttribute(
            tag,
            "property"
          )
        ).toLowerCase();

      if (
        key !== wanted
      ) {
        continue;
      }

      const content =
        stripHtml(
          getAttribute(
            tag,
            "content"
          )
        );

      if (
        content
      ) {
        return content;
      }
    }
  }

  return "";
}

function findJsonLdDescription(
  value
) {
  if (!value) {
    return "";
  }

  if (
    Array.isArray(
      value
    )
  ) {
    for (
      const item of value
    ) {
      const found =
        findJsonLdDescription(
          item
        );

      if (
        found
      ) {
        return found;
      }
    }

    return "";
  }

  if (
    typeof value !==
    "object"
  ) {
    return "";
  }

  for (
    const candidate of [
      value.articleBody,
      value.abstract,
      value.description,
    ]
  ) {
    const text =
      stripHtml(
        candidate
      );

    if (
      text
    ) {
      return text;
    }
  }

  return value["@graph"]
    ? findJsonLdDescription(
        value["@graph"]
      )
    : "";
}

function extractJsonLdDescription(
  html
) {
  const scripts = [
    ...String(
      html || ""
    ).matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  for (
    const match of scripts
  ) {
    const raw =
      match?.[1]?.trim();

    if (
      !raw
    ) {
      continue;
    }

    try {
      const found =
        findJsonLdDescription(
          JSON.parse(
            raw
          )
        );

      if (
        found
      ) {
        return found;
      }
    } catch {
      // Ignore malformed JSON-LD.
    }
  }

  return "";
}

function extractParagraphs(
  html
) {
  return [
    ...String(
      html || ""
    ).matchAll(
      /<p\b[^>]*>([\s\S]*?)<\/p>/gi
    ),
  ]
    .map(
      (match) =>
        stripHtml(
          match[1]
        )
    )
    .map(
      cleanWhitespace
    )
    .filter(
      Boolean
    );
}

function titleKeywords(
  title
) {
  const stop =
    new Set([
      "about",
      "after",
      "again",
      "against",
      "and",
      "announces",
      "board",
      "federal",
      "from",
      "into",
      "more",
      "over",
      "press",
      "release",
      "reserve",
      "that",
      "the",
      "their",
      "this",
      "with",
    ]);

  return cleanWhitespace(
    title
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9\s-]/g,
      " "
    )
    .split(
      /\s+/
    )
    .filter(
      (word) =>
        word.length >= 5 &&
        !stop.has(
          word
        )
    );
}

function paragraphScore(
  paragraph,
  title = "",
  feedKey = ""
) {
  const text =
    cleanWhitespace(
      paragraph
    );

  const lower =
    text.toLowerCase();

  if (
    !text ||
    text.length < 55 ||
    containsAny(
      lower,
      BOILERPLATE_PHRASES
    ) ||
    containsAny(
      lower,
      GENERIC_REGULATOR_PHRASES
    ) ||
    isLikelyNavigationOrContact(
      text
    )
  ) {
    return -100;
  }

  let score =
    (
      text.length >= 100
        ? 2
        : 0
    ) +
    (
      text.length >= 180
        ? 2
        : 0
    );

  for (
    const phrase of
      SUBSTANTIVE_ACTION_PHRASES
  ) {
    if (
      lower.includes(
        phrase
      )
    ) {
      score += 4;
    }
  }

  score +=
    Math.min(
      titleKeywords(
        title
      ).filter(
        (keyword) =>
          lower.includes(
            keyword
          )
      ).length * 2,
      10
    );

  if (
    feedKey ===
    "federal_reserve"
  ) {
    if (
      [
        "the federal bank regulatory agencies",
        "the federal banking agencies",
        "today the federal deposit insurance corporation",
        "the federal reserve board",
        "the board",
      ].some(
        (phrase) =>
          lower.startsWith(
            phrase
          )
      )
    ) {
      score += 12;
    }

    if (
      lower.includes(
        "central bank of the united states"
      ) ||
      lower.includes(
        "safe, flexible, and stable monetary and financial system"
      )
    ) {
      score -= 30;
    }
  }

  return score;
}

function chooseParagraphSummary(
  html,
  title = "",
  feedKey = ""
) {
  const source =
    String(
      html || ""
    );

  const article =
    source.match(
      /<article\b[^>]*>([\s\S]*?)<\/article>/i
    )?.[1];

  const main =
    source.match(
      /<main\b[^>]*>([\s\S]*?)<\/main>/i
    )?.[1];

  const areas = [
    article,
    main,
    source,
  ].filter(
    Boolean
  );

  let bestParagraphs = [];
  let bestAnchor = -1;
  let bestScore =
    -Infinity;

  for (
    const area of areas
  ) {
    const titleText =
      cleanWhitespace(
        title
      ).toLowerCase();

    const paragraphs =
      extractParagraphs(
        area
      ).filter(
        (text) =>
          !titleText ||
          text.toLowerCase() !==
            titleText
      );

    paragraphs.forEach(
      (
        paragraph,
        index
      ) => {
        const adjusted =
          paragraphScore(
            paragraph,
            title,
            feedKey
          ) +
          Math.max(
            0,
            4 -
              index *
                0.15
          );

        if (
          adjusted >
          bestScore
        ) {
          bestScore =
            adjusted;

          bestParagraphs =
            paragraphs;

          bestAnchor =
            index;
        }
      }
    );

    if (
      bestScore >= 12 &&
      area !== source
    ) {
      break;
    }
  }

  if (
    !bestParagraphs.length ||
    bestAnchor < 0 ||
    bestScore < 4
  ) {
    return "";
  }

  const selected = [];
  let length = 0;

  for (
    let index =
      bestAnchor;
    index <
    bestParagraphs.length;
    index += 1
  ) {
    const paragraph =
      bestParagraphs[
        index
      ];

    if (
      isLikelyNavigationOrContact(
        paragraph
      ) ||
      containsAny(
        paragraph.toLowerCase(),
        BOILERPLATE_PHRASES
      )
    ) {
      break;
    }

    if (
      paragraphScore(
        paragraph,
        title,
        feedKey
      ) <= -50
    ) {
      break;
    }

    if (
      index >
        bestAnchor &&
      paragraph.length <
        70
    ) {
      continue;
    }

    selected.push(
      paragraph
    );

    length +=
      paragraph.length +
      1;

    if (
      length >=
      TARGET_PAGE_SUMMARY_LENGTH
    ) {
      break;
    }
  }

  const combined =
    cleanWhitespace(
      selected.join(
        " "
      )
    );

  return isUsefulSummary(
    combined,
    title
  )
    ? truncateSummary(
        combined
      )
    : "";
}

function extractBestPageSummary(
  html,
  title,
  feedKey = ""
) {
  for (
    const candidate of [
      chooseParagraphSummary(
        html,
        title,
        feedKey
      ),
      extractJsonLdDescription(
        html
      ),
      extractMetaDescription(
        html
      ),
    ]
  ) {
    if (
      isUsefulSummary(
        candidate,
        title
      )
    ) {
      return truncateSummary(
        candidate
      );
    }
  }

  return "";
}

function getRssSummary(
  item,
  title = ""
) {
  for (
    const candidate of [
      item?.contentSnippet,
      item?.summary,
      item?.description,
      item?.content,
      item?.[
        "content:encoded"
      ],
    ]
  ) {
    const text =
      stripHtml(
        candidate
      );

    if (
      isUsefulSummary(
        text,
        title
      )
    ) {
      return truncateSummary(
        text
      );
    }
  }

  return "";
}

function countMatches(
  text,
  phrases
) {
  return phrases.reduce(
    (
      count,
      phrase
    ) =>
      count +
      (
        text.includes(
          phrase
        )
          ? 1
          : 0
      ),
    0
  );
}

function hasStrongRegulatorySignal(
  text
) {
  return containsAny(
    text,
    STRONG_REGULATORY_SIGNALS
  );
}

function getHardExclusion(
  text
) {
  for (
    const [
      label,
      phrases,
    ] of
      HARD_EXCLUSION_RULES
  ) {
    if (
      containsAny(
        text,
        phrases
      )
    ) {
      return label;
    }
  }

  return null;
}

function hasFallbackBankingSignal(
  value
) {
  const text =
    cleanWhitespace(
      value
    ).toLowerCase();

  return (
    Boolean(text) &&
    containsAny(
      text,
      FALLBACK_BANKING_SIGNALS
    )
  );
}

function isCeremonial(
  value
) {
  const text =
    cleanWhitespace(
      value
    ).toLowerCase();

  return (
    Boolean(text) &&
    containsAny(
      text,
      CEREMONIAL_PHRASES
    )
  );
}

function scoreRegulatoryRelevance({
  title,
  summary,
  source,
}) {
  const titleText =
    cleanWhitespace(
      title
    ).toLowerCase();

  const summaryText =
    cleanWhitespace(
      summary
    ).toLowerCase();

  const combined =
    `${titleText} ${summaryText}`
      .trim();

  const hardExclusionReason =
    getHardExclusion(
      combined
    );

  const strongSignal =
    hasStrongRegulatorySignal(
      combined
    );

  /*
   * Macro / monetary publications
   * cannot rescue themselves merely
   * through general banking language.
   */
  if (
    hardExclusionReason &&
    !strongSignal
  ) {
    return {
      relevanceScore:
        -30,

      relevanceLevel:
        "low",

      relevanceReasons:
        [],

      relevancePenalties:
        [
          hardExclusionReason,
        ],

      hardExcluded:
        true,

      hardExclusionReason,
    };
  }

  let score = 0;

  const reasons = [];
  const penalties = [];

  for (
    const [
      label,
      weight,
      phrases,
    ] of
      RELEVANCE_RULES
  ) {
    const titleMatches =
      countMatches(
        titleText,
        phrases
      );

    const matches =
      countMatches(
        combined,
        phrases
      );

    if (
      !matches
    ) {
      continue;
    }

    score +=
      weight +
      (
        titleMatches
          ? 3
          : 0
      ) +
      (
        matches > 1
          ? Math.min(
              matches -
                1,
              2
            )
          : 0
      );

    reasons.push(
      label
    );
  }

  for (
    const [
      label,
      weight,
      phrases,
    ] of
      LOW_VALUE_RULES
  ) {
    if (
      containsAny(
        combined,
        phrases
      )
    ) {
      score +=
        strongSignal
          ? Math.ceil(
              weight /
                2
            )
          : weight;

      penalties.push(
        label
      );
    }
  }

  if (
    /^[A-Z][^:]{2,70}:\s+/.test(
      cleanWhitespace(
        title
      )
    ) &&
    !strongSignal
  ) {
    score -= 7;

    penalties.push(
      "Speaker / speech format"
    );
  }

  const changeSignals = [
    "new requirement",
    "new requirements",
    "increase",
    "increases",
    "reduce",
    "reduces",
    "revised",
    "revises",
    "updated",
    "updates",
    "effective",
    "implementation",
    "deadline",
    "threshold",
    "eligibility",
  ];

  const changeMatches =
    countMatches(
      combined,
      changeSignals
    );

  if (
    changeMatches
  ) {
    score +=
      Math.min(
        2 +
          changeMatches,
        5
      );

    reasons.push(
      "Regulatory change signal"
    );
  }

  if (
    source ===
      "FCA" &&
    (
      combined.includes(
        "fca"
      ) ||
      combined.includes(
        "firms"
      )
    )
  ) {
    score += 1;
  }

  score =
    Math.max(
      -30,
      Math.min(
        score,
        100
      )
    );

  return {
    relevanceScore:
      score,

    relevanceLevel:
      score >= 20
        ? "high"
        : score >=
            MIN_RELEVANCE_SCORE
          ? "medium"
          : "low",

    relevanceReasons:
      [
        ...new Set(
          reasons
        ),
      ],

    relevancePenalties:
      [
        ...new Set(
          penalties
        ),
      ],

    hardExcluded:
      false,

    hardExclusionReason:
      null,
  };
}

function isClearlyLowValueTitle(
  title
) {
  const text =
    cleanWhitespace(
      title
    ).toLowerCase();

  if (
    !text
  ) {
    return false;
  }

  const hard =
    getHardExclusion(
      text
    );

  if (
    hard &&
    !hasStrongRegulatorySignal(
      text
    )
  ) {
    return true;
  }

  if (
    hasStrongRegulatorySignal(
      text
    )
  ) {
    return false;
  }

  return (
    containsAny(
      text,
      [
        "speech by",
        "remarks by",
        "keynote",
        "lecture",
        "opening remarks",
        "closing remarks",
        "welcome remarks",
        "fireside chat",
        "interview with",
        "seen from normandy",
      ]
    ) ||
    /^[A-Z][^:]{2,70}:\s+/.test(
      cleanWhitespace(
        title
      )
    )
  );
}

function toAbsoluteUrl(
  value,
  baseUrl
) {
  if (
    !value
  ) {
    return "";
  }

  try {
    return new URL(
      value,
      baseUrl
    ).toString();
  } catch {
    return String(
      value
    );
  }
}

async function fetchArticleSummary(
  url,
  title,
  feedKey
) {
  if (
    !url
  ) {
    return "";
  }

  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () =>
        controller.abort(),
      ARTICLE_TIMEOUT_MS
    );

  try {
    const response =
      await fetch(
        url,
        {
          method:
            "GET",

          redirect:
            "follow",

          signal:
            controller.signal,

          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; BankRegX/1.0; +https://www.bankregx.com)",

            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

            "Accept-Language":
              "en-GB,en;q=0.9",

            "Cache-Control":
              "no-cache",
          },
        }
      );

    if (
      !response.ok
    ) {
      console.warn(
        `[regulatory-news] Source page returned ${response.status}: ${url}`
      );

      return "";
    }

    if (
      !(
        response.headers.get(
          "content-type"
        ) ||
        ""
      )
        .toLowerCase()
        .includes(
          "text/html"
        )
    ) {
      return "";
    }

    return extractBestPageSummary(
      await response.text(),
      title,
      feedKey
    );
  } catch (error) {
    if (
      error?.name !==
      "AbortError"
    ) {
      console.warn(
        `[regulatory-news] Unable to enrich source page ${url}:`,
        error?.message ||
          error
      );
    }

    return "";
  } finally {
    clearTimeout(
      timer
    );
  }
}

async function enrichItem(
  feed,
  item
) {
  const title =
    cleanWhitespace(
      item?.title ||
        "Untitled regulatory development"
    );

  const link =
    toAbsoluteUrl(
      item?.link ||
        item?.guid,
      feed.url
    );

  const rssSummary =
    getRssSummary(
      item,
      title
    );

  let summary =
    rssSummary || "";

  let summarySource =
    summary
      ? "rss"
      : "none";

  const titleText =
    title.toLowerCase();

  /*
   * Only hard macro / monetary-policy exclusions
   * prevent source-page enrichment.
   *
   * Low-value titles such as speeches or fireside
   * chats may still be enriched when they enter the
   * controlled fallback pool. Their source-page text
   * is then used to decide whether they contain real
   * banking / supervisory relevance.
   */
  const skipPageEnrichment =
    getHardExclusion(
      titleText
    ) &&
    !hasStrongRegulatorySignal(
      titleText
    );

  if (
    !summary &&
    link &&
    !skipPageEnrichment
  ) {
    const pageSummary =
      await fetchArticleSummary(
        link,
        title,
        feed.key
      );

    if (
      pageSummary
    ) {
      summary =
        pageSummary;

      summarySource =
        "source_page";
    }
  }

  const relevance =
    scoreRegulatoryRelevance({
      title,
      summary,
      source:
        feed.name,
    });

  return {
    title,

    link,

    guid:
      item?.guid ||
      link ||
      null,

    pubDate:
      item?.pubDate ||
      item?.isoDate ||
      null,

    isoDate:
      item?.isoDate ||
      item?.pubDate ||
      null,

    creator:
      item?.creator ||
      item?.author ||
      null,

    summary:
      summary || "",

    description:
      summary || "",

    contentSnippet:
      summary || "",

    summarySource,

    enrichedFromSourcePage:
      summarySource ===
      "source_page",

    ...relevance,
  };
}

async function mapWithConcurrency(
  items,
  concurrency,
  worker
) {
  const results =
    new Array(
      items.length
    );

  let nextIndex = 0;

  async function runWorker() {
    while (
      true
    ) {
      const index =
        nextIndex++;

      if (
        index >=
        items.length
      ) {
        return;
      }

      results[index] =
        await worker(
          items[index],
          index
        );
    }
  }

  await Promise.all(
    Array.from(
      {
        length:
          Math.min(
            concurrency,
            items.length
          ),
      },
      () =>
        runWorker()
    )
  );

  return results;
}

function dateValue(
  item
) {
  const parsed =
    new Date(
      item?.isoDate ||
        item?.pubDate ||
        0
    ).getTime();

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function selectRelevantItems(
  items
) {
  const relevant =
    items
      .filter(
        (item) =>
          item?.hardExcluded !==
            true &&
          Number(
            item?.relevanceScore ??
              -999
          ) >=
            MIN_RELEVANCE_SCORE
      )
      .sort(
        (a, b) =>
          dateValue(b) -
          dateValue(a)
      )
      .slice(
        0,
        RETURN_ITEMS_PER_FEED
      );

  if (
    relevant.length >
    0
  ) {
    return {
      items:
        relevant,

      fallbackApplied:
        false,
    };
  }

  /*
   * Controlled per-regulator fallback.
   *
   * This is only used where a
   * regulator would otherwise
   * disappear from the feed.
   */
  const fallback =
    items
      .filter(
        (item) =>
          item?.hardExcluded !==
          true
      )
      .filter(
        (item) =>
          !isCeremonial(
            item?.title ||
              ""
          )
      )
      .filter(
        (item) =>
          hasFallbackBankingSignal(
            `${
              item?.title ||
              ""
            } ${
              item?.summary ||
              ""
            }`
          )
      )
      .filter(
        (item) =>
          Number(
            item?.relevanceScore ??
              -999
          ) >=
            FALLBACK_MIN_RELEVANCE_SCORE
      )
      .sort(
        (a, b) => {
          const scoreDifference =
            Number(
              b?.relevanceScore ??
                -999
            ) -
            Number(
              a?.relevanceScore ??
                -999
            );

          if (
            scoreDifference !==
            0
          ) {
            return scoreDifference;
          }

          return (
            dateValue(b) -
            dateValue(a)
          );
        }
      )
      .slice(
        0,
        FALLBACK_ITEMS_PER_EMPTY_FEED
      )
      .map(
        (item) => ({
          ...item,

          relevanceFallback:
            true,

          relevanceLevel:
            "fallback",
        })
      );

  return {
    items:
      fallback,

    fallbackApplied:
      fallback.length >
      0,
  };
}

function buildEnrichmentPool(
  feed,
  items
) {
  const prepared =
    items.map(
      (
        item,
        index
      ) => {
        const title =
          cleanWhitespace(
            item?.title ||
              "Untitled regulatory development"
          );

        const rssSummary =
          getRssSummary(
            item,
            title
          );

        const preliminary =
          scoreRegulatoryRelevance({
            title,

            summary:
              rssSummary,

            source:
              feed.name,
          });

        return {
          item,
          index,
          title,
          rssSummary,

          preliminaryScore:
            preliminary.relevanceScore,

          hardExcluded:
            preliminary.hardExcluded,

          clearlyLowValue:
            isClearlyLowValueTitle(
              title
            ),

          ceremonial:
            isCeremonial(
              title
            ),

          fallbackSignal:
            hasFallbackBankingSignal(
              `${title} ${rssSummary}`
            ),
        };
      }
    );

  const ranked =
    [
      ...prepared,
    ]
      .filter(
        (entry) =>
          !entry.hardExcluded
      )
      .filter(
        (entry) =>
          !entry.clearlyLowValue ||
          entry.preliminaryScore >=
            MIN_RELEVANCE_SCORE
      )
      .sort(
        (a, b) =>
          b.preliminaryScore !==
          a.preliminaryScore
            ? b.preliminaryScore -
              a.preliminaryScore
            : a.index -
              b.index
      );

  const selected =
    new Set(
      ranked
        .slice(
          0,
          ENRICH_CANDIDATE_LIMIT
        )
        .map(
          (entry) =>
            entry.index
        )
    );

  /*
   * Protect against missing a
   * newly emerging regulatory
   * topic not yet captured by
   * the rules.
   */
  prepared
    .filter(
      (entry) =>
        !entry.hardExcluded &&
        !entry.clearlyLowValue
    )
    .slice(
      0,
      2
    )
    .forEach(
      (entry) =>
        selected.add(
          entry.index
        )
    );

  /*
   * Reserve a small number of
   * enrichment slots for possible
   * fallback items.
   *
   * This allows a banking-focused
   * ECB publication to be assessed
   * even where it sits below the
   * normal relevance threshold.
   */
  prepared
    .filter(
      (entry) =>
        !entry.hardExcluded &&
        !entry.ceremonial
    )
    .sort(
      (a, b) =>
        a.index -
        b.index
    )
    .slice(
      0,
      FALLBACK_ENRICHMENT_SLOTS
    )
    .forEach(
      (entry) =>
        selected.add(
          entry.index
        )
    );

  return prepared
    .filter(
      (entry) =>
        selected.has(
          entry.index
        )
    )
    .sort(
      (a, b) =>
        a.index -
        b.index
    )
    .map(
      (entry) =>
        entry.item
    );
}

async function loadFeed(
  feed
) {
  try {
    const data =
      await parser.parseURL(
        feed.url
      );

    const candidates =
      Array.isArray(
        data?.items
      )
        ? data.items.slice(
            0,
            FEED_SCAN_LIMIT
          )
        : [];

    const pool =
      buildEnrichmentPool(
        feed,
        candidates
      );

    const enriched =
      await mapWithConcurrency(
        pool,
        4,
        (item) =>
          enrichItem(
            feed,
            item
          )
      );

    const selection =
      selectRelevantItems(
        enriched
      );

    const items =
      selection.items;

    return {
      source:
        feed.name,

      name:
        feed.name,

      feedUrl:
        feed.url,

      items,

      relevance: {
        scanned:
          candidates.length,

        candidatesEnriched:
          pool.length,

        included:
          items.length,

        threshold:
          MIN_RELEVANCE_SCORE,

        hardMacroExclusion:
          true,

        fallbackApplied:
          selection.fallbackApplied,
      },

      error:
        null,
    };
  } catch (error) {
    console.error(
      `[regulatory-news] Failed to load ${feed.name}:`,
      error?.message ||
        error
    );

    return {
      source:
        feed.name,

      name:
        feed.name,

      feedUrl:
        feed.url,

      items: [],

      relevance: {
        scanned:
          0,

        candidatesEnriched:
          0,

        included:
          0,

        threshold:
          MIN_RELEVANCE_SCORE,

        hardMacroExclusion:
          true,

        fallbackApplied:
          false,
      },

      error:
        "Feed temporarily unavailable",
    };
  }
}

export default async function handler(
  req,
  res
) {
  if (
    req.method !==
    "GET"
  ) {
    res.setHeader(
      "Allow",
      "GET"
    );

    return res
      .status(405)
      .json({
        message:
          "Method Not Allowed",
      });
  }

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=900"
  );

  try {
    return res
      .status(200)
      .json(
        await Promise.all(
          FEEDS.map(
            (feed) =>
              loadFeed(
                feed
              )
          )
        )
      );
  } catch (error) {
    console.error(
      "[regulatory-news] Unexpected API failure:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Unable to load regulatory intelligence",
      });
  }
}