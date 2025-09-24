/*
 One-off maintenance script:
 - Find all User_passes where the pass is a proshow bundle (event_id IS NULL)
 - And the owning user is Non-MAHE (Users.mahe = false)
 - And the pass is NOT already the "Non MAHE BLR" pass
 - Then assign the "Non MAHE BLR" pass by updating passId (or deleting duplicate if already owned)

 Usage (PowerShell):
   $env:SUPABASE_URL="https://..."; $env:SUPABASE_SERVICE_ROLE_KEY="..."; node scripts/fix-non-mahe-proshow.js

 Optional envs:
   DRY_RUN=1          -> only print what would change, do not update
   TARGET_PASS_NAME   -> overrides the default lookup name (default: Non MAHE BLR)
*/

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
  const targetName = process.env.TARGET_PASS_NAME || 'Non-MAHE BLR';

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { 'X-Maintenance-Script': 'fix-non-mahe-proshow' } },
  });

  // 1) Locate target Non-MAHE proshow pass
  const passQ = await supabase
    .from('Pass')
    .select('id, pass_name, mahe, event_id')
    .ilike('pass_name', `${targetName}%`)
    .is('event_id', null)
    .eq('mahe', false);
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

  // 2) Fetch all user passes referencing any proshow pass (event_id null), where user is non-MAHE, and pass != target
  const upQ = await supabase
    .from('User_passes')
    .select('id, userId, passId, passes:passId(id, pass_name, mahe, event_id), users:userId(id, mahe)')
    .neq('passId', targetPass.id);
  if (upQ.error) throw upQ.error;
  const all = Array.isArray(upQ.data) ? upQ.data : [];
  const candidatesToFix = all.filter(r => {
    const pass = r.passes || {};
    const user = r.users || {};
    // proshow bundle => event_id null; user non-MAHE; not already target pass
    return (pass.event_id == null) && (user.mahe === false);
  });
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
  }

  console.log(`Done. Updated: ${updated}, Deleted dupes: ${deleted}`);
}

main().catch((e) => {
  console.error('FATAL:', e?.message || e);
  process.exit(1);
});
