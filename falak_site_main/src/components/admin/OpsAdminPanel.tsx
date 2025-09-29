"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Helper fetch wrappers
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: 'no-store', ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

interface EventLite { id: string; name: string | null }
interface RosterRow { userId: string; teamId: string; teamName: string | null; captain: boolean; name: string | null; email: string | null; phone: string | null; mahe: boolean; reg_no: string | null; college: string | null }
interface RosterResp { ok: true; data: { event: { id: string; name: string | null; start_time?: string | null; end_time?: string | null; date?: string | null; time?: string | null; venue?: string | null; enabled?: boolean | null; min_team_size?: number | null; max_team_size?: number | null }; roster: RosterRow[]; stats: { teamCount: number; participantCount: number; soldCount: number; colleges: string[] } } }
interface PassHoldersResp { ok: true; data: { rows: Array<{ userId: string; name: string | null; email: string | null; phone: string | null; mahe: boolean; reg_no: string | null; college: string | null }>; total: number } }

export default function OpsAdminPanel() {
  const [events, setEvents] = useState<EventLite[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [roster, setRoster] = useState<RosterResp['data'] | null>(null);
  const [holders, setHolders] = useState<PassHoldersResp['data'] | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<RosterRow | null>(null);
  const [editForm, setEditForm] = useState<{ reg_no: string }>({ reg_no: '' });
  // Remove deletion capability per new requirement

  // Load events once
  useEffect(() => {
    (async () => {
      try {
        const j = await api<{ ok: boolean; data?: EventLite[]; error?: string }>("/api/ops/events");
        if (j.ok && j.data) {
          setEvents(j.data);
          if (j.data.length) setEventId(j.data[0].id);
        } else toast.error(j.error || 'Failed to load events');
      } catch { toast.error('Load events failed'); }
    })();
  }, []);

  // Load roster + holders when event changes
  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    (async () => {
      try {
        const [rResp, hResp] = await Promise.all([
          api<RosterResp>(`/api/ops/event/${eventId}`).catch(async e => { throw new Error('roster:' + e.message); }),
          api<PassHoldersResp>(`/api/ops/event/${eventId}/holders`).catch(async e => { throw new Error('holders:' + e.message); })
        ]);
        setRoster(rResp.data);
        setHolders(hResp.data);
      } catch (e: unknown) {
        const msg: string = (e && typeof e === 'object' && 'message' in e) ? String((e as { message?: string }).message) : '';
        if (msg.startsWith('roster:')) {
          toast.error('Failed to load roster ' + msg.replace('roster:', '(') + ')');
        } else if (msg.startsWith('holders:')) {
          toast.error('Failed to load pass holders ' + msg.replace('holders:', '(') + ')');
        } else {
          toast.error('Failed to load roster');
        }
      } finally { setLoading(false); }
    })();
  }, [eventId]);

  const filteredRoster = useMemo(() => {
    if (!roster) return [] as RosterRow[];
    const term = search.trim().toLowerCase();
    if (!term) return roster.roster;
    return roster.roster.filter(r => (r.phone || '').toLowerCase().includes(term));
  }, [roster, search]);

  async function downloadExcel() {
    if (!roster) return;
    try {
      const XLSX = await import('xlsx');
      const rows = roster.roster.map(r => ({
        TeamID: r.teamId,
        TeamName: r.teamName || '',
        Captain: r.captain ? 'YES' : '',
        UserID: r.userId,
        Name: r.name || '',
        Email: r.email || '',
        Phone: r.phone ? r.phone : '',
        MAHE: r.mahe ? 'MAHE' : 'Non-MAHE',
        RegNo: r.reg_no ? r.reg_no : '-',
        College: r.college || '',
      }));
      // Force Excel to treat phone/reg as text using cell meta after sheet creation
      const ws = XLSX.utils.json_to_sheet(rows, { cellDates: false });
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      // Find column indexes for Phone & RegNo
      const headers = Object.keys(rows[0] || {});
      const phoneIdx = headers.indexOf('Phone');
      const regIdx = headers.indexOf('RegNo');
      for (let R = 1; R <= range.e.r; R++) { // start at 1 to skip header
        if (phoneIdx >= 0) {
          const addr = XLSX.utils.encode_cell({ r: R, c: phoneIdx });
          if (ws[addr]) ws[addr].t = 's';
        }
        if (regIdx >= 0) {
          const addr2 = XLSX.utils.encode_cell({ r: R, c: regIdx });
          if (ws[addr2]) ws[addr2].t = 's';
        }
      }
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Participants');
      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = (roster.event.name || 'event') + '_participants.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  }

  async function downloadTeamsOnly() {
    if (!roster) return;
    try {
      const XLSX = await import('xlsx');
      const teamsMap: Record<string, { teamName: string | null; captainId: string | null; captainName: string | null; memberCount: number }> = {};
      for (const r of roster.roster) {
        if (!teamsMap[r.teamId]) teamsMap[r.teamId] = { teamName: r.teamName, captainId: null, captainName: null, memberCount: 0 };
        if (r.captain) {
          teamsMap[r.teamId].captainId = r.userId;
          teamsMap[r.teamId].captainName = r.name;
        } else {
          teamsMap[r.teamId].memberCount += 1;
        }
      }
      const rows = Object.entries(teamsMap).map(([teamId, t]) => ({
        TeamID: teamId,
        TeamName: t.teamName || '',
        CaptainUserID: t.captainId || '',
        CaptainName: t.captainName || '',
        MembersCount: t.memberCount,
        TotalParticipants: (t.memberCount + (t.captainId ? 1 : 0)),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Teams');
      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = (roster.event.name || 'event') + '_teams.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  }

  async function deactivate() {
    if (!eventId) return;
    if (!confirm('Deactivate this event?')) return;
    try {
      const j = await api<{ ok: boolean; data?: { id: string; enabled: boolean } | undefined; error?: string }>(`/api/ops/event/${eventId}/deactivate`, { method: 'POST' });
      if (!j.ok) toast.error(j.error || 'Failed'); else { toast.success('Event deactivated'); setRoster(r => r ? { ...r, event: { ...r.event, enabled: false } } : r); }
    } catch { toast.error('Failed to deactivate'); }
  }

  function formatEventDate() {
    if (!roster) return '-';
    if (roster.event.start_time) return new Date(roster.event.start_time).toLocaleString();
    // fallback if separate date/time columns provided
    const { date, time } = roster.event as { date?: string | null; time?: string | null };
    if (date && time) return `${date} ${time}`;
    if (date) return date;
    return '-';
  }
  function formatEventEnd() {
    if (!roster) return '-';
    if (roster.event.end_time) return new Date(roster.event.end_time).toLocaleString();
    return '-';
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Ops Admin – Event Participants</h2>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm mb-1">Select Event</label>
          <select value={eventId} onChange={e => setEventId(e.target.value)} className="px-3 py-2 rounded border bg-black/40">
            {events.map(ev => <option value={ev.id} key={ev.id}>{ev.name || ev.id}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Search by Phone</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Phone contains..." className="px-3 py-2 rounded border w-48 bg-black/40" />
        </div>
        <button onClick={downloadExcel} className="px-4 py-2 rounded bg-[#b46868] hover:bg-[#c98a8a] text-sm font-medium border border-[#d79f9f]">Download All Participants Excel</button>
        <button onClick={downloadTeamsOnly} className="px-4 py-2 rounded bg-[#b46868] hover:bg-[#c98a8a] text-sm font-medium border border-[#c98a8a]">Download Teams Only Excel</button>
        {roster?.event.enabled ? (
          <button onClick={deactivate} disabled={!roster} className="px-4 py-2 rounded bg-red-600 disabled:opacity-40 text-sm font-medium">Deactivate Event</button>
        ) : (
          <button onClick={async ()=>{
            if (!eventId) return; if (!confirm('Activate this event?')) return;
            try {
              const j = await api<{ ok: boolean; data?: { id: string; enabled: boolean }; error?: string }>(`/api/ops/event/${eventId}/activate`, { method: 'POST' });
              if (!j.ok) toast.error(j.error || 'Failed'); else { toast.success('Event activated'); setRoster(r => r ? { ...r, event: { ...r.event, enabled: true } } : r); }
            } catch { toast.error('Failed to activate'); }
          }} className="px-4 py-2 rounded bg-green-600 disabled:opacity-40 text-sm font-medium">Activate Event</button>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {!loading && roster && (
        <>
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#5e2f2f]/80 via-[#7d4242]/70 to-[#1e0f0f]/60 border border-[#d79f9f]/50 backdrop-blur text-sm w-full shadow-[0_0_0_1px_#532626,0_4px_20px_-4px_rgba(168,92,92,0.45)]">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight">{roster.event.name || 'Event'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-2 text-xs md:text-sm">
                  <div><span className="opacity-60">Teams</span><div className="font-medium text-base md:text-lg">{roster.stats.teamCount}</div></div>
                  <div><span className="opacity-60">Participants</span><div className="font-medium text-base md:text-lg">{roster.stats.participantCount}</div></div>
                  <div><span className="opacity-60">Passes Sold</span><div className="font-medium text-base md:text-lg">{roster.stats.soldCount}</div></div>
                  <div><span className="opacity-60">Enabled</span><div className="font-medium text-base md:text-lg">{roster.event.enabled ? 'Yes' : 'No'}</div></div>
                  <div><span className="opacity-60">Start</span><div>{formatEventDate()}</div></div>
                  <div><span className="opacity-60">End</span><div>{formatEventEnd()}</div></div>
                  <div><span className="opacity-60">Venue</span><div>{roster.event.venue || '-'}</div></div>
                  <div><span className="opacity-60">Team Size</span><div>{(roster.event.min_team_size ?? '') === '' || roster.event.min_team_size == null ? '?' : roster.event.min_team_size} - {(roster.event.max_team_size ?? '') === '' || roster.event.max_team_size == null ? '?' : roster.event.max_team_size}</div></div>
                </div>
              </div>
              <div className="max-h-40 overflow-auto border rounded p-3 bg-[#3d1f1f]/50 w-full md:w-72 text-xs border-[#a85c5c]/60">
                <div className="font-semibold mb-2">Colleges ({roster.stats.colleges.length})</div>
                {roster.stats.colleges.length ? (
                  <ul className="space-y-1 list-disc list-inside">
                    {roster.stats.colleges.map(c => <li key={c}>{c}</li>)}
                  </ul>
                ) : <p className="opacity-60">None</p>}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/10">
                  <th className="p-2 text-left">Captain</th>
                  <th className="p-2 text-left">Team</th>
                  <th className="p-2 text-left">Team ID</th>
                  <th className="p-2 text-left">User ID</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Phone</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">MAHE</th>
                  <th className="p-2 text-left">Reg No</th>
                  <th className="p-2 text-left">College</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map(r => (
                  <tr key={r.userId + r.teamId} className={r.captain ? 'bg-amber-800/10' : ''}>
                    <td className="p-2 font-semibold">{r.captain ? '★' : ''}</td>
                    <td className="p-2">{r.teamName || '-'}</td>
                    <td className="p-2">{r.teamId}</td>
                    <td className="p-2">{r.userId}</td>
                    <td className="p-2">{r.name || '-'}</td>
                    <td className="p-2">{r.phone || '-'}</td>
                    <td className="p-2">{r.email || '-'}</td>
                    <td className="p-2">{r.mahe ? 'MAHE' : 'Non'}</td>
                    <td className="p-2">{r.reg_no || '-'}</td>
                    <td className="p-2">{r.college || '-'}</td>
                    <td className="p-2 space-x-2">
                      <button onClick={() => { setEditing(r); setEditForm({ reg_no: r.reg_no || '' }); }} className="px-2 py-1 rounded bg-[#8452b4]/80 hover:bg-[#9e6cd0] text-xs">Edit</button>
                    </td>
                  </tr>
                ))}
                {filteredRoster.length === 0 && (
                  <tr><td colSpan={11} className="p-4 text-center opacity-60">No participants match search.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {holders && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium mt-8">Pass Holders Without Team (Total: {holders.total})</h3>
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/10">
                      <th className="p-2 text-left">User ID</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Phone</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">MAHE</th>
                      <th className="p-2 text-left">Reg No</th>
                      <th className="p-2 text-left">College</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.rows.map(r => (
                      <tr key={r.userId}>
                        <td className="p-2">{r.userId}</td>
                        <td className="p-2">{r.name || '-'}</td>
                        <td className="p-2">{r.phone || '-'}</td>
                        <td className="p-2">{r.email || '-'}</td>
                        <td className="p-2">{r.mahe ? 'MAHE' : 'Non'}</td>
                        <td className="p-2">{r.reg_no || '-'}</td>
                        <td className="p-2">{r.college || '-'}</td>
                      </tr>
                    ))}
                    {holders.rows.length === 0 && <tr><td colSpan={7} className="p-4 text-center opacity-60">None</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="bg-[#2c1515] border border-[#a85c5c] rounded p-6 w-full max-w-md space-y-4 shadow-[0_0_0_1px_#532626,0_6px_24px_-6px_rgba(168,92,92,0.5)]">
                <h4 className="text-lg font-semibold text-[#f5eaea]">Edit Registration Number</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs uppercase tracking-wide opacity-70 mb-1">Reg No</label>
                    <input value={editForm.reg_no} onChange={e => setEditForm({ reg_no: e.target.value })} className="w-full px-3 py-2 rounded bg-[#4a2323] border border-[#c98a8a]/60 focus:outline-none focus:ring-2 focus:ring-[#c98a8a]" />
                  </div>
                  <p className="text-xs opacity-60">Only registration number can be changed here.</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => { setEditing(null); }} className="px-3 py-2 text-xs rounded bg-[#4a2323] border border-[#7d4242] hover:bg-[#5e2f2f]">Cancel</button>
                  <button onClick={async () => {
                    if (!editing) return;
                    try {
                      const res = await fetch(`/api/ops/user/${editing.userId}/regno`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reg_no: editForm.reg_no }) });
                      const j = await res.json();
                      if (!j.ok) throw new Error(j.error || 'Failed');
                      setRoster(r => r ? { ...r, roster: r.roster.map(row => row.userId === editing.userId ? { ...row, reg_no: editForm.reg_no } : row) } : r);
                      toast.success('Updated');
                      setEditing(null);
                    } catch (e: unknown) { const msg = (e && typeof e === 'object' && 'message' in e) ? (e as { message?: string }).message : ''; toast.error('Save failed: ' + (msg || '')); }
                  }} className="px-3 py-2 text-xs rounded bg-[#b46868] hover:bg-[#c98a8a] border border-[#d79f9f] text-black font-medium">Save</button>
                </div>
              </div>
            </div>
          )}

          {/* Deletion removed by policy */}
        </>
      )}
    </div>
  );
}
