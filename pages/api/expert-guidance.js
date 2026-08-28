import crypto from "crypto";
import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * BankRegX Expert Guidance API
 *
 * Purpose:
 * Stores BankRegX's approved, reusable expert methodology.
 *
 * This is deliberately separate from ordinary user feedback.
 *
 * Current MVP security:
 * - Requires BANKREGX_ADMIN_KEY
 * - Key must be supplied in x-bankregx-admin-key header
 *
 * Later:
 * - Replace admin-key access with authenticated Expert Studio roles.
 */

function isAuthorised(req) {
  const suppliedKey = req.headers["x-bankregx-admin-key"];
  const expectedKey = process.env.BANKREGX_ADMIN_KEY;

  if (!suppliedKey || !expectedKey) {
    return false;
  }

  try {
    const suppliedBuffer = Buffer.from(String(suppliedKey));
    const expectedBuffer = Buffer.from(String(expectedKey));

    if (suppliedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      suppliedBuffer,
      expectedBuffer
    );
  } catch (error) {
    console.error("Admin key validation error:", error);
    return false;
  }
}

function cleanTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag) => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!isAuthorised(req)) {
    return res.status(401).json({
      message: "Unauthorised",
    });
  }

  /*
   * GET
   *
   * Returns approved BankRegX expert guidance.
   *
   * Optional:
   * /api/expert-guidance?category=control_design
   */

  if (req.method === "GET") {
    try {
      const snapshot = await adminDb
        .collection("expert_guidance")
        .where("status", "==", "approved")
        .get();

      let guidance = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const requestedCategory =
        typeof req.query.category === "string"
          ? req.query.category.trim().toLowerCase()
          : null;

      if (requestedCategory) {
        guidance = guidance.filter(
          (item) => item.category === requestedCategory
        );
      }

      guidance.sort((a, b) => {
        const priorityOrder = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };

        return (
          (priorityOrder[b.priority] || 0) -
          (priorityOrder[a.priority] || 0)
        );
      });

      return res.status(200).json({
        count: guidance.length,
        guidance,
      });
    } catch (error) {
      console.error(
        "BankRegX expert guidance GET error:",
        error
      );

      return res.status(500).json({
        message: "Unable to retrieve expert guidance",
        error: error?.message || "Unknown error",
      });
    }
  }

  /*
   * POST
   *
   * Creates a new approved BankRegX expert principle.
   */

  if (req.method === "POST") {
    try {
      const {
        title,
        guidance,
        category = "general",
        subcategory = null,
        tags = [],
        priority = "medium",
        rationale = "",
        appliesTo = ["all"],
      } = req.body || {};

      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          message: "title is required",
        });
      }

      if (
        typeof guidance !== "string" ||
        !guidance.trim()
      ) {
        return res.status(400).json({
          message: "guidance is required",
        });
      }

      const allowedPriorities = [
        "low",
        "medium",
        "high",
        "critical",
      ];

      const normalizedPriority =
        typeof priority === "string"
          ? priority.trim().toLowerCase()
          : "medium";

      if (
        !allowedPriorities.includes(normalizedPriority)
      ) {
        return res.status(400).json({
          message:
            "priority must be low, medium, high or critical",
        });
      }

      const normalizedCategory =
        typeof category === "string" && category.trim()
          ? category.trim().toLowerCase()
          : "general";

      const normalizedSubcategory =
        typeof subcategory === "string" &&
        subcategory.trim()
          ? subcategory.trim().toLowerCase()
          : null;

      const normalizedAppliesTo = Array.isArray(appliesTo)
        ? appliesTo
            .filter(
              (item) => typeof item === "string"
            )
            .map((item) =>
              item.trim().toLowerCase()
            )
            .filter(Boolean)
            .slice(0, 20)
        : ["all"];

      /*
       * Generate the Firestore document first so its ID
       * can also form part of the human-readable
       * BankRegX guidance ID.
       */

      const docRef = adminDb
        .collection("expert_guidance")
        .doc();

      const guidanceId = `BRX-G-${docRef.id
        .slice(0, 8)
        .toUpperCase()}`;

      const record = {
        guidanceId,

        title: title.trim(),

        guidance: guidance.trim(),

        category: normalizedCategory,

        subcategory: normalizedSubcategory,

        tags: cleanTags(tags),

        priority: normalizedPriority,

        rationale:
          typeof rationale === "string" &&
          rationale.trim()
            ? rationale.trim()
            : null,

        appliesTo:
          normalizedAppliesTo.length > 0
            ? normalizedAppliesTo
            : ["all"],

        /*
         * Governance metadata
         */

        scope: "bankregx",

        status: "approved",

        source: "expert",

        createdBy: "bankregx-expert",

        version: 1,

        /*
         * These become useful later when BankRegX
         * starts retrieving guidance automatically.
         */

        usageCount: 0,

        lastUsedAt: null,

        createdAt: FieldValue.serverTimestamp(),

        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.set(record);

      return res.status(201).json({
        message:
          "Expert guidance created successfully",
        id: docRef.id,
        guidanceId,
      });
    } catch (error) {
      console.error(
        "BankRegX expert guidance POST error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to create expert guidance",
        error: error?.message || "Unknown error",
      });
    }
  }

  return res.status(405).json({
    message: "Method Not Allowed",
  });
}