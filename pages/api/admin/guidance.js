import crypto from "crypto";
import { adminDb } from "../../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { isAdminRequest } from "../../../lib/adminAuth";

const ALLOWED_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
];

const ALLOWED_STATUSES = [
  "draft",
  "approved",
  "deprecated",
];

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((item) => clean(item))
        .filter(Boolean)
    ),
  ].slice(0, 25);
}

function timestampToIso(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
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

function serializeGuidance(doc) {
  const data = doc.data();

  return {
    id: doc.id,

    guidanceId:
      data.guidanceId || null,

    title:
      data.title || "",

    guidance:
      data.guidance || "",

    category:
      data.category || "general",

    subcategory:
      data.subcategory || "",

    tags:
      Array.isArray(data.tags)
        ? data.tags
        : [],

    priority:
      data.priority || "medium",

    rationale:
      data.rationale || "",

    appliesTo:
      Array.isArray(data.appliesTo)
        ? data.appliesTo
        : [],

    scope:
      data.scope || "bankregx",

    status:
      data.status || "draft",

    source:
      data.source || "expert",

    createdBy:
      data.createdBy ||
      "bankregx-expert",

    version:
      Number(data.version || 1),

    usageCount:
      Number(
        data.usageCount || 0
      ),

    createdAt:
      timestampToIso(
        data.createdAt
      ),

    updatedAt:
      timestampToIso(
        data.updatedAt
      ),

    lastUsedAt:
      timestampToIso(
        data.lastUsedAt
      ),
  };
}

function priorityRank(priority) {
  const ranks = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return ranks[priority] || 0;
}

function statusRank(status) {
  const ranks = {
    approved: 3,
    draft: 2,
    deprecated: 1,
  };

  return ranks[status] || 0;
}

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  if (!isAdminRequest(req)) {
    return res
      .status(401)
      .json({
        message:
          "Unauthorised",
      });
  }

  /*
   * =====================================================
   * GET — LIST ALL EXPERT GUIDANCE
   * =====================================================
   */

  if (req.method === "GET") {
    try {
      const snapshot =
        await adminDb
          .collection(
            "expert_guidance"
          )
          .limit(250)
          .get();

      const guidance =
        snapshot.docs
          .map(
            serializeGuidance
          )
          .sort((a, b) => {
            const statusDifference =
              statusRank(
                b.status
              ) -
              statusRank(
                a.status
              );

            if (
              statusDifference !== 0
            ) {
              return statusDifference;
            }

            const priorityDifference =
              priorityRank(
                b.priority
              ) -
              priorityRank(
                a.priority
              );

            if (
              priorityDifference !== 0
            ) {
              return priorityDifference;
            }

            return String(
              b.updatedAt || ""
            ).localeCompare(
              String(
                a.updatedAt || ""
              )
            );
          });

      return res
        .status(200)
        .json({
          count:
            guidance.length,

          guidance,
        });
    } catch (error) {
      console.error(
        "Admin guidance GET failed:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Unable to load expert guidance",
        });
    }
  }

  /*
   * =====================================================
   * POST — CREATE NEW PRINCIPLE
   * =====================================================
   */

  if (req.method === "POST") {
    try {
      const {
        title,
        guidance,
        category = "general",
        subcategory = "",
        tags = [],
        priority = "medium",
        rationale = "",
        appliesTo = [],
        status = "draft",
      } = req.body || {};

      const cleanedTitle =
        clean(title);

      const cleanedGuidance =
        clean(guidance);

      if (
        !cleanedTitle ||
        !cleanedGuidance
      ) {
        return res
          .status(400)
          .json({
            message:
              "Title and expert principle are required",
          });
      }

      const cleanedPriority =
        ALLOWED_PRIORITIES.includes(
          priority
        )
          ? priority
          : "medium";

      const cleanedStatus =
        ALLOWED_STATUSES.includes(
          status
        )
          ? status
          : "draft";

      const docRef =
        adminDb
          .collection(
            "expert_guidance"
          )
          .doc();

      const guidanceId =
        `BRX-G-${docRef.id
          .slice(0, 8)
          .toUpperCase()}`;

      await docRef.set({
        guidanceId,

        title:
          cleanedTitle,

        guidance:
          cleanedGuidance,

        category:
          clean(category) ||
          "general",

        subcategory:
          clean(subcategory),

        tags:
          cleanArray(tags),

        priority:
          cleanedPriority,

        rationale:
          clean(rationale),

        appliesTo:
          cleanArray(
            appliesTo
          ),

        scope:
          "bankregx",

        status:
          cleanedStatus,

        source:
          "expert",

        createdBy:
          "bankregx-expert",

        version: 1,

        usageCount: 0,

        lastUsedAt: null,

        createdAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp(),
      });

      return res
        .status(201)
        .json({
          message:
            "Expert guidance created successfully",

          id:
            docRef.id,

          guidanceId,

          status:
            cleanedStatus,
        });
    } catch (error) {
      console.error(
        "Admin guidance POST failed:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Unable to create expert guidance",
        });
    }
  }

  /*
   * =====================================================
   * PATCH — EDIT / APPROVE / DEPRECATE
   * =====================================================
   */

  if (req.method === "PATCH") {
    try {
      const {
        id,
        title,
        guidance,
        category,
        subcategory,
        tags,
        priority,
        rationale,
        appliesTo,
        status,
      } = req.body || {};

      if (!id) {
        return res
          .status(400)
          .json({
            message:
              "Guidance document id is required",
          });
      }

      const docRef =
        adminDb
          .collection(
            "expert_guidance"
          )
          .doc(id);

      const historyRef =
        adminDb
          .collection(
            "expert_guidance_history"
          )
          .doc(
            crypto.randomUUID()
          );

      let newVersion = null;

      await adminDb.runTransaction(
        async (
          transaction
        ) => {
          const existing =
            await transaction.get(
              docRef
            );

          if (
            !existing.exists
          ) {
            const error =
              new Error(
                "Expert guidance not found"
              );

            error.code =
              "NOT_FOUND";

            throw error;
          }

          const current =
            existing.data();

          /*
           * Preserve the previous version before changing
           * the live methodology record.
           */

          transaction.set(
            historyRef,
            {
              guidanceDocumentId:
                existing.id,

              guidanceId:
                current.guidanceId ||
                null,

              version:
                Number(
                  current.version ||
                    1
                ),

              snapshot: {
                title:
                  current.title ||
                  "",

                guidance:
                  current.guidance ||
                  "",

                category:
                  current.category ||
                  "general",

                subcategory:
                  current.subcategory ||
                  "",

                tags:
                  Array.isArray(
                    current.tags
                  )
                    ? current.tags
                    : [],

                priority:
                  current.priority ||
                  "medium",

                rationale:
                  current.rationale ||
                  "",

                appliesTo:
                  Array.isArray(
                    current.appliesTo
                  )
                    ? current.appliesTo
                    : [],

                status:
                  current.status ||
                  "draft",
              },

              archivedBy:
                "bankregx-expert",

              archivedAt:
                FieldValue.serverTimestamp(),
            }
          );

          newVersion =
            Number(
              current.version ||
                1
            ) + 1;

          const update = {
            version:
              newVersion,

            updatedAt:
              FieldValue.serverTimestamp(),
          };

          if (
            title !==
            undefined
          ) {
            const cleanedTitle =
              clean(title);

            if (
              !cleanedTitle
            ) {
              throw new Error(
                "Title cannot be empty"
              );
            }

            update.title =
              cleanedTitle;
          }

          if (
            guidance !==
            undefined
          ) {
            const cleanedGuidance =
              clean(
                guidance
              );

            if (
              !cleanedGuidance
            ) {
              throw new Error(
                "Expert principle cannot be empty"
              );
            }

            update.guidance =
              cleanedGuidance;
          }

          if (
            category !==
            undefined
          ) {
            update.category =
              clean(
                category
              ) ||
              "general";
          }

          if (
            subcategory !==
            undefined
          ) {
            update.subcategory =
              clean(
                subcategory
              );
          }

          if (
            tags !==
            undefined
          ) {
            update.tags =
              cleanArray(
                tags
              );
          }

          if (
            priority !==
            undefined
          ) {
            if (
              !ALLOWED_PRIORITIES.includes(
                priority
              )
            ) {
              throw new Error(
                "Invalid priority"
              );
            }

            update.priority =
              priority;
          }

          if (
            rationale !==
            undefined
          ) {
            update.rationale =
              clean(
                rationale
              );
          }

          if (
            appliesTo !==
            undefined
          ) {
            update.appliesTo =
              cleanArray(
                appliesTo
              );
          }

          if (
            status !==
            undefined
          ) {
            if (
              !ALLOWED_STATUSES.includes(
                status
              )
            ) {
              throw new Error(
                "Invalid status"
              );
            }

            update.status =
              status;
          }

          transaction.update(
            docRef,
            update
          );
        }
      );

      return res
        .status(200)
        .json({
          message:
            "Expert guidance updated successfully",

          id,

          version:
            newVersion,
        });
    } catch (error) {
      console.error(
        "Admin guidance PATCH failed:",
        error
      );

      if (
        error.code ===
        "NOT_FOUND"
      ) {
        return res
          .status(404)
          .json({
            message:
              "Expert guidance not found",
          });
      }

      return res
        .status(400)
        .json({
          message:
            error.message ||
            "Unable to update expert guidance",
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