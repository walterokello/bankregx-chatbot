import { adminDb } from "../../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { isAdminRequest } from "../../../lib/adminAuth";

const ALLOWED_STATUSES = [
  "submitted",
  "reviewed",
  "closed",
];

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

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
    typeof value.toMillis ===
    "function"
  ) {
    return new Date(
      value.toMillis()
    ).toISOString();
  }

  return null;
}

function timestampToMillis(value) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  return 0;
}

function normaliseVersion(value) {
  const version =
    Number(value);

  if (
    !Number.isFinite(version) ||
    version < 1
  ) {
    return null;
  }

  return Math.trunc(
    version
  );
}

/*
 * =========================================================
 * METHODOLOGY TRACE
 * =========================================================
 *
 * New BankRegX assessments store an immutable methodologyTrace
 * containing the exact guidance version used at assessment time.
 *
 * Older assessments may only contain the legacy guidanceIds /
 * guidanceTitles arrays. We retain those for backwards
 * compatibility but DO NOT invent a version number.
 * =========================================================
 */

function buildReviewMethodologyTrace(
  chatData
) {
  if (!chatData) {
    return [];
  }

  /*
   * Preferred source:
   * immutable methodology trace captured by /api/ask.
   */

  if (
    Array.isArray(
      chatData.methodologyTrace
    ) &&
    chatData.methodologyTrace
      .length > 0
  ) {
    return chatData.methodologyTrace
      .map((item) => {
        const version =
          normaliseVersion(
            item?.version
          );

        return {
          guidanceId:
            clean(
              item?.guidanceId ||
                item?.documentId
            ) || null,

          documentId:
            clean(
              item?.documentId
            ) || null,

          version,

          title:
            clean(
              item?.title
            ) || null,

          category:
            clean(
              item?.category
            ) || null,

          subcategory:
            clean(
              item?.subcategory
            ) || null,

          priority:
            clean(
              item?.priority
            ) || null,

          relevanceScore:
            Number.isFinite(
              Number(
                item?.relevanceScore
              )
            )
              ? Number(
                  item.relevanceScore
                )
              : null,

          /*
           * true means BankRegX actually captured this
           * version at the time of assessment.
           */

          exactVersion:
            version !== null,

          traceSource:
            "methodology_trace",
        };
      })
      .filter(
        (item) =>
          item.guidanceId
      );
  }

  /*
   * Legacy fallback.
   *
   * Some assessments may contain guidanceVersions if created
   * during an intermediate implementation. If so we can use
   * them. If no version was stored, leave version = null.
   */

  const guidanceIds =
    Array.isArray(
      chatData.guidanceIds
    )
      ? chatData.guidanceIds
      : [];

  const guidanceTitles =
    Array.isArray(
      chatData.guidanceTitles
    )
      ? chatData.guidanceTitles
      : [];

  const guidanceVersions =
    Array.isArray(
      chatData.guidanceVersions
    )
      ? chatData.guidanceVersions
      : [];

  const guidanceDocumentIds =
    Array.isArray(
      chatData.guidanceDocumentIds
    )
      ? chatData.guidanceDocumentIds
      : [];

  const guidanceSubcategories =
    Array.isArray(
      chatData.guidanceSubcategories
    )
      ? chatData.guidanceSubcategories
      : [];

  return guidanceIds.map(
    (
      guidanceId,
      index
    ) => {
      const version =
        normaliseVersion(
          guidanceVersions[
            index
          ]
        );

      return {
        guidanceId:
          clean(
            guidanceId
          ) || null,

        documentId:
          clean(
            guidanceDocumentIds[
              index
            ]
          ) || null,

        version,

        title:
          clean(
            guidanceTitles[
              index
            ]
          ) ||
          "Expert principle",

        category:
          null,

        subcategory:
          clean(
            guidanceSubcategories[
              index
            ]
          ) || null,

        priority:
          null,

        relevanceScore:
          null,

        exactVersion:
          version !== null,

        traceSource:
          "legacy_fields",
      };
    }
  );
}

