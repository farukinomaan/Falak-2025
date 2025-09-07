import { NextResponse } from "next/server";

// Deprecated endpoint placeholder. Use /api/otp/verify-direct or /api/otp/verify-widget instead.
export async function POST() {
	return NextResponse.json(
		{ ok: false, message: "verify_otp is deprecated. Use otp/verify-direct or otp/verify-widget." },
		{ status: 410 }
	);
}

export async function GET() {
	return NextResponse.json(
		{ ok: false, message: "verify_otp is deprecated. Use otp/verify-direct or otp/verify-widget." },
		{ status: 410 }
	);
}
