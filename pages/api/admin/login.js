import {
  createAdminSession,
  getAdminCookieName,
  verifyAdminKey,
} from "../../../lib/adminAuth";

export default function handler(
  req,
  res
) {
  if (
    req.method !== "POST"
  ) {
    return res
      .status(405)
      .json({
        message:
          "Method Not Allowed",
      });
  }

  const {
    adminKey,
  } = req.body || {};

  if (
    !verifyAdminKey(
      adminKey
    )
  ) {
    return res
      .status(401)
      .json({
        message:
          "Invalid admin credentials",
      });
  }

  const token =
    createAdminSession();

  const secure =
    process.env.NODE_ENV ===
    "production"
      ? "; Secure"
      : "";

  res.setHeader(
    "Set-Cookie",
    `${getAdminCookieName()}=${encodeURIComponent(
      token
    )}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`
  );

  return res
    .status(200)
    .json({
      authenticated: true,
    });
}