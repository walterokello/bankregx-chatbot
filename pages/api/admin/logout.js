import {
  getAdminCookieName,
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

  const secure =
    process.env.NODE_ENV ===
    "production"
      ? "; Secure"
      : "";

  res.setHeader(
    "Set-Cookie",
    `${getAdminCookieName()}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`
  );

  return res
    .status(200)
    .json({
      authenticated: false,
    });
}