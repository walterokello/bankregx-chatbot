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

/*
 * =========================================================
 * REGULATORY FEEDS
 * =========================================================
 */

const FEEDS = [
  {
    name: "Federal Reserve",
    url:
      "https://www.federalreserve.gov/feeds/press_all.xml",
  },

  {
    name: "FCA",
    url:
      "https://www.fca.org.uk/news/rss.xml",
  },

  {
    name: "ECB",
    url:
      "https://www.ecb.europa.eu/rss/press.html",
  },
];

const ITEMS_PER_FEED = 5;

/*
 * Article-page enrichment is only used when the RSS feed
 * does not contain enough usable source information.
 */

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

/*
 * =========================================================
 * TEXT HELPERS
 * =========================================================
 */

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
      const key =
        String(entity).toLowerCase();

      /*
       * Hexadecimal entities
       */

      if (key.startsWith("#x")) {
        const codePoint =
          Number.parseInt(
            key.slice(2),
            16
          );

        if (
          Number.isFinite(
            codePoint
          )
        ) {
          try {
            return String.fromCodePoint(
              codePoint
            );
          } catch {
            return match;
          }
        }
      }

      /*
       * Decimal entities
       */

      if (key.startsWith("#")) {
        const codePoint =
          Number.parseInt(
            key.slice(1),
            10
          );

        if (
          Number.isFinite(
            codePoint
          )
        ) {
          try {
            return String.fromCodePoint(
              codePoint
            );
          } catch {
            return match;
          }
        }
      }

      return (
        named[key] ??
        match
      );
    }
  );
}

function stripHtml(value) {
  return cleanWhitespace(
    decodeHtmlEntities(
      String(value || "")

        /*
         * Remove non-content blocks.
         */

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

        /*
         * Preserve natural word breaks.
         */

        .replace(
          /<br\s*\/?\s*>/gi,
          " "
        )

        .replace(
          /<\/p>/gi,
          " "
        )

        /*
         * Strip remaining tags.
         */

        .replace(
          /<[^>]+>/g,
          " "
        )
    )
  );
}

