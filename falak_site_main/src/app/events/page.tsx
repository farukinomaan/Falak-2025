import Link from "next/link";
import { saListEvents } from "@/lib/actions/adminAggregations";

export const revalidate = 60;

// Unified Events page: list every unique sub_cluster once (across all clusters) with its cluster shown.
export default async function EventsPage() {
  const res = await saListEvents();
  const events = res.ok ? (res.data as Array<{ id: string; sub_cluster: string; cluster_name?: string | null }>) : [];
  // Build Map sub_cluster -> representative cluster (first encountered, normalized label) & total events count
  const subMap = new Map<string, { clusterKey: string; clusterLabel: string; count: number }>();
  for (const e of events) {
    const sub = e.sub_cluster;
    if (!sub) continue;
    const cRaw = (e.cluster_name || "").trim();
    const cKey = cRaw.toLowerCase();
    const cLabel = cRaw ? cRaw.replace(/\b\w/g, (c) => c.toUpperCase()) : "Other";
    const existing = subMap.get(sub);
    if (existing) {
      existing.count += 1;
    } else {
      subMap.set(sub, { clusterKey: cKey, clusterLabel: cLabel, count: 1 });
    }
  }
  const subs = Array.from(subMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Events</h1>
        <p className="text-sm text-muted-foreground">All sub-clusters across Cultural &amp; Sports.</p>
      </header>
      {subs.length === 0 && <p className="text-sm text-muted-foreground">No events available.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subs.map(([slug, meta]) => (
          <div key={slug} className="border rounded-lg p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium mb-2 break-words">{slug}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-block px-2 py-0.5 rounded-full bg-black text-white text-[10px] tracking-wide uppercase">{meta.clusterLabel}</span>
                {meta.count} event{meta.count !== 1 && "s"}
              </p>
            </div>
            <Link
              className="inline-block mt-4 text-sm text-white bg-black px-3 py-1 rounded self-start"
              href={`/events/${encodeURIComponent(slug)}`}
            >
              View {slug}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
