import { NextResponse } from "next/server";
import { SignJWT } from "jose";

// Direct MSG91 OTP send: expects body { phone: "98xxxxxxxx" }
// Env needed: MSG91_AUTH_KEY, MSG91_OTP_TEMPLATE_ID

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ ok: false, error: "Invalid phone" }, { status: 400 });
    }

    // --- HARD PRESENTATION SHORT-CIRCUIT (temporarily bypass MSG91) ---
    if (phone === '6397177067') {
      return NextResponse.json({ ok: true, presentation: true, bypass: true });
    }
    // -----------------------------------------------------------------

    // Presentation shortcut: skip external API for predefined phone
    if (process.env.PRESENTATION_MODE === 'true' && phone === (process.env.PRESENTATION_TEST_PHONE || '6397177067')) {
      return NextResponse.json({ ok: true, presentation: true });
    }

  const forceDev = process.env.FORCE_DEV_OTP === 'true';

  // Development fallback when template not configured OR forced
  if (forceDev || !process.env.MSG91_AUTH_KEY || !process.env.MSG91_OTP_TEMPLATE_ID) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ ok: false, error: "OTP template / auth key missing" }, { status: 500 });
      }
      if (!process.env.OTP_JWT_SECRET) {
        return NextResponse.json({ ok: false, error: "OTP_JWT_SECRET missing" }, { status: 500 });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const exp = Math.floor(Date.now() / 1000) + 5 * 60; // 5 min
      const devToken = await new SignJWT({ phone, code })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(exp)
        .sign(new TextEncoder().encode(process.env.OTP_JWT_SECRET));
      console.log("[DEV OTP]", phone, code);
      return NextResponse.json({ ok: true, dev: true, devToken });
    }

  // MSG91 logic commented out for presentation.
  return NextResponse.json({ ok: true, skipped: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
