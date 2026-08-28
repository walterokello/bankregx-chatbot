import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * BankRegX response feedback API
 *
 * Stores structured feedback on AI responses.
 *
 * IMPORTANT:
 * This endpoint does NOT create BankRegX expert guidance.
 * Expert guidance will be managed separately through an
 * authenticated Expert Studio.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method Not Allowed",
    });
  }

  const body = req.body || {};

  const {
    userId = "anonymous",
    question = "",
    aiResponse,
    feedback,
    feedbackType,
    correctedAnswer = "",
    rationale = "",
    category = "general",
    tags = [],
    responseId = null,
  } = body;

  try {
    if (!aiResponse) {
      return res.status(400).json({
        message: "aiResponse is required",
      });
    }

    /*
     * Backwards compatibility:
     *
     * The existing BankRegX interface may currently send:
     * {
     *   userId,
     *   aiResponse,
     *   feedback
     * }
     *
     * New versions can send feedbackType instead.
     */

    let normalizedFeedbackType = feedbackType;

    if (!normalizedFeedbackType && feedback) {
      const legacyFeedback = String(feedback).toLowerCase();

      if (
        legacyFeedback.includes("yes") ||
        legacyFeedback.includes("👍")
      ) {
        normalizedFeedbackType = "approve";
      } else if (
        legacyFeedback.includes("no") ||
        legacyFeedback.includes("👎")
      ) {
        normalizedFeedbackType = "reject";
      } else {
        normalizedFeedbackType = "legacy";
      }
    }

    if (!normalizedFeedbackType) {
      return res.status(400).json({
        message: "feedbackType or feedback is required",
      });
    }

    const allowedFeedbackTypes = [
      "approve",
      "correct",
      "reject",
      "legacy",
    ];

    if (!allowedFeedbackTypes.includes(normalizedFeedbackType)) {
      return res.status(400).json({
        message: "Invalid feedbackType",
      });
    }

    if (
      normalizedFeedbackType === "correct" &&
      !correctedAnswer.trim()
    ) {
      return res.status(400).json({
        message:
          "correctedAnswer is required when feedbackType is correct",
      });
    }

    const feedbackRecord = {
      responseId,
      userId,
      question,
      aiResponse,

      feedbackType: normalizedFeedbackType,

      correctedAnswer:
        normalizedFeedbackType === "correct"
          ? correctedAnswer.trim()
          : null,

      rationale:
        rationale && typeof rationale === "string"
          ? rationale.trim()
          : null,

      category:
        category && typeof category === "string"
          ? category.trim()
          : "general",

      tags: Array.isArray(tags) ? tags : [],

      source: "bankregx",

      status: "submitted",

      createdAt: FieldValue.serverTimestamp(),

      /*
       * Keep the original feedback value temporarily
       * so we retain compatibility with the existing UI.
       */
      legacyFeedback: feedback || null,
    };

    const docRef = await adminDb
      .collection("expert_feedback")
      .add(feedbackRecord);

    return res.status(200).json({
      message: "Feedback submitted successfully",
      feedbackId: docRef.id,
      feedbackType: normalizedFeedbackType,
    });
  } catch (error) {
    console.error("BankRegX feedback error:", error);

    /*
     * Error logging should never prevent the API
     * from returning the original error response.
     */
    try {
      await adminDb.collection("error_logs").add({
        userId: userId || "unknown",
        source: "feedback-api",
        errorMessage: error?.message || String(error),
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (loggingError) {
      console.error(
        "Unable to write feedback error log:",
        loggingError
      );
    }

    return res.status(500).json({
      message: "Error submitting feedback",
      error: error?.message || "Unknown error",
    });
  }
}