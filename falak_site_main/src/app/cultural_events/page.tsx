import Link from "next/link";
import { saListEvents } from "@/lib/actions/adminAggregations";

export const revalidate = 60;

export default async function CulturalEvents() {
  const res = await saListEvents();
  const events = res.ok ? (res.data as Array<{ id: string; sub_cluster: string; cluster_name?: string | null }>) : [];
  const cultural = events.filter((e) => (e.cluster_name || "").toLowerCase() === "cultural");
  const subs = Array.from(new Set(cultural.map((e) => e.sub_cluster)));
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Cultural Events</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subs.map((slug) => (
          <div key={slug} className="border rounded-lg p-4">
            <h2 className="text-xl font-medium mb-2">{slug}</h2>
            <Link className="inline-block mt-3 text-sm text-white bg-black px-3 py-1 rounded" href={`/cultural_events/${encodeURIComponent(slug)}`}>
              View {slug}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

