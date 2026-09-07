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
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
  },
  {
    name: "FCA",
    url: "https://www.fca.org.uk/news/rss.xml",
  },
  {
    name: "ECB",
    url: "https://www.ecb.europa.eu/rss/press.html",
  },
];

const ITEMS_PER_FEED = 5;
const ARTICLE_TIMEOUT_MS = 7000;
const MIN_USEFUL_SUMMARY_LENGTH = 90;
const MAX_SUMMARY_LENGTH = 900;

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
    ndash: "–",
    mdash: "—",
    lsquo: "‘",
    rsquo: "’",
    ldquo: "“",
    rdquo: "”",
    hellip: "…",
  };

  return String(value || "").replace(
    /&(#x?[0-9a-f]+|[a-z]+);/gi,
    (match, entity) => {
      const key = String(entity).toLowerCase();

      if (key.startsWith("#x")) {
        const codePoint = Number.parseInt(key.slice(2), 16);

        if (Number.isFinite(codePoint)) {
          try {
            return String.fromCodePoint(codePoint);
          } catch {
            return match;
          }
        }
      }

      if (key.startsWith("#")) {
        const codePoint = Number.parseInt(key.slice(1), 10);

        if (Number.isFinite(codePoint)) {
          try {
            return String.fromCodePoint(codePoint);
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
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<br\s*\/?\s*>/gi, " ")
        .replace(/<\/p>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function isBoilerplate(value) {
  const lower = cleanWhitespace(value).toLowerCase();

  return BOILERPLATE_PHRASES.some((phrase) =>
    lower.includes(phrase)
  );
}

function isGenericRegulatorDescription(value) {
  const text = cleanWhitespace(value).toLowerCase();

  if (!text) {
    return true;
  }

  const genericPatterns = [
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
  ];

  return genericPatterns.some((pattern) =>
    text.includes(pattern)
  );
}

function isUsefulSummary(value, title = "") {
  const text = cleanWhitespace(value);

  if (!text || text.length < MIN_USEFUL_SUMMARY_LENGTH) {
    return false;
  }

  if (
    isBoilerplate(text) ||
    isGenericRegulatorDescription(text)
  ) {
    return false;
  }

  const normalizedText = text.toLowerCase();
  const normalizedTitle = cleanWhitespace(title).toLowerCase();

  if (
    normalizedTitle &&
    normalizedText === normalizedTitle
  ) {
    return false;
  }

  return true;
}

function truncateSummary(
  value,
  maxLength = MAX_SUMMARY_LENGTH
) {
  const text = cleanWhitespace(value);

  if (text.length <= maxLength) {
    return text;
  }

  const shortened = text.slice(0, maxLength);

  const sentenceEnd = Math.max(
    shortened.lastIndexOf(". "),
    shortened.lastIndexOf("! "),
    shortened.lastIndexOf("? ")
  );

  if (sentenceEnd > maxLength * 0.55) {
    return shortened
      .slice(0, sentenceEnd + 1)
      .trim();
  }

  const lastSpace = shortened.lastIndexOf(" ");

  return `${shortened
    .slice(
      0,
      lastSpace > 0
        ? lastSpace
        : maxLength
    )
    .trim()}…`;
}

function getAttribute(
  tag,
  attributeName
) {
  const quoted = tag.match(
    new RegExp(
      `${attributeName}\\s*=\\s*["']([^"']*)["']`,
      "i"
    )
  );

  if (quoted?.[1]) {
    return decodeHtmlEntities(
      quoted[1]
    );
  }

  const unquoted = tag.match(
    new RegExp(
      `${attributeName}\\s*=\\s*([^\\s>]+)`,
      "i"
    )
  );

  return unquoted?.[1]
    ? decodeHtmlEntities(
        unquoted[1]
      )
    : "";
}

function extractMetaDescription(html) {
  const metaTags =
    String(html || "").match(
      /<meta\b[^>]*>/gi
    ) || [];

  const preferred = [
    "description",
    "og:description",
    "twitter:description",
  ];

  for (const wanted of preferred) {
    for (const tag of metaTags) {
      const key = cleanWhitespace(
        getAttribute(tag, "name") ||
          getAttribute(tag, "property")
      ).toLowerCase();

      if (key !== wanted) {
        continue;
      }

      const content = stripHtml(
        getAttribute(tag, "content")
      );

      if (content) {
        return content;
      }
    }
  }

  return "";
}

function findJsonLdDescription(value) {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found =
        findJsonLdDescription(item);

      if (found) {
        return found;
      }
    }

    return "";
  }

  if (typeof value !== "object") {
    return "";
  }

  const directCandidates = [
    value.description,
    value.abstract,
    value.articleBody,
  ];

  for (const candidate of directCandidates) {
    const text =
      stripHtml(candidate);

    if (text) {
      return text;
    }
  }

  if (value["@graph"]) {
    return findJsonLdDescription(
      value["@graph"]
    );
  }

  return "";
}

function extractJsonLdDescription(html) {
  const scripts = [
    ...String(html || "").matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  for (const match of scripts) {
    const raw =
      match?.[1]?.trim();

    if (!raw) {
      continue;
    }

    try {
      const parsed =
        JSON.parse(raw);

      const description =
        findJsonLdDescription(parsed);

      if (description) {
        return description;
      }
    } catch {
      // Ignore malformed JSON-LD.
    }
  }

  return "";
}

function extractParagraphSummary(
  html,
  title = ""
) {
  const source =
    String(html || "");

  const articleMatch =
    source.match(
      /<article\b[^>]*>([\s\S]*?)<\/article>/i
    );

  const mainMatch =
    source.match(
      /<main\b[^>]*>([\s\S]*?)<\/main>/i
    );

  const contentArea =
    articleMatch?.[1] ||
    mainMatch?.[1] ||
    source;

  const titleText =
    cleanWhitespace(title).toLowerCase();

  const paragraphs = [
    ...contentArea.matchAll(
      /<p\b[^>]*>([\s\S]*?)<\/p>/gi
    ),
  ]
    .map((match) =>
      stripHtml(match[1])
    )

    .filter(
      (text) =>
        text.length >= 40
    )

    .filter(
      (text) =>
        !isBoilerplate(text)
    )

    .filter(
      (text) =>
        !isGenericRegulatorDescription(text)
    )

    .filter((text) => {
      if (!titleText) {
        return true;
      }

      return (
        text.toLowerCase() !==
        titleText
      );
    });

  if (paragraphs.length === 0) {
    return "";
  }

  /*
   * Prefer paragraphs that look like
   * substantive regulatory content.
   */

  const substantive =
    paragraphs.filter((paragraph) => {
      const lower =
        paragraph.toLowerCase();

      return (
        lower.includes("speech") ||
        lower.includes("slides") ||
        lower.includes("remarks") ||
        lower.includes("press release") ||
        lower.includes("conference") ||
        lower.includes("monetary") ||
        lower.includes("financial") ||
        lower.includes("inflation") ||
        lower.includes("payment") ||
        lower.includes("bank") ||
        lower.includes("policy") ||
        lower.includes("market") ||
        lower.includes("econom") ||
        paragraph.length >= 120
      );
    });

  const chosen =
    substantive.length > 0
      ? substantive
      : paragraphs;

  let combined = "";

  for (const paragraph of chosen) {
    combined =
      combined
        ? `${combined} ${paragraph}`
        : paragraph;

    if (
      combined.length >= 550
    ) {
      break;
    }
  }

  return truncateSummary(
    combined
  );
}

function extractBestPageSummary(
  html,
  title
) {
  /*
   * 1. Prefer actual article /
   * speech content.
   */

  const articleSummary =
    extractParagraphSummary(
      html,
      title
    );

  if (
    isUsefulSummary(
      articleSummary,
      title
    )
  ) {
    return truncateSummary(
      articleSummary
    );
  }

  /*
   * 2. Then try structured
   * article metadata.
   */

  const jsonLdSummary =
    extractJsonLdDescription(
      html
    );

  if (
    isUsefulSummary(
      jsonLdSummary,
      title
    )
  ) {
    return truncateSummary(
      jsonLdSummary
    );
  }

  /*
   * 3. Meta description is LAST
   * because ECB pages can contain
   * generic organisation text.
   */

  const metaSummary =
    extractMetaDescription(
      html
    );

  if (
    isUsefulSummary(
      metaSummary,
      title
    )
  ) {
    return truncateSummary(
      metaSummary
    );
  }

  return "";
}

function getRssSummary(item) {
  const candidates = [
    item?.contentSnippet,
    item?.summary,
    item?.description,
    item?.content,
    item?.[
      "content:encoded"
    ],
  ];

  for (const candidate of candidates) {
    const text =
      stripHtml(candidate);

    if (text) {
      return truncateSummary(
        text
      );
    }
  }

  return "";
}

function toAbsoluteUrl(
  value,
  baseUrl
) {
  if (!value) {
    return "";
  }

  try {
    return new URL(
      value,
      baseUrl
    ).toString();
  } catch {
    return String(value);
  }
}

async function fetchArticleSummary(
  url,
  title
) {
  if (!url) {
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
          method: "GET",
          redirect: "follow",
          signal: controller.signal,

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

    if (!response.ok) {
      console.warn(
        `[regulatory-news] Source page returned ${response.status}: ${url}`
      );

      return "";
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType
        .toLowerCase()
        .includes(
          "text/html"
        )
    ) {
      return "";
    }

    const html =
      await response.text();

    return extractBestPageSummary(
      html,
      title
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
    clearTimeout(timer);
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
    getRssSummary(item);

  let summary = "";
  let summarySource =
    "none";

  /*
   * Only accept RSS text when
   * it is genuinely useful.
   */

  if (
    isUsefulSummary(
      rssSummary,
      title
    )
  ) {
    summary =
      rssSummary;

    summarySource =
      "rss";
  }

  /*
   * If RSS is absent, too short,
   * generic or organisation-level,
   * read the actual regulator page.
   */

  if (!summary && link) {
    const pageSummary =
      await fetchArticleSummary(
        link,
        title
      );

    if (pageSummary) {
      summary =
        pageSummary;

      summarySource =
        "source_page";
    }
  }

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
    while (true) {
      const index =
        nextIndex;

      nextIndex += 1;

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

  const workerCount =
    Math.min(
      concurrency,
      items.length
    );

  await Promise.all(
    Array.from(
      {
        length:
          workerCount,
      },
      () =>
        runWorker()
    )
  );

  return results;
}

async function loadFeed(feed) {
  try {
    const data =
      await parser.parseURL(
        feed.url
      );

    const latestItems =
      Array.isArray(
        data?.items
      )
        ? data.items.slice(
            0,
            ITEMS_PER_FEED
          )
        : [];

    const items =
      await mapWithConcurrency(
        latestItems,
        3,
        (item) =>
          enrichItem(
            feed,
            item
          )
      );

    return {
      source:
        feed.name,

      name:
        feed.name,

      feedUrl:
        feed.url,

      items,

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

  /*
   * Cache regulatory results for
   * five minutes.
   */

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=900"
  );

  try {
    const results =
      await Promise.all(
        FEEDS.map(
          (feed) =>
            loadFeed(feed)
        )
      );

    return res
      .status(200)
      .json(results);
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