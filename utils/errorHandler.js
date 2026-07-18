// utils/errorHandler.js

import { addDoc, collection } from "../lib/firebase";

export async function logError(error, endpoint = "unknown") {
  console.error(`❌ Error in ${endpoint}:`, error);
  
  try {
    await addDoc(collection(db, "error_logs"), {
      errorMessage: error.message,
      stackTrace: error.stack || "No stack trace available",
      endpoint,
      timestamp: new Date().toISOString(),
    });
  } catch (loggingError) {
    console.error("❌ Failed to log error to Firestore:", loggingError);
  }
}
