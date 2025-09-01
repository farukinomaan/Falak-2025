import { NextResponse } from "next/server";
import { signPhoneVerifiedToken } from "@/lib/otp";

// Route to verify MSG91 widget access token server-side and mint an internal phoneVerificationToken
// Client sends: { accessToken: string }
// Response: { ok: true, phoneVerificationToken } OR { ok: false, error }

interface Msg91VerifyResponse {
  type?: string; // success / error
  message?: string;
  mobile?: string; // sometimes
  mobile_number?: string; // or sometimes
  data?: { mobile?: string; mobile_number?: string };
}

export async function POST(req: Request) {
  try {
    if (!process.env.MSG91_AUTH_KEY) {
      return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
    }
    const { accessToken } = await req.json();
    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ ok: false, error: "Missing accessToken" }, { status: 400 });
    }

    const res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ authkey: process.env.MSG91_AUTH_KEY, "access-token": accessToken }),
      cache: "no-store",
    });

    const data = (await res.json()) as Msg91VerifyResponse;
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data.message || "MSG91 verify failed" }, { status: 400 });
    }
    // Extract phone number; adapt to whichever field MSG91 returns
    const phone =
      data?.mobile ||
      data?.mobile_number ||
      data?.data?.mobile ||
      data?.data?.mobile_number;
    if (!phone) {
      return NextResponse.json({ ok: false, error: "Phone not present in response" }, { status: 400 });
    }
    // Normalize: ensure only digits, and if 10 digits assume Indian number
    const digits = phone.replace(/\D/g, "");
    let normalized = digits;
    if (digits.length === 10) normalized = "+91" + digits; // adjust to your target region
    if (!/^[+]?\d{10,15}$/.test(normalized)) {
      return NextResponse.json({ ok: false, error: "Invalid phone format" }, { status: 400 });
    }
    // Mint internal token
    const phoneVerificationToken = await signPhoneVerifiedToken(normalized);
    return NextResponse.json({ ok: true, phoneVerificationToken });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