function isBoilerplate(value) {
  const lower =
    cleanWhitespace(
      value
    ).toLowerCase();

  return BOILERPLATE_PHRASES.some(
    (phrase) =>
      lower.includes(
        phrase
      )
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

  if (
    isBoilerplate(
      text
    )
  ) {
    return false;
  }

  const normalizedText =
    text.toLowerCase();

  const normalizedTitle =
    cleanWhitespace(
      title
    ).toLowerCase();

  /*
   * A title repeated as the
   * "description" is not enough
   * information for an assessment.
   */

  if (
    normalizedTitle &&
    normalizedText ===
      normalizedTitle
  ) {
    return false;
  }

  return true;
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

  /*
   * Prefer ending at a
   * complete sentence.
   */

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
    .trim()}…`;
}

/*
 * =========================================================
 * HTML METADATA EXTRACTION
 * =========================================================
 */

function getAttribute(
  tag,
  attributeName
) {
  const quoted =
    tag.match(
      new RegExp(
        `${attributeName}\\s*=\\s*["']([^"']*)["']`,
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

function extractMetaDescription(
  html
) {
  const metaTags =
    String(
      html || ""
    ).match(
      /<meta\b[^>]*>/gi
    ) || [];

  /*
   * Standard description first,
   * then social-sharing descriptions.
   */

  const preferred = [
    "description",
    "og:description",
    "twitter:description",
  ];

  for (
    const wanted of
    preferred
  ) {
    for (
      const tag of
      metaTags
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

      if (content) {
        return content;
      }
    }
  }

  return "";
}

/*
 * =========================================================
 * JSON-LD EXTRACTION
 * =========================================================
 *
 * Many regulator websites expose article/speech descriptions
 * through structured JSON-LD metadata.
 * =========================================================
 */

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
      const item of
      value
    ) {
      const found =
        findJsonLdDescription(
          item
        );

      if (found) {
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

  const directCandidates = [
    value.description,
    value.abstract,
    value.articleBody,
  ];

  for (
    const candidate of
    directCandidates
  ) {
    const text =
      stripHtml(
        candidate
      );

    if (text) {
      return text;
    }
  }

  if (
    value["@graph"]
  ) {
    return findJsonLdDescription(
      value["@graph"]
    );
  }

  return "";
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
    const match of
    scripts
  ) {
    const raw =
      match?.[1]?.trim();

    if (!raw) {
      continue;
    }

    try {
      const parsed =
        JSON.parse(
          raw
        );

      const description =
        findJsonLdDescription(
          parsed
        );

      if (
        description
      ) {
        return description;
      }
    } catch {
      /*
       * Some pages contain malformed
       * or non-standard JSON-LD.
       *
       * Ignore it and continue to
       * normal page-content extraction.
       */
    }
  }

  return "";
}

/*
 * =========================================================
 * ARTICLE PARAGRAPH EXTRACTION
 * =========================================================
 */

function extractParagraphSummary(
  html
) {
  const source =
    String(
      html || ""
    );

  /*
   * Prefer the semantic article/main
   * section where available.
   */

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

  const paragraphs = [
    ...contentArea.matchAll(
      /<p\b[^>]*>([\s\S]*?)<\/p>/gi
    ),
  ]

    .map(
      (match) =>
        stripHtml(
          match[1]
        )
    )

    /*
     * Ignore tiny navigation / label text.
     */

    .filter(
      (text) =>
        text.length >= 60
    )

    /*
     * Ignore cookie and navigation language.
     */

    .filter(
      (text) =>
        !isBoilerplate(
          text
        )
    );

  if (
    paragraphs.length ===
    0
  ) {
    return "";
  }

  let combined = "";

  /*
   * Usually the first 1–3 substantive
   * paragraphs are enough to give
   * BankRegX source context.
   */

  for (
    const paragraph of
    paragraphs
  ) {
    combined =
      combined
        ? `${combined} ${paragraph}`
        : paragraph;

    if (
      combined.length >=
      500
    ) {
      break;
    }
  }

  return truncateSummary(
    combined
  );
}

/*
 * =========================================================
 * BEST SOURCE-PAGE SUMMARY
 * =========================================================
 */

function extractBestPageSummary(
  html,
  title
) {
  const candidates = [
    extractMetaDescription(
      html
    ),

    extractJsonLdDescription(
      html
    ),

    extractParagraphSummary(
      html
    ),
  ];

  for (
    const candidate of
    candidates
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

/*
 * =========================================================
 * RSS SUMMARY
 * =========================================================
 */

function getRssSummary(
  item
) {
  const candidates = [
    item?.contentSnippet,
    item?.summary,
    item?.description,
    item?.content,
    item?.[
      "content:encoded"
    ],
  ];

  for (
    const candidate of
    candidates
  ) {
    const text =
      stripHtml(
        candidate
      );

    if (text) {
      return truncateSummary(
        text
      );
    }
  }

  return "";
}

/*
 * =========================================================
 * URL NORMALISATION
 * =========================================================
 */

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
    return String(
      value
    );
  }
}

/*
 * =========================================================
 * FETCH REGULATOR SOURCE PAGE
 * =========================================================
 */

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

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    /*
     * Don't try to parse PDFs,
     * images or other binary content
     * as HTML.
     */

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
    clearTimeout(
      timer
    );
  }
}

/*
 * =========================================================
 * ENRICH ONE REGULATORY DEVELOPMENT
 * =========================================================
 */

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
      item
    );

  let summary =
    rssSummary;

  let summarySource =
    rssSummary
      ? "rss"
      : "none";

  /*
   * IMPORTANT:
   *
   * If the regulator's RSS item contains no meaningful
   * description, fetch the regulator's actual source page.
   *
   * This is the key change for ECB speeches / publications.
   */

  if (
    !isUsefulSummary(
      rssSummary,
      title
    ) &&
    link
  ) {
    const pageSummary =
      await fetchArticleSummary(
        link,
        title
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

  /*
   * Return several normalised summary fields.
   *
   * This preserves compatibility with different versions
   * of the BankRegX Regulatory Intelligence UI.
   */

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

    /*
     * Normalised content.
     */

    summary:
      summary || "",

    description:
      summary || "",

    contentSnippet:
      summary || "",

    /*
     * Metadata useful for debugging and
     * future BankRegX enhancements.
     */

    summarySource,

    enrichedFromSourcePage:
      summarySource ===
      "source_page",
  };
}

/*
 * =========================================================
 * CONTROLLED CONCURRENCY
 * =========================================================
 *
 * Avoid sending too many simultaneous requests to
 * regulator websites.
 * =========================================================
 */

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

/*
 * =========================================================
 * LOAD ONE REGULATOR FEED
 * =========================================================
 */

async function loadFeed(
  feed
) {
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

    /*
     * Enrich up to three items simultaneously.
     */

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
      /*
       * Keep BOTH source and name for
       * compatibility with existing BankRegX UI.
       */

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

    /*
     * One regulator failing must NOT
     * take down Regulatory Intelligence.
     */

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

/*
 * =========================================================
 * API HANDLER
 * =========================================================
 */

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
   * Cache for five minutes.
   *
   * Regulatory content does not need to be fetched again
   * for every individual BankRegX visitor.
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
            loadFeed(
              feed
            )
        )
      );

    return res
      .status(200)
      .json(
        results
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