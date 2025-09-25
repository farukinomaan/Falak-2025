/*
 One-off maintenance script:
 - Find all User_passes where the pass is a proshow bundle (event_id IS NULL)
 - And the owning user is Non-MAHE (Users.mahe = false)
 - And the pass is NOT already the "Non MAHE BLR" pass
 - Then assign the "Non MAHE BLR" pass by updating passId (or deleting duplicate if already owned)

 Usage (PowerShell):
   # Uses .env automatically; you can still override via $env:VAR
   npm run fix:non-mahe-proshow

 Optional envs:
   DRY_RUN=1          -> only print what would change, do not update
   TARGET_PASS_NAME   -> overrides the default lookup name (default: Non-MAHE BLR)
*/

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (via .env or env vars)');
    process.exit(1);
  }
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
  const targetName = process.env.TARGET_PASS_NAME || 'Non-MAHE BLR';

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { 'X-Maintenance-Script': 'fix-non-mahe-proshow' } },
  });

  
  // 1) Locate target Non-MAHE proshow pass
  // Prefer lowercase 'passes' table; fallback to legacy 'Pass'
  let passQ = await supabase
    .from('passes')
    .select('id, pass_name, mahe, event_id')
    .ilike('pass_name', `${targetName}%`)
    .is('event_id', null)
    .eq('mahe', false);
  if (passQ.error) {
    // Retry legacy capitalization
    passQ = await supabase
      .from('Pass')
      .select('id, pass_name, mahe, event_id')
      .ilike('pass_name', `${targetName}%`)
      .is('event_id', null)
      .eq('mahe', false);
  }
  if (passQ.error) throw passQ.error;
  const candidates = passQ.data || [];
  if (candidates.length === 0) {
    console.error(`ERROR: Could not find a pass like '${targetName}%' with event_id IS NULL and mahe=false`);
    process.exit(1);
  }
  if (candidates.length > 1) {
    console.error('ERROR: Multiple Non-MAHE proshow passes matched. Specify TARGET_PASS_NAME to disambiguate.');
    candidates.forEach(p => console.error(`- ${p.id} :: ${p.pass_name}`));
    process.exit(1);
  }
  const targetPass = candidates[0];
  console.log(`Using target Non-MAHE pass: ${targetPass.pass_name} (${targetPass.id})`);

  // Helpers for detection via payment logs
  const statuses = [
    'Success','Paid','Completed','Successfull','Successfull payment','Successfull_payment',
    'success','paid','completed','successfull','successfull payment','successfull_payment'
  ];

  // 2) Determine candidate users directly from payment_logs (mirrors the admin endpoint)
  const onlyIdsEnv = (process.env.ONLY_USER_IDS || '').trim();
  const onlyUserIds = onlyIdsEnv ? onlyIdsEnv.split(',').map(s => s.trim()).filter(Boolean) : [];
  const orFilter = [
    'raw->>user_type.eq.NONMAHE',
    'raw->>userType.eq.NONMAHE',
    'raw->>user_status.eq.NONMAHE',
    'raw->>userStatus.eq.NONMAHE',
  ].join(',');
  let plq = supabase
    .from('payment_logs')
    .select('user_id')
    .in('status', statuses)
    .or(orFilter)
    .not('user_id', 'is', null)
    .limit(5000);
  if (onlyUserIds.length > 0) {
    plq = plq.in('user_id', onlyUserIds);
  }
  const candUsersRes = await plq;
  if (candUsersRes.error) throw candUsersRes.error;
  const nonMaheUsers = new Set((candUsersRes.data || []).map(r => r.user_id).filter(Boolean));
  console.log(`Detected ${nonMaheUsers.size} NONMAHE user(s) from payment_logs.`);

  // 3) For each candidate user, load their proshow ownerships (event_id null)
  const userIds = Array.from(nonMaheUsers);
  let proshowRows = [];
  if (userIds.length > 0) {
    const upQ = await supabase
      .from('User_passes')
      .select('id, userId, passId, passes:passId(id, pass_name, mahe, event_id)')
      .in('userId', userIds);
    if (upQ.error) throw upQ.error;
    proshowRows = (upQ.data || []).filter(r => r?.passes?.event_id == null);
  }
  console.log(`Found ${proshowRows.length} proshow ownership row(s) for NONMAHE users.`);

  // 4) Prepare rows to fix: any proshow pass not equal to target -> update; if both owned, delete MAHE
  const candidatesToFix = proshowRows.filter(r => r.passId !== targetPass.id);
  console.log(`Found ${candidatesToFix.length} user pass(es) to consider for fix.`);

  if (dryRun) {
    for (const r of candidatesToFix) {
      console.log(`DRY: user ${r.userId} :: ${r.passes?.pass_name || r.passId} -> ${targetPass.pass_name}`);
    }
    console.log('DRY RUN complete. No changes made.');
    return;
  }

  let updated = 0;
  let deleted = 0;
  for (const r of candidatesToFix) {
    // Check if user already owns the correct target pass
    const existing = await supabase
      .from('User_passes')
      .select('id')
      .eq('userId', r.userId)
      .eq('passId', targetPass.id)
      .maybeSingle();
    if (existing.error && existing.error.code !== 'PGRST116') {
      console.warn(`WARN: Skipping user ${r.userId} due to read error: ${existing.error.message}`);
      continue;
    }
    if (existing.data) {
      // Already has the correct one; delete the incorrect row
      const del = await supabase.from('User_passes').delete().eq('id', r.id);
      if (del.error) {
        console.warn(`WARN: Failed to delete row ${r.id}: ${del.error.message}`);
      } else { deleted++; }
      continue;
    }
    // Update passId in place to preserve ownership row id/QR linkages
    const up = await supabase
      .from('User_passes')
      .update({ passId: targetPass.id })
      .eq('id', r.id);
    if (up.error) {
      console.warn(`WARN: Failed to update row ${r.id}: ${up.error.message}`);
      continue;
    }
    updated++;

    // After updating, ensure no stray MAHE proshow remains for this user (cleanup duplicates)
    const stray = await supabase
      .from('User_passes')
      .select('id, passes:passId(mahe, event_id)')
      .eq('userId', r.userId);
    if (!stray.error && Array.isArray(stray.data)) {
      for (const s of stray.data) {
        const p = s?.passes;
        if (s && s.id && p && p.event_id == null && p.mahe === true) {
          const del = await supabase.from('User_passes').delete().eq('id', s.id);
          if (!del.error) deleted++; else console.warn(`WARN: Failed cleanup delete ${s.id}: ${del.error.message}`);
        }
      }
    }
  }

  console.log(`Done. Updated: ${updated}, Deleted dupes: ${deleted}`);
}

main().catch((e) => {
  console.error('FATAL:', e?.message || e);
  process.exit(1);
});
