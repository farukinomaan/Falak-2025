"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { assignPassToUser, getUserDetails, saListPasses, searchUsers, type UserDetailsData } from "@/lib/actions/adminAggregations";
import type { SearchUserRow } from "@/lib/actions/adminAggregations";

// Define a Pass summary type for this component
interface PassSummary { id: string; pass_name: string; enable?: boolean | null; status?: boolean | null }

export default function TicketAdminPanel() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchUserRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<UserDetailsData | null>(null);
  const [passes, setPasses] = useState<PassSummary[]>([]);
  const [passToAssign, setPassToAssign] = useState<string>("");

  useEffect(() => {
    (async () => {
      const pr = await saListPasses();
      if (pr.ok) setPasses(((pr.data as unknown) as PassSummary[]).map((p) => ({ id: p.id, pass_name: p.pass_name, enable: p.enable, status: p.status })));
    })();
  }, []);

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

  async function assign() {
    if (!selected || !passToAssign) return;
    const res = await assignPassToUser(selected, passToAssign);
    if (!res.ok) toast.error(res.error);
    else toast.success("Pass assigned");
    // refresh details
    if (selected) loadDetails(selected);
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

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <div className="text-sm mb-1">Assign pass</div>
                  <select value={passToAssign} onChange={(e) => setPassToAssign(e.target.value)} className="w-full h-9 rounded-md border px-3">
                    <option value="">Select a pass</option>
                    {passes.filter((p) => Boolean(p.enable ?? p.status)).map((p) => (
                      <option key={p.id} value={p.id}>{p.pass_name}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={assign}>Assign</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
