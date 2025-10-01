"use client";

import { useEffect, useMemo, useState } from "react";
import { getTotals, getPassSalesByPass, getTeamsPerEvent, listUsersWithPurchasedPasses, listApprovalPendingTickets, saListPasses, approveTicketAndAssign, maintenanceFixNonMaheProshow } from "@/lib/actions/adminAggregations";

export default function SuperAdminDashboard() {
  const [totals, setTotals] = useState<{ users: number; teams: number; passesSold: number } | null>(null);
  const [sales, setSales] = useState<Array<{ passId: string; pass_name: string; count: number }>>([]);
  const [teamsPerEvent, setTeamsPerEvent] = useState<Array<{ eventId: string; event_name: string; count: number }>>([]);
  const [buyers, setBuyers] = useState<Array<{ id: string; name: string; email: string; phone: string; passes: string[] }>>([]);
  const [buyersShown, setBuyersShown] = useState(10);
  type ApprovalRow = { id: string; userId: string | null; category: string | null; issue: string | null; created_at: string | null; status: string | null; reporter_name: string | null; reporter_email: string | null; raised_by: string | null };
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [passes, setPasses] = useState<Array<{ id: string; pass_name: string; enable?: boolean | null; status?: boolean | null }>>([]);
  const [assignSel, setAssignSel] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [maintBusy, setMaintBusy] = useState<boolean>(false);
  const [maintSummary, setMaintSummary] = useState<null | { updated: number; deleted: number; scannedUsers: number; targetPass: string; dryRun?: boolean }>(null);

  useEffect(() => {
    (async () => {
      const [t, s, te, b, ap, ps] = await Promise.all([
        getTotals(),
        getPassSalesByPass(),
        getTeamsPerEvent(),
        listUsersWithPurchasedPasses(),
        listApprovalPendingTickets(200),
        saListPasses(),
      ]);
      if (t.ok) setTotals(t.data);
      if (s.ok) setSales(s.data);
      if (te.ok) setTeamsPerEvent(te.data);
      if (b.ok) setBuyers(b.data);
  if (ap.ok) setApprovals((ap.data as unknown as ApprovalRow[]) || []);
      if (ps.ok) setPasses(((ps.data as unknown) as Array<{ id: string; pass_name: string; enable?: boolean | null; status?: boolean | null }>) || []);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Overview</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <CardStat title="Users" value={totals?.users ?? 0} />
        <CardStat title="Teams" value={totals?.teams ?? 0} />
        <CardStat title="Passes Sold" value={totals?.passesSold ?? 0} />
      </div>

      

      

      

      <div className="space-y-3">
        <h3 className="font-medium">Approval Requests (From Ticket Admin)</h3>
        {approvals.length === 0 ? (
          <div className="text-sm text-muted-foreground">No approval pending tickets</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Ticket</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Raised By</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Issue</th>
                  <th className="p-2">Assign Pass</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((t) => (
                  <tr key={t.id} className="border-b">
                    <td className="p-2 font-mono text-xs">{t.id.slice(0,8)}…</td>
                    <td className="p-2">{t.reporter_name || t.reporter_email || t.userId?.slice(0,8) || '—'}</td>
                    <td className="p-2 text-xs">{t.raised_by || '—'}</td>
                    <td className="p-2">{t.category || '—'}</td>
                    <td className="p-2 max-w-md truncate" title={t.issue || undefined}>{t.issue || '—'}</td>
                    <td className="p-2">
                      <select className="h-8 w-44 rounded-md border bg-background" value={assignSel[t.id]||''} onChange={e => setAssignSel(prev => ({ ...prev, [t.id]: e.target.value }))}>
                        <option value="">Select pass</option>
                        {passes.filter(p => Boolean(p.enable ?? p.status)).map(p => (
                          <option key={p.id} value={p.id}>{p.pass_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <button className="px-3 py-1 rounded bg-primary text-black disabled:opacity-50" disabled={busy === t.id || !assignSel[t.id]} onClick={async ()=>{
                        if (!assignSel[t.id]) return;
                        setBusy(t.id);
                        try {
                          const res = await approveTicketAndAssign(t.id, assignSel[t.id]);
                          if (!res.ok) {
                            const errMsg: string = (res as { ok: false; error?: string }).error || 'Failed';
                            alert(errMsg);
                          } else {
                            setApprovals(prev => prev.filter(x => x.id !== t.id));
                          }
                        } finally { setBusy(null); }
                      }}>{busy === t.id ? 'Assigning…' : 'Assign + Resolve'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      <div className="grid md:grid-cols-2 gap-6">
        <BarChart title="Pass sales" data={sales.map((s) => ({ label: s.pass_name, value: s.count }))} />
        <BarChart title="Teams per event" data={teamsPerEvent.map((t) => ({ label: t.event_name, value: t.count }))} />
      </div>


      

      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">Maintenance</h3>
        <p className="text-sm text-muted-foreground max-w-prose">Normalize Non-MAHE proshow ownerships (idempotent). This wraps the previous manual script. Safe to run multiple times. Processes a bounded set of users per invocation.</p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            disabled={maintBusy}
            onClick={async ()=>{
              setMaintBusy(true); setMaintSummary(null);
              try {
                const res = await maintenanceFixNonMaheProshow(400, false);
                if (res.ok) setMaintSummary(res.data as { updated: number; deleted: number; scannedUsers: number; targetPass: string; dryRun?: boolean }); else alert(res.error || 'Failed');
              } finally { setMaintBusy(false); }
            }}
            className="px-3 py-1.5 rounded bg-primary text-black disabled:opacity-50 text-sm"
          >{maintBusy ? 'Running…' : 'Run Non-MAHE Proshow Fix'}</button>
          <button
            disabled={maintBusy}
            onClick={async ()=>{
              setMaintBusy(true); setMaintSummary(null);
              try {
                const res = await maintenanceFixNonMaheProshow(400, true);
                if (res.ok) setMaintSummary(res.data as { updated: number; deleted: number; scannedUsers: number; targetPass: string; dryRun?: boolean }); else alert(res.error || 'Failed');
              } finally { setMaintBusy(false); }
            }}
            className="px-3 py-1.5 rounded border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 text-sm"
          >Dry Run</button>
          {maintSummary && (
            <div className="text-xs bg-muted/30 px-3 py-2 rounded border">
              <div><strong>{maintSummary.dryRun ? 'Dry Run' : 'Result'}:</strong> updated {maintSummary.updated}, deleted {maintSummary.deleted}, scanned {maintSummary.scannedUsers} users → target {maintSummary.targetPass}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardStat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function BarChart({ title, data }: { title: string; data: Array<{ label: string; value: number }> }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="font-medium">{title}</div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <div className="w-32 truncate text-sm" title={d.label}>{d.label}</div>
            <div className="flex-1 h-3 bg-muted rounded">
              <div className="h-3 bg-primary rounded" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
            <div className="w-8 text-right text-sm">{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
