import crypto from "crypto";

const SESSION_COOKIE = "bdh_admin_session";
const SESSION_DURATION = 60 * 60 * 8; // 8 hours

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }

  return secret;
}

function createSignature(payload) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
}

export function createSessionToken(userId) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;

  const payload = `${userId}.${expiresAt}`;
  const signature = createSignature(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [userId, expiresAt, signature] = parts;

  const payload = `${userId}.${expiresAt}`;

  const expectedSignature = createSignature(payload);

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  ) {
    return null;
  }

  const expiration = Number(expiresAt);

  if (!Number.isFinite(expiration)) {
    return null;
  }

  if (expiration <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    userId,
    expiresAt: expiration,
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionDuration() {
  return SESSION_DURATION;
}
