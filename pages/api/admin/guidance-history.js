import { adminDb } from "../../../lib/firebaseAdmin";
import { isAdminRequest } from "../../../lib/adminAuth";

function timestampToIso(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value
      .toDate()
      .toISOString();
  }

  if (
    typeof value.toMillis === "function"
  ) {
    return new Date(
      value.toMillis()
    ).toISOString();
  }

  return null;
}

function serializeCurrent(doc) {
  const data =
    doc.data();

  return {
    id:
      doc.id,

    guidanceId:
      data.guidanceId ||
      null,

    version:
      Number(
        data.version || 1
      ),

    title:
      data.title || "",

    guidance:
      data.guidance || "",

    category:
      data.category ||
      "general",

    subcategory:
      data.subcategory ||
      "",

    tags:
      Array.isArray(
        data.tags
      )
        ? data.tags
        : [],

    priority:
      data.priority ||
      "medium",

    rationale:
      data.rationale ||
      "",

    appliesTo:
      Array.isArray(
        data.appliesTo
      )
        ? data.appliesTo
        : [],

    status:
      data.status ||
      "draft",

    usageCount:
      Number(
        data.usageCount || 0
      ),

    lastUsedAt:
      timestampToIso(
        data.lastUsedAt
      ),

    createdAt:
      timestampToIso(
        data.createdAt
      ),

    updatedAt:
      timestampToIso(
        data.updatedAt
      ),

    isCurrent: true,
  };
}

function serializeHistory(
  doc
) {
  const data =
    doc.data();

  const snapshot =
    data.snapshot || {};

  return {
    historyId:
      doc.id,

    guidanceDocumentId:
      data.guidanceDocumentId ||
      null,

    guidanceId:
      data.guidanceId ||
      null,

    version:
      Number(
        data.version || 1
      ),

    title:
      snapshot.title ||
      "",

    guidance:
      snapshot.guidance ||
      "",

    category:
      snapshot.category ||
      "general",

    subcategory:
      snapshot.subcategory ||
      "",

    tags:
      Array.isArray(
        snapshot.tags
      )
        ? snapshot.tags
        : [],

    priority:
      snapshot.priority ||
      "medium",

    rationale:
      snapshot.rationale ||
      "",

    appliesTo:
      Array.isArray(
        snapshot.appliesTo
      )
        ? snapshot.appliesTo
        : [],

    status:
      snapshot.status ||
      "draft",

    archivedBy:
      data.archivedBy ||
      null,

    archivedAt:
      timestampToIso(
        data.archivedAt
      ),

    isCurrent: false,
  };
}

async function findGuidanceDocument(
  req
) {
  /*
   * Option 1:
   * direct Firestore document ID
   */

  const id =
    String(
      req.query.id || ""
    ).trim();

  if (id) {
    const doc =
      await adminDb
        .collection(
          "expert_guidance"
        )
        .doc(id)
        .get();

    if (doc.exists) {
      return doc;
    }
  }

  /*
   * Option 2:
   * human-readable BankRegX ID
   *
   * Example:
   * BRX-G-THZ61KOX
   */

  const guidanceId =
    String(
      req.query.guidanceId ||
      ""
    )
      .trim()
      .toUpperCase();

  if (guidanceId) {
    const snapshot =
      await adminDb
        .collection(
          "expert_guidance"
        )
        .where(
          "guidanceId",
          "==",
          guidanceId
        )
        .limit(1)
        .get();

    if (
      !snapshot.empty
    ) {
      return snapshot.docs[0];
    }
  }

  return null;
}

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  /*
   * Expert history is private.
   *
   * It requires the secure Expert Studio
   * admin session cookie.
   */

  if (
    !isAdminRequest(req)
  ) {
    return res
      .status(401)
      .json({
        message:
          "Unauthorised",
      });
  }

  if (
    req.method !== "GET"
  ) {
    return res
      .status(405)
      .json({
        message:
          "Method Not Allowed",
      });
  }

  const requestedId =
    String(
      req.query.id || ""
    ).trim();

  const requestedGuidanceId =
    String(
      req.query.guidanceId ||
      ""
    ).trim();

  if (
    !requestedId &&
    !requestedGuidanceId
  ) {
    return res
      .status(400)
      .json({
        message:
          "Provide either id or guidanceId",
      });
  }

  try {
    /*
     * =====================================================
     * 1. FIND THE CURRENT METHODOLOGY RECORD
     * =====================================================
     */

    const currentDoc =
      await findGuidanceDocument(
        req
      );

    if (!currentDoc) {
      return res
        .status(404)
        .json({
          message:
            "Expert guidance not found",
        });
    }

    /*
     * =====================================================
     * 2. LOAD ALL ARCHIVED VERSIONS
     * =====================================================
     */

    const historySnapshot =
      await adminDb
        .collection(
          "expert_guidance_history"
        )
        .where(
          "guidanceDocumentId",
          "==",
          currentDoc.id
        )
        .limit(250)
        .get();

    const history =
      historySnapshot.docs
        .map(
          serializeHistory
        )
        .sort(
          (a, b) =>
            b.version -
            a.version
        );

    /*
     * =====================================================
     * 3. CURRENT VERSION
     * =====================================================
     */

    const current =
      serializeCurrent(
        currentDoc
      );

    /*
     * =====================================================
     * 4. COMPLETE VERSION TIMELINE
     * =====================================================
     */

    const versions = [
      current,
      ...history,
    ].sort(
      (a, b) =>
        b.version -
        a.version
    );

    /*
     * =====================================================
     * 5. RETURN AUDIT TRAIL
     * =====================================================
     */

    return res
      .status(200)
      .json({
        guidanceId:
          current.guidanceId,

        documentId:
          current.id,

        currentVersion:
          current.version,

        versionCount:
          versions.length,

        current,

        history,

        versions,
      });
  } catch (error) {
    console.error(
      "Guidance history GET failed:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Unable to load methodology history",
      });
  }
}