"use client";

import { useEffect, useMemo, useState } from "react";
import { getTotals, getPassSalesByPass, getTeamsPerEvent, listUsersWithPurchasedPasses } from "@/lib/actions/adminAggregations";

export default function SuperAdminDashboard() {
  const [totals, setTotals] = useState<{ users: number; teams: number; passesSold: number } | null>(null);
  const [sales, setSales] = useState<Array<{ passId: string; pass_name: string; count: number }>>([]);
  const [teamsPerEvent, setTeamsPerEvent] = useState<Array<{ eventId: string; event_name: string; count: number }>>([]);
  const [buyers, setBuyers] = useState<Array<{ id: string; name: string; email: string; phone: string; passes: string[] }>>([]);

  useEffect(() => {
    (async () => {
      const [t, s, te, b] = await Promise.all([
        getTotals(),
        getPassSalesByPass(),
        getTeamsPerEvent(),
        listUsersWithPurchasedPasses(),
      ]);
      if (t.ok) setTotals(t.data);
      if (s.ok) setSales(s.data);
      if (te.ok) setTeamsPerEvent(te.data);
      if (b.ok) setBuyers(b.data);
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

      <div className="grid md:grid-cols-2 gap-6">
        <BarChart title="Pass sales" data={sales.map((s) => ({ label: s.pass_name, value: s.count }))} />
        <BarChart title="Teams per event" data={teamsPerEvent.map((t) => ({ label: t.event_name, value: t.count }))} />
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Users who bought passes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Passes</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.phone}</td>
                  <td className="p-2 flex flex-wrap gap-2">{u.passes.map((p) => (<span key={p} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{p}</span>))}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
