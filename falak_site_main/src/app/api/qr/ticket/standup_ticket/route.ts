

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getServiceClient } from "@/lib/actions/supabaseClient";

function getSessionSecret() {
	const secret = process.env.GOOGLE_CLIENT_SECRET;
	if (!secret) throw new Error("GOOGLE_CLIENT_SECRET missing");
	return new TextEncoder().encode(secret);
}
function getAudience() {
	const aud = process.env.GOOGLE_CLIENT_ID || process.env.ADMIN_QR_GOOGLE_CLIENT_ID;
	if (!aud) throw new Error("GOOGLE_CLIENT_ID (or ADMIN_QR_GOOGLE_CLIENT_ID) missing");
	return aud;
}

async function authenticate(req: NextRequest) {
	const auth = req.headers.get("authorization") || req.headers.get("Authorization");
	if (!auth) return { ok: false as const, status: 401, error: "Missing Authorization header" };
	const parts = auth.split(/\s+/);
	const token = parts.length === 2 ? parts[1] : parts[0];
	if (!token) return { ok: false as const, status: 401, error: "Missing token" };
	try {
		const res = await jwtVerify(token, getSessionSecret(), { audience: getAudience(), issuer: 'falak-qr' });
		const payload = res.payload as Record<string, unknown>;
		if (!payload || payload['t'] !== 'qr_session') {
			return { ok: false as const, status: 401, error: 'Invalid token type' };
		}
		const phone = typeof payload?.phone === 'string' ? String(payload.phone) : undefined;
		const username = typeof payload?.username === 'string' ? String(payload.username) : undefined;
		const name = typeof payload?.name === 'string' ? String(payload.name) : undefined;
		if (!phone && !username) return { ok: false as const, status: 401, error: 'Token missing admin identity' };

		const supabase = getServiceClient();
		type AdminRow = { username: string | null; phone: string | null; name: string | null };
		let adminRow: AdminRow | null = null;
		if (phone) {
			const { data, error } = await supabase
				.from('ticket_admin_list')
				.select('username, phone, name')
				.eq('phone', phone)
				.limit(1);
			if (error) return { ok: false as const, status: 500, error: error.message };
			if (Array.isArray(data) && data.length) adminRow = data[0] as AdminRow;
		}
		if (!adminRow && username) {
			const { data, error } = await supabase
				.from('ticket_admin_list')
				.select('username, phone, name')
				.eq('username', username)
				.limit(1);
			if (error) return { ok: false as const, status: 500, error: error.message };
			if (Array.isArray(data) && data.length) adminRow = data[0] as AdminRow;
		}
		if (!adminRow) return { ok: false as const, status: 401, error: 'Unauthenticated' };

		return {
			ok: true as const,
			admin: {
				phone: adminRow?.phone ?? phone ?? null,
				username: adminRow?.username ?? username ?? null,
				name: adminRow?.name ?? name ?? null
			},
		};
	} catch {
		return { ok: false as const, status: 401, error: 'Invalid token' };
	}
}

export async function POST(req: NextRequest) {
	try {
		const authRes = await authenticate(req);
		if (!authRes.ok) return NextResponse.json({ ok: false, error: authRes.error }, { status: authRes.status });

		const { searchParams } = new URL(req.url);
		const userId = searchParams.get('userId');
		if (!userId) return NextResponse.json({ ok: false, error: 'userId param required' }, { status: 400 });

		const supabase = getServiceClient();

		// 1) Find Standup Show event id
		const { data: eventRow, error: evErr } = await supabase
			.from('Events')
			.select('id')
			.eq('name', 'Standup Show')
			.limit(1)
			.maybeSingle();
		if (evErr) return NextResponse.json({ ok: false, error: evErr.message }, { status: 500 });
		if (!eventRow?.id) return NextResponse.json({ ok: false, error: 'Standup Show event not found' }, { status: 404 });
		const eventId = eventRow.id as string;

		// 2) Verify user is captain for this event
		const { data: teamRow, error: teamErr } = await supabase
			.from('Teams')
			.select('id')
			.eq('captainId', userId)
			.eq('eventId', eventId)
			.limit(1)
			.maybeSingle();
		if (teamErr) return NextResponse.json({ ok: false, error: teamErr.message }, { status: 500 });
		if (!teamRow) return NextResponse.json({ ok: false, error: 'User has not registered  for Standup Show' }, { status: 404 });

		// 3) Check standup_cut idempotency
		const { data: existingCut, error: cutErr } = await supabase
			.from('standup_cut')
			.select('id, cut, cut_by, created_at')
			.eq('userId', userId)
			.limit(1)
			.maybeSingle();
		if (cutErr) return NextResponse.json({ ok: false, error: cutErr.message }, { status: 500 });
		if (existingCut) {
			return NextResponse.json({ ok: true, already: true, cut: !!existingCut.cut, cut_by: existingCut.cut_by ?? null });
		}

		// 4) Insert new cut record
		const { data: ins, error: insErr } = await supabase
			.from('standup_cut')
			.insert({ userId, cut: true, cut_by: authRes.admin?.phone || null })
			.select('id, cut, cut_by, created_at')
			.single();
		if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

		return NextResponse.json({ ok: true, cut: true, cut_by: ins?.cut_by ?? authRes.admin?.phone ?? null });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Server error';
		return NextResponse.json({ ok: false, error: msg }, { status: 500 });
	}
}

export const dynamic = 'force-dynamic';