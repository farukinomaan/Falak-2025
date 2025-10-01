import { randomBytes, createHmac, timingSafeEqual } from "crypto";
// NOTE: Legacy random QR token helpers retained for backward compatibility. New
// deterministic scheme encodes only the userId so scanning a single QR lets the
// external app fetch all passes for that user.

const DEFAULT_TOKEN_BYTES = 24; // 192-bit random

export function generateQrToken(): string {
  return randomBytes(DEFAULT_TOKEN_BYTES).toString("base64url");
}

export function signQrToken(token: string, secret: string): string {
  const mac = createHmac("sha256", secret).update(token).digest("base64url");
  return `${token}.${mac}`;
}

export function verifySignedQrToken(signed: string, secret: string): boolean {
  const [token, mac] = signed.split(".");
  if (!token || !mac) return false;
  const expected = createHmac("sha256", secret).update(token).digest();
  const provided = Buffer.from(mac, "base64url");
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

// New deterministic user QR token: UID:<userId>[.hash]
// If QR_SIGNING_SECRET present we append a short integrity hash (first 6 bytes of sha256(base+secret) in hex)
export function computeDeterministicUserQrToken(userId: string): string {
  const base = `UID:${userId}`;
  const secret = process.env.QR_SIGNING_SECRET || null;
  if (!secret) return base;
  try {
    const h = createHmac('sha256', secret).update(base).digest();
    const short = Array.from(h.slice(0,6)).map(b=>b.toString(16).padStart(2,'0')).join('');
    return `${base}.${short}`;
  } catch {
    return base; // fallback on any unexpected error
  }
}

// Per-pass deterministic variant to satisfy uniqueness constraints on qr_token while keeping
// the user identity easily extractable from the prefix. Format:
//   UID:<userId>[.hash].p<passIdPrefix>
// where passIdPrefix = first 6 hex chars of passId (stable, low collision risk across a user’s passes)
// (Per-pass deterministic variant removed in single-token rollback)
