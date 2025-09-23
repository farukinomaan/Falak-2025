/*
This script migrates proshow passes owned by non-MAHE users to the "Non MAHE BLR" proshow pass.

Logic:
- Find the pass in Pass table where pass_name ilike 'Non MAHE BLR%'. Use the first match.
- Fetch all User_passes joined with Users & Pass meta to locate rows where:
  * Users.mahe = false (non-MAHE users)
  * Pass.event_id IS NULL (proshow bundle type)
  * Pass.mahe IS TRUE (MAHE proshow bundle) OR Pass.mahe IS NULL but it's a proshow pass you want to migrate away from
- For those rows, update User_passes.passId to the Non MAHE BLR pass id, if different.
- Skips users who already own the target pass.

Safety:
- Dry-run mode by default; pass --apply to perform updates.
- Prints a summary.

Run (Windows PowerShell):
  # In repo root
  cd falak_site_main
  # Dry run:
  npm exec ts-node -- ./scripts/migrate-proshow-to-nonmahe.ts
  # Apply changes:
  npm exec ts-node -- ./scripts/migrate-proshow-to-nonmahe.ts --apply

Environment:
- Requires SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL to be set (same as server environment).
*/

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`[migrate] Starting migrate-proshow-to-nonmahe (apply=${apply})`);

  // 1) Find the target "Non MAHE BLR" pass
  const targetQ = await supabase
    .from('Pass')
    .select('id, pass_name, event_id, mahe')
    .ilike('pass_name', 'Non MAHE BLR%')
    .limit(1)
    .maybeSingle();
  if (targetQ.error) throw new Error(`Failed to query target pass: ${targetQ.error.message}`);
  const targetPass = targetQ.data as { id: string; pass_name: string; event_id: string | null; mahe: boolean | null } | null;
  if (!targetPass) {
    console.error('Target pass not found: expected a pass with name starting "Non MAHE BLR"');
    process.exit(2);
  }
  console.log(`[migrate] Target pass: ${targetPass.pass_name} (${targetPass.id})`);

  // 2) Fetch candidates: non-MAHE users who own a MAHE proshow bundle
  // We join User_passes -> Users and Pass to filter precisely in one go.
  const q = await supabase
    .from('User_passes')
    .select('id, userId, passId, users:userId(mahe), passes:passId(event_id, mahe)')
    .limit(100000); // arbitrary large cap; adjust if needed
  if (q.error) throw new Error(`Failed to query user passes: ${q.error.message}`);

  type Row = {
    id: string; userId: string; passId: string;
    users: { mahe?: boolean | null } | null;
    passes: { event_id?: string | null; mahe?: boolean | null } | null;
  };
  const rows = (q.data || []) as Row[];
  const candidates = rows.filter(r => {
    const isNonMaheUser = r.users && r.users.mahe === false;
    const isProshowBundle = r.passes && (r.passes.event_id == null);
    const isMaheBundlePass = r.passes && r.passes.mahe === true; // strictly MAHE bundle
    return Boolean(isNonMaheUser && isProshowBundle && isMaheBundlePass);
  });

  console.log(`[migrate] Found ${candidates.length} candidate ownership rows`);

  // 3) Skip users who already own the target pass
  const userIds = Array.from(new Set(candidates.map(c => c.userId)));
  const alreadyQ = await supabase
    .from('User_passes')
    .select('userId, passId')
    .eq('passId', targetPass.id)
    .in('userId', userIds);
  if (alreadyQ.error) throw new Error(`Failed to query existing target ownerships: ${alreadyQ.error.message}`);
  const alreadyByUser = new Set(((alreadyQ.data || []) as { userId: string; passId: string }[]).map(r => r.userId));

  // 4) Prepare updates for remaining
  const toUpdate = candidates.filter(c => !alreadyByUser.has(c.userId) && c.passId !== targetPass.id);
  console.log(`[migrate] After excluding already-owners and same-pass, ${toUpdate.length} rows to update`);

  if (!apply) {
    console.log('[migrate] Dry run complete. Use --apply to perform updates.');
    process.exit(0);
  }

  let success = 0, failed = 0;
  // Consider doing this in small batches if the dataset is large
  for (const row of toUpdate) {
    const res = await supabase
      .from('User_passes')
      .update({ passId: targetPass.id })
      .eq('id', row.id);
    if (res.error) {
      failed++;
      console.warn(`[migrate] Failed for user ${row.userId} ownership ${row.id}: ${res.error.message}`);
    } else {
      success++;
    }
  }

  console.log(`[migrate] Done. Updated ${success}, failed ${failed}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