function serializeReview(
  doc,
  chatData = null
) {
  const data =
    doc.data();

  const methodologyTrace =
    buildReviewMethodologyTrace(
      chatData
    );

  const methodologyTraceSchemaVersion =
    Number.isFinite(
      Number(
        chatData?.methodologyTraceSchemaVersion
      )
    )
      ? Number(
          chatData.methodologyTraceSchemaVersion
        )
      : null;

  return {
    id:
      doc.id,

    responseId:
      data.responseId ||
      null,

    userId:
      data.userId ||
      null,

    question:
      data.question ||
      "",

    aiResponse:
      data.aiResponse ||
      "",

    feedbackType:
      data.feedbackType ||
      "legacy",

    correctedAnswer:
      data.correctedAnswer ||
      "",

    rationale:
      data.rationale ||
      "",

    category:
      data.category ||
      "general",

    tags:
      Array.isArray(
        data.tags
      )
        ? data.tags
        : [],

    source:
      data.source ||
      "bankregx",

    status:
      data.status ||
      "submitted",

    linkedGuidanceId:
      data.linkedGuidanceId ||
      null,

    linkedGuidanceDocumentId:
      data.linkedGuidanceDocumentId ||
      null,

    createdAt:
      timestampToIso(
        data.createdAt
      ),

    reviewedAt:
      timestampToIso(
        data.reviewedAt
      ),

    closedAt:
      timestampToIso(
        data.closedAt
      ),

    /*
     * =====================================================
     * INTELLIGENCE TRACE
     * =====================================================
     */

    methodologyTraceSchemaVersion,

    methodologyTrace,

    /*
     * Keep legacy arrays available for backwards
     * compatibility with existing Review Queue UI/code.
     */

    guidanceIds:
      Array.isArray(
        chatData?.guidanceIds
      )
        ? chatData.guidanceIds
        : methodologyTrace.map(
            (item) =>
              item.guidanceId
          ),

    guidanceDocumentIds:
      Array.isArray(
        chatData?.guidanceDocumentIds
      )
        ? chatData.guidanceDocumentIds
        : methodologyTrace.map(
            (item) =>
              item.documentId
          ),

    guidanceVersions:
      Array.isArray(
        chatData?.guidanceVersions
      )
        ? chatData.guidanceVersions
        : methodologyTrace.map(
            (item) =>
              item.version
          ),

    guidanceTitles:
      Array.isArray(
        chatData?.guidanceTitles
      )
        ? chatData.guidanceTitles
        : methodologyTrace.map(
            (item) =>
              item.title
          ),

    detectedCategories:
      Array.isArray(
        chatData?.detectedCategories
      )
        ? chatData.detectedCategories
        : [],

    usedWebSearch:
      Boolean(
        chatData?.usedWebSearch
      ),

    browsedSources:
      Array.isArray(
        chatData?.browsedSources
      )
        ? chatData.browsedSources
        : [],

    reasoningMode:
      chatData?.reasoningMode ||
      null,

    retrievalMode:
      chatData?.retrievalMode ||
      null,
  };
}

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

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

  /*
   * =====================================================
   * GET — REVIEW QUEUE
   * =====================================================
   */

  if (
    req.method ===
    "GET"
  ) {
    try {
      const snapshot =
        await adminDb
          .collection(
            "expert_feedback"
          )
          .limit(250)
          .get();

      /*
       * Only corrections and rejections require
       * expert review.
       *
       * Approved answers remain useful learning signals
       * but do not need to enter this queue.
       */

      const reviewDocs =
        snapshot.docs.filter(
          (doc) => {
            const data =
              doc.data();

            return [
              "correct",
              "reject",
            ].includes(
              data.feedbackType
            );
          }
        );

      const enriched =
        await Promise.all(
          reviewDocs.map(
            async (doc) => {
              const data =
                doc.data();

              let chatData =
                null;

              if (
                data.responseId
              ) {
                try {
                  const chatDoc =
                    await adminDb
                      .collection(
                        "chat_history"
                      )
                      .doc(
                        data.responseId
                      )
                      .get();

                  if (
                    chatDoc.exists
                  ) {
                    chatData =
                      chatDoc.data();
                  }
                } catch (
                  error
                ) {
                  console.error(
                    "Unable to load linked chat:",
                    error
                  );
                }
              }

              return {
                review:
                  serializeReview(
                    doc,
                    chatData
                  ),

                createdAtMillis:
                  timestampToMillis(
                    data.createdAt
                  ),
              };
            }
          )
        );

      const reviews =
        enriched
          .sort(
            (a, b) =>
              b.createdAtMillis -
              a.createdAtMillis
          )
          .map(
            (item) =>
              item.review
          );

      const counts = {
        total:
          reviews.length,

        open:
          reviews.filter(
            (item) =>
              item.status !==
              "closed"
          ).length,

        corrected:
          reviews.filter(
            (item) =>
              item.feedbackType ===
              "correct"
          ).length,

        rejected:
          reviews.filter(
            (item) =>
              item.feedbackType ===
              "reject"
          ).length,

        closed:
          reviews.filter(
            (item) =>
              item.status ===
              "closed"
          ).length,
      };

      return res
        .status(200)
        .json({
          count:
            reviews.length,

          counts,

          reviews,
        });
    } catch (error) {
      console.error(
        "Admin review GET failed:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Unable to load Expert Review Queue",
        });
    }
  }

  /*
   * =====================================================
   * PATCH — UPDATE REVIEW STATUS / LINK DRAFT GUIDANCE
   * =====================================================
   */

  if (
    req.method ===
    "PATCH"
  ) {
    try {
      const {
        id,
        status,
        linkedGuidanceId,
        linkedGuidanceDocumentId,
      } =
        req.body || {};

      if (!id) {
        return res
          .status(400)
          .json({
            message:
              "Review id is required",
          });
      }

      const docRef =
        adminDb
          .collection(
            "expert_feedback"
          )
          .doc(id);

      const existing =
        await docRef.get();

      if (
        !existing.exists
      ) {
        return res
          .status(404)
          .json({
            message:
              "Review not found",
          });
      }

      const update = {
        updatedAt:
          FieldValue.serverTimestamp(),
      };

      if (
        status !==
        undefined
      ) {
        if (
          !ALLOWED_STATUSES.includes(
            status
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid review status",
            });
        }

        update.status =
          status;

        if (
          status ===
          "reviewed"
        ) {
          update.reviewedAt =
            FieldValue.serverTimestamp();

          update.reviewedBy =
            "bankregx-expert";
        }

        if (
          status ===
          "closed"
        ) {
          update.closedAt =
            FieldValue.serverTimestamp();

          update.closedBy =
            "bankregx-expert";
        }

        if (
          status ===
          "submitted"
        ) {
          update.closedAt =
            null;

          update.closedBy =
            null;
        }
      }

      if (
        linkedGuidanceId !==
        undefined
      ) {
        update.linkedGuidanceId =
          clean(
            linkedGuidanceId
          ) || null;
      }

      if (
        linkedGuidanceDocumentId !==
        undefined
      ) {
        update.linkedGuidanceDocumentId =
          clean(
            linkedGuidanceDocumentId
          ) || null;
      }

      await docRef.update(
        update
      );

      return res
        .status(200)
        .json({
          message:
            "Expert review updated successfully",

          id,
        });
    } catch (error) {
      console.error(
        "Admin review PATCH failed:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Unable to update expert review",
        });
    }
  }

  return res
    .status(405)
    .json({
      message:
        "Method Not Allowed",
    });
}