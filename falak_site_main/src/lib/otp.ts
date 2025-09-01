// Generic OTP / phone verification token helpers
// We avoid storing raw OTP codes; the MSG91 widget handles OTP delivery.

import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";

function getSecret() {
  const secret = process.env.OTP_JWT_SECRET;
  if (!secret) throw new Error("OTP_JWT_SECRET missing");
  return new TextEncoder().encode(secret);
}

export async function signPhoneVerifiedToken(phone: string) {
  return await new SignJWT({ phone, t: "phone_verified" })
    .setProtectedHeader({ alg: ALG })
    .setExpirationTime("30m")
    .sign(getSecret());
}

// Generic but typed payload return helper
// Caller should cast to a narrower interface.
export async function verifyJwt<T>(token: string): Promise<T> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as T;
}
