import { NextResponse } from "next/server";
import { signPhoneVerifiedToken } from "@/lib/otp";
import { jwtVerify } from "jose";

// Direct MSG91 OTP verify: body { phone: "98xxxxxxxx", otp: "123456" }

export async function POST(req: Request) {
  try {
    const { phone, otp, devToken } = await req.json();
    if (!/^\d{10}$/.test(phone)) {
      console.log("[OTP VERIFY] invalid phone format", phone);
      return NextResponse.json({ ok: false, error: "Invalid phone" }, { status: 400 });
    }

    // --- HARD PRESENTATION SHORT-CIRCUIT ---
    if (phone === '6397177067' && otp === '123456') {
      const phoneVerificationToken = await signPhoneVerifiedToken("+91" + phone);
      return NextResponse.json({ ok: true, phoneVerificationToken, bypass: true });
    }
    // ---------------------------------------

    // Presentation shortcut
    if (process.env.PRESENTATION_MODE === 'true') {
      const presetPhone = process.env.PRESENTATION_TEST_PHONE || '6397177067';
      const presetOtp = process.env.PRESENTATION_TEST_OTP || '123456';
      if (phone === presetPhone && otp === presetOtp) {
        const phoneVerificationToken = await signPhoneVerifiedToken("+91" + phone);
        return NextResponse.json({ ok: true, phoneVerificationToken, presentation: true });
      }
    }

    // Dev path (no MSG91 credentials): verify otp against devToken payload
    if ((!process.env.MSG91_AUTH_KEY || !process.env.MSG91_OTP_TEMPLATE_ID) && process.env.NODE_ENV !== "production") {
      if (!process.env.OTP_JWT_SECRET) {
        return NextResponse.json({ ok: false, error: "OTP_JWT_SECRET missing" }, { status: 500 });
      }
      if (!devToken) {
        console.log("[OTP VERIFY] missing devToken for phone", phone);
        return NextResponse.json({ ok: false, error: "Missing dev token (resend OTP)" }, { status: 400 });
      }
      try {
        const { payload } = await jwtVerify(devToken, new TextEncoder().encode(process.env.OTP_JWT_SECRET));
        if (payload.phone !== phone) {
          console.log("[OTP VERIFY] phone mismatch", payload.phone, phone);
          return NextResponse.json({ ok: false, error: "Phone mismatch (resend)" }, { status: 400 });
        }
        if (!otp || payload.code !== otp) {
          console.log("[OTP VERIFY] otp mismatch expected vs got", payload.code, otp);
          return NextResponse.json({ ok: false, error: "Invalid OTP" }, { status: 400 });
        }
        const phoneVerificationToken = await signPhoneVerifiedToken("+91" + phone);
        return NextResponse.json({ ok: true, phoneVerificationToken });
      } catch {
        console.log("[OTP VERIFY] invalid dev token decode failure");
        return NextResponse.json({ ok: false, error: "Invalid dev token" }, { status: 400 });
      }
    }

    // Real MSG91 path
    if (!process.env.MSG91_AUTH_KEY) {
      return NextResponse.json({ ok: false, error: "Server config missing" }, { status: 500 });
    }
    if (!/^\d{4,8}$/.test(otp)) {
      console.log("[OTP VERIFY] otp format invalid", otp);
      return NextResponse.json({ ok: false, error: "Invalid OTP format" }, { status: 400 });
    }
    const mobile = "91" + phone;
    const res = await fetch(`https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=${encodeURIComponent(mobile)}`, {
      method: "POST",
      headers: { authkey: process.env.MSG91_AUTH_KEY, Accept: "application/json" },
    });
    const data = await res.json();
    if (!res.ok || data?.type === "error") {
      return NextResponse.json({ ok: false, error: data?.message || "Invalid OTP" }, { status: 400 });
    }
    const phoneVerificationToken = await signPhoneVerifiedToken("+91" + phone);
    return NextResponse.json({ ok: true, phoneVerificationToken });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
