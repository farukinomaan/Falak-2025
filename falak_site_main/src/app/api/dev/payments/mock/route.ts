import { NextRequest, NextResponse } from 'next/server';
import { __setMockPaymentDocs, ingestAndListUserPasses } from '@/lib/actions/payments';

interface MockDoc {
  tracking_id: string;
  orderid: string;
  order_status: string;
  membership_type: string;
  event_name: string;
  total_amount: number;
  created_at: string;
  event_type?: string;
}

// Simple in-memory scenario definitions
const scenarios: Record<string, () => MockDoc[]> = {
  proshowBundle: () => ([{
    tracking_id: 'MOCK-PROSHOW-1',
    orderid: 'MOCK-PROSHOW-1',
    order_status: 'Success',
    membership_type: 'Proshow',
    event_name: 'All Access',
    total_amount: 499,
    created_at: new Date().toISOString(),
  }]),
  esports: () => ([{
    tracking_id: 'MOCK-ESPORTS-1',
    orderid: 'MOCK-ESPORTS-1',
    order_status: 'Success',
    membership_type: 'Esports',
    event_name: 'Qualifier',
    event_type: 'ESPORTS',
    total_amount: 299,
    created_at: new Date().toISOString(),
  }]),
};

function denyProd() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'disabled in production' }, { status: 404 });
  }
  return null;
}

// Enable mock: POST /api/dev/payments/mock?scenario=esports OR send body {docs:[...]}
export async function POST(req: NextRequest) {
  const deny = denyProd(); if (deny) return deny;
  let docs: MockDoc[] | null = null;
  const scenario = req.nextUrl.searchParams.get('scenario') || 'proshowBundle';
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json();
      if (Array.isArray(body?.docs)) {
        docs = body.docs as MockDoc[];
      }
    }
  } catch {/* ignore body parse */}
  if (!docs) {
    const factory = scenarios[scenario];
    docs = factory ? factory() : scenarios.proshowBundle();
  }
  __setMockPaymentDocs(docs);
  return NextResponse.json({ ok: true, enabled: true, count: docs.length, scenario });
}

// Run ingestion now (GET) while mock active
export async function GET(req: NextRequest) {
  const deny = denyProd(); if (deny) return deny;
  const devUserId = req.nextUrl.searchParams.get('devUserId') || undefined;
  const res = await ingestAndListUserPasses({ devUserId });
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}

// Disable mock
export async function DELETE() {
  const deny = denyProd(); if (deny) return deny;
  __setMockPaymentDocs(null);
  return NextResponse.json({ ok: true, enabled: false });
}

export const revalidate = 0;
