"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getUserDetails, saListPasses, searchUsers, listPendingPaymentLogs, resolvePendingPaymentLog, type UserDetailsData, listUnresolvedTickets, markTicketSolved, adminManualFetchPayments, assignPassToTicket } from "@/lib/actions/adminAggregations";
import type { SearchUserRow } from "@/lib/actions/adminAggregations";

// Define a Pass summary type for this component
interface PassSummary { id: string; pass_name: string; enable?: boolean | null; status?: boolean | null }

export default function TicketAdminPanel() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchUserRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<UserDetailsData | null>(null);
  const [passes, setPasses] = useState<PassSummary[]>([]);
  // const [passToAssign, setPassToAssign] = useState<string>("");
  const [pending, setPending] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  type TicketRow = { id: string; userId?: string | null; category?: string | null; issue?: string | null; created_at?: string | null; solved?: boolean | null; reporter_name?: string | null; reporter_email?: string | null };
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvePass, setResolvePass] = useState<Record<string,string>>({});
  const [assigningTicket, setAssigningTicket] = useState<string | null>(null);
  const [ticketAssignPass, setTicketAssignPass] = useState<Record<string,string>>({});
  const [manualCheck, setManualCheck] = useState<Record<string, boolean>>({});
  const [manualPhone, setManualPhone] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualRows, setManualRows] = useState<any[] | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await listPendingPaymentLogs(150);
      if (!res.ok) toast.error(res.error);
      else setPending(res.data as any[]); // eslint-disable-line @typescript-eslint/no-explicit-any
    } finally { setLoadingPending(false); }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      const res = await listUnresolvedTickets(200);
      if (!res.ok) toast.error(res.error || 'Failed to load tickets');
      else setTickets(res.data as TicketRow[]);
    } catch {
      toast.error('Failed to load tickets');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const pr = await saListPasses();
      if (pr.ok) setPasses(((pr.data as unknown) as PassSummary[]).map((p) => ({ id: p.id, pass_name: p.pass_name, enable: p.enable, status: p.status })));
      await loadPending();
      await loadTickets();
    })();
  }, [loadPending, loadTickets]);

  async function runSearch() {
    const res = await searchUsers(q);
    if (!res.ok) toast.error(res.error);
    else setResults(res.data);
  }

  async function loadDetails(id: string) {
    setSelected(id);
    const res = await getUserDetails(id);
    if (!res.ok) toast.error(res.error);
    else setDetails(res.data);
  }

  // Removed: direct user pass assignment from search results

  async function resolve(paymentLogId: string) {
    const passId = resolvePass[paymentLogId];
    if (!passId) { toast.error('Select a pass'); return; }
    setResolvingId(paymentLogId);
    try {
      const res = await resolvePendingPaymentLog(paymentLogId, passId);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success('Mapped & granted');
        setPending(prev => prev.filter(p => p.payment_log_id !== paymentLogId));
      }
    } finally { setResolvingId(null); }
  }

  async function assignToTicket(ticketId: string) {
    const passId = ticketAssignPass[ticketId];
    if (!passId) { toast.error('Select a pass'); return; }
    setAssigningTicket(ticketId);
    try {
      const res = await assignPassToTicket(ticketId, passId);
      if (!res.ok) toast.error(res.error || 'Assign failed');
      else {
        toast.success('Pass assigned to ticket user');
        // reload tickets
        await loadTickets();
      }
    } finally { setAssigningTicket(null); }
  }

  async function resolveTicket(ticketId: string) {
    setResolvingId(ticketId);
    try {
  const res = await markTicketSolved(ticketId, !!manualCheck[ticketId]);
      if (!res.ok) toast.error(res.error || 'Failed to mark solved');
      else {
        toast.success('Ticket marked solved');
        setTickets(prev => prev.filter(t => t.id !== ticketId));
      }
    } finally { setResolvingId(null); }
  }

  async function manualFetch() {
    const p = manualPhone.trim();
    if (!p) { toast.error('Enter a phone number'); return; }
    setManualLoading(true);
    try {
      const res = await adminManualFetchPayments(p);
      if (!res.ok) {
        toast.error(res.error || 'Fetch failed');
        setManualRows(null);
      } else {
        setManualRows(res.data as any[]); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    } finally { setManualLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input placeholder="Search users by phone/email/reg_no" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
        <Button onClick={runSearch}>Search</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded border p-3">
          <div className="font-medium mb-2">Results</div>
          <ul className="divide-y">
            {results.map((r) => (
              <li key={r.id} className={`p-2 cursor-pointer ${selected === r.id ? "bg-muted" : ""}`} onClick={() => loadDetails(r.id)}>
                <div className="font-medium">{r.name || r.email}</div>
                <div className="text-sm text-muted-foreground">{r.phone} • {r.email}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border p-3">
          <div className="font-medium mb-2">User details</div>
          {!details ? (
            <div className="text-sm text-muted-foreground">Select a user</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="font-semibold">{details.user?.name}</div>
                <div className="text-sm text-muted-foreground">{details.user?.email} • {details.user?.phone}</div>
              </div>

              <div>
                <div className="font-medium">Passes</div>
                <ul className="list-disc pl-6 text-sm">
                  {(details.passes || []).map((p) => (
                    <li key={p.id}>{p.pass_name}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-medium">Teams</div>
                <ul className="list-disc pl-6 text-sm">
                  {(details.teams || []).map((t) => (
                    <li key={t.teamId}>{t.teamName} • {t.eventName} {t.isCaptain ? "(Captain)" : ""}</li>
                  ))}
                </ul>
              </div>

              {/* Removed: assign pass to user */}
            </div>
          )}
        </div>
      </div>

      <div className="rounded border p-4 space-y-3">
        <h2 className="font-medium">Manual Fetch</h2>
        <p className="text-sm text-muted-foreground">Lookup payments from the portal by phone (queries VERIFICATION_URL on the server).</p>
        <div className="flex gap-2 max-w-lg">
          <Input placeholder="Enter phone number" value={manualPhone} onChange={(e)=>setManualPhone(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && manualFetch()} />
          <Button onClick={manualFetch} disabled={manualLoading}>{manualLoading ? 'Looking up…' : 'Lookup'}</Button>
        </div>
        {manualRows && (
          manualRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No results found for this phone.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Tracking</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Membership</th>
                    <th className="py-2 pr-3">Event</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Created At</th>
                    <th className="py-2 pr-3">Mapped</th>
                    <th className="py-2 pr-3">Pass Id</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((r, idx) => (
                    <tr key={r.tracking_id || idx} className="border-b last:border-b-0">
                      <td className="py-2 pr-3 font-mono text-xs">{r.tracking_id || '—'}</td>
                      <td className="py-2 pr-3">{r.order_status || '—'}</td>
                      <td className="py-2 pr-3">{r.membership_type || '—'}</td>
                      <td className="py-2 pr-3">{r.event_name || '—'}</td>
                      <td className="py-2 pr-3">{r.event_type || '—'}</td>
                      <td className="py-2 pr-3">{r.total_amount ?? '—'}</td>
                      <td className="py-2 pr-3">{r.created_at || '—'}</td>
                      <td className="py-2 pr-3">{r.mapped ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-3 font-mono text-[11px]">{r.pass_id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <div className="rounded border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Pending Payment Logs (Unmapped)</h2>
          <Button variant="outline" onClick={loadPending} disabled={loadingPending}>{loadingPending ? 'Refreshing...' : 'Refresh'}</Button>
        </div>
        {pending.length === 0 && (
          <div className="text-sm text-muted-foreground">No pending payment logs 🎉</div>
        )}
        {pending.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Tracking</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Membership</th>
                  <th className="py-2 pr-3">Event</th>
                  <th className="py-2 pr-3">Event Type</th>
                  <th className="py-2 pr-3">Legacy Key</th>
                  <th className="py-2 pr-3">V2 Key</th>
                  <th className="py-2 pr-3">Assign Pass</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(row => (
                  <tr key={row.payment_log_id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 font-mono text-xs">{row.tracking_id || '—'}</td>
                    <td className="py-2 pr-3 text-xs">{row.user_id?.slice(0,8)}…</td>
                    <td className="py-2 pr-3">{row.membership_type || <span className="opacity-50">—</span>}</td>
                    <td className="py-2 pr-3">{row.event_name || <span className="opacity-50">—</span>}</td>
                    <td className="py-2 pr-3">{row.event_type || <span className="opacity-50">—</span>}</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">{row.legacy_key}</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">{row.v2_key}</td>
                    <td className="py-2 pr-3">
                      <select
                        className="h-8 w-40 rounded-md border bg-background"
                        value={resolvePass[row.payment_log_id]||''}
                        onChange={e => setResolvePass(prev => ({ ...prev, [row.payment_log_id]: e.target.value }))}
                      >
                        <option value="">Select pass</option>
                        {passes.filter(p => Boolean(p.enable ?? p.status)).map(p => (
                          <option key={p.id} value={p.id}>{p.pass_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <Button
                        size="sm"
                        onClick={() => resolve(row.payment_log_id)}
                        disabled={resolvingId === row.payment_log_id}
                      >
                        {resolvingId === row.payment_log_id ? 'Saving…' : 'Map + Grant'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Mapping creates whitelist entry then grants pass (idempotent). Ownership skipped if already granted.</p>
      </div>

      <div className="rounded border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Unresolved Tickets</h2>
          <Button variant="outline" onClick={loadTickets}>Refresh</Button>
        </div>
        {tickets.length === 0 && (
          <div className="text-sm text-muted-foreground">No unresolved tickets</div>
        )}
        {tickets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Manual Transcript Check</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Issue</th>
                  <th className="py-2 pr-3">Assign Pass</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 font-mono text-xs">{t.id.slice(0,8)}…</td>
                    <td className="py-2 pr-3 text-xs">{t.reporter_name ? t.reporter_name : (t.reporter_email ? t.reporter_email : (t.userId ? t.userId.slice(0,8)+'…' : <span className="opacity-50">—</span>))}</td>
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={!!manualCheck[t.id]}
                        onChange={(e) => setManualCheck(prev => ({ ...prev, [t.id]: e.target.checked }))}
                        aria-label={`Manual transcript check for ${t.id}`}
                      />
                    </td>
                    <td className="py-2 pr-3">{t.category || <span className="opacity-50">—</span>}</td>
                    <td className="py-2 pr-3">{t.issue || <span className="opacity-50">—</span>}</td>
                    <td className="py-2 pr-3">
                      <select
                        className="h-8 w-40 rounded-md border bg-background"
                        value={ticketAssignPass[t.id]||''}
                        onChange={e => setTicketAssignPass(prev => ({ ...prev, [t.id]: e.target.value }))}
                      >
                        <option value="">Select pass</option>
                        {passes.filter(p => Boolean(p.enable ?? p.status)).map(p => (
                          <option key={p.id} value={p.id}>{p.pass_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => assignToTicket(t.id)} disabled={assigningTicket === t.id}>{assigningTicket === t.id ? 'Assigning…' : 'Assign'}</Button>
                        <Button size="sm" variant="ghost" onClick={() => resolveTicket(t.id)} disabled={resolvingId === t.id}>{resolvingId === t.id ? 'Saving…' : 'Resolve'}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
