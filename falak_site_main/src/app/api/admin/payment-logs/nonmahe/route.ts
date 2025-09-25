import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/actions/supabaseClient";

interface PaymentLogRow {
  id: string;
  user_id: string | null;
  status: string | null;
  tracking_id?: string | null;
  order_id?: string | null;
  membership_type?: string | null;
  event_name?: string | null;
  event_type?: string | null;
  total_amount?: number | null;
  external_created_at?: string | null;
  raw?: Record<string, unknown> | null;
}

interface UserRowBasic {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  mahe?: boolean | null;
}

interface UserPassJoinedRow {
  userId: string;
  passId: string;
  passes?: { pass_name?: string | null; mahe?: boolean | null; event_id?: string | null } | null;
}

// GET /api/admin/payment-logs/nonmahe?dev_id=iLoveAkshit
// Security: requires dev_id exact match; do NOT expose publicly.
// Returns payment_logs rows where raw.user_type/user_status implies NONMAHE,
// joined with Users (basic) and their assigned passes (names).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const devId = searchParams.get("dev_id");
    if (devId !== "iLoveAkshit") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const supabase = getServiceClient();

    // Filter successful logs and those with NONMAHE marker in raw JSON
    const statuses = [
      "Success",
      "Paid",
      "Completed",
      "Successfull",
      "Successfull payment",
      "Successfull_payment",
    ];

    // First fetch candidate logs (limit to safe cap; can add pagination later)
    const orFilter = [
      "raw->>user_type.ilike.NONMAHE",
      "raw->>userType.ilike.NONMAHE",
      "raw->>user_status.ilike.NONMAHE",
      "raw->>userStatus.ilike.NONMAHE",
    ].join(",");

    const logsRes = await supabase
      .from("payment_logs")
      .select("id, user_id, status, tracking_id, order_id, membership_type, event_name, event_type, total_amount, external_created_at, raw")
      .in("status", statuses)
      .or(orFilter)
      .order("external_created_at", { ascending: false })
      .limit(1000);

  if (logsRes.error) return NextResponse.json({ ok: false, error: logsRes.error.message }, { status: 500 });
  const logs = (logsRes.data || []) as PaymentLogRow[];

    // Collect distinct user_ids
  const userIds = Array.from(new Set(logs.map((l) => l.user_id).filter((v): v is string => Boolean(v))));

    // Load basic user info
    const usersById = new Map<string, UserRowBasic>();
    if (userIds.length) {
      const u = await supabase
        .from("Users")
        .select("id, name, email, phone, mahe")
        .in("id", userIds);
      if (u.error) return NextResponse.json({ ok: false, error: u.error.message }, { status: 500 });
      for (const row of (u.data || []) as Array<{ id: string; name?: string | null; email?: string | null; phone?: string | null; mahe?: boolean | null }>) {
        usersById.set(row.id, { id: row.id, name: row.name ?? null, email: row.email ?? null, phone: row.phone ?? null, mahe: row.mahe ?? null });
      }
    }

    // Load assigned passes per user (names)
    const passesByUser = new Map<string, Array<{ passId: string; pass_name: string | null }>>();
    if (userIds.length) {
      const up = await supabase
        .from("User_passes")
        .select("userId, passId, passes:passId(pass_name, mahe, event_id)")
        .in("userId", userIds);
      if (up.error) return NextResponse.json({ ok: false, error: up.error.message }, { status: 500 });
      for (const row of (up.data || []) as UserPassJoinedRow[]) {
        const arr = passesByUser.get(row.userId) || [];
        arr.push({ passId: row.passId, pass_name: row.passes?.pass_name ?? null, ...(row.passes ? { mahe: row.passes.mahe ?? null, event_id: row.passes.event_id ?? null } : {}) });
        passesByUser.set(row.userId, arr);
      }
    }

    // Shape output
    const data = logs.map((l) => ({
      log: l,
      user: usersById.get(l.user_id as string) || null,
      assigned_passes: passesByUser.get(l.user_id as string) || [],
    }));

    return NextResponse.json({ ok: true, count: data.length, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "internal_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
