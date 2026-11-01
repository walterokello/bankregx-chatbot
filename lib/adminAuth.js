import crypto from "crypto";

const COOKIE_NAME = "bankregx_admin_session";

function getSessionSecret() {
  const secret =
    process.env.BANKREGX_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Missing BANKREGX_SESSION_SECRET"
    );
  }

  return secret;
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(
    value,
    "base64url"
  ).toString("utf8");
}

function sign(value) {
  return crypto
    .createHmac(
      "sha256",
      getSessionSecret()
    )
    .update(value)
    .digest("base64url");
}

function safeEqual(a, b) {
  const first =
    Buffer.from(String(a || ""));

  const second =
    Buffer.from(String(b || ""));

  if (
    first.length !==
    second.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    first,
    second
  );
}

export function verifyAdminKey(
  suppliedKey
) {
  const expected =
    process.env.BANKREGX_ADMIN_KEY;

  if (
    !expected ||
    !suppliedKey
  ) {
    return false;
  }

  return safeEqual(
    suppliedKey,
    expected
  );
}

export function createAdminSession() {
  const now =
    Math.floor(
      Date.now() / 1000
    );

  const payload = {
    role: "bankregx_admin",
    iat: now,
    exp:
      now +
      8 * 60 * 60,
  };

  const encoded =
    base64UrlEncode(
      JSON.stringify(payload)
    );

  const signature =
    sign(encoded);

  return `${encoded}.${signature}`;
}

export function verifyAdminSession(
  token
) {
  try {
    if (!token) {
      return false;
    }

    const [
      encoded,
      signature,
    ] = token.split(".");

    if (
      !encoded ||
      !signature
    ) {
      return false;
    }

    const expectedSignature =
      sign(encoded);

    if (
      !safeEqual(
        signature,
        expectedSignature
      )
    ) {
      return false;
    }

    const payload =
      JSON.parse(
        base64UrlDecode(
          encoded
        )
      );

    const now =
      Math.floor(
        Date.now() / 1000
      );

    if (
      payload.role !==
        "bankregx_admin" ||
      !payload.exp ||
      payload.exp <= now
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function getAdminSessionFromRequest(
  req
) {
  const rawCookie =
    req.headers.cookie || "";

  const cookies =
    Object.fromEntries(
      rawCookie
        .split(";")
        .map((part) =>
          part.trim()
        )
        .filter(Boolean)
        .map((part) => {
          const index =
            part.indexOf("=");

          if (index === -1) {
            return [
              part,
              "",
            ];
          }

          return [
            part.slice(
              0,
              index
            ),
            decodeURIComponent(
              part.slice(
                index + 1
              )
            ),
          ];
        })
    );

  return (
    cookies[
      COOKIE_NAME
    ] || null
  );
}

export function isAdminRequest(
  req
) {
  const token =
    getAdminSessionFromRequest(
      req
    );

  return verifyAdminSession(
    token
  );
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}