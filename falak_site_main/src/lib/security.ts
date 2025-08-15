import { randomBytes, createHmac, timingSafeEqual } from "crypto";

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
