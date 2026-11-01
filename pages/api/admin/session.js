import {
  isAdminRequest,
} from "../../../lib/adminAuth";

export default function handler(
  req,
  res
) {
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

  return res
    .status(200)
    .json({
      authenticated:
        isAdminRequest(req),
    });
}