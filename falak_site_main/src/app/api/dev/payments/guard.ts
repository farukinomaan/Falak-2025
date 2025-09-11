import { NextRequest, NextResponse } from 'next/server';

// Enforces presence of custom development header dev_id: iLoveAkshit
// Returns a NextResponse with 403 if header missing/invalid, else null.
export function checkDevHeader(req: NextRequest) {
  const expected = 'iLoveAkshit';
  const value = req.headers.get('dev_id');
  if (value !== expected) {
    return NextResponse.json({ ok: false, error: 'dev_header_invalid' }, { status: 403 });
  }
  return null;
}
