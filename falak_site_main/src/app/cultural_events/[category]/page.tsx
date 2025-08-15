import { notFound } from "next/navigation";
import Link from "next/link";
import { saListEvents } from "@/lib/actions/adminAggregations";

export const dynamicParams = false;

export async function generateStaticParams() {
  const res = await saListEvents();
  const events = res.ok ? (res.data as Array<{ sub_cluster: string; cluster_name?: string | null }>) : [];
  const cultural = events.filter((e) => (e.cluster_name || "").toLowerCase() === "cultural");
  const subs = Array.from(new Set(cultural.map((e) => e.sub_cluster)));
  return subs.map((s) => ({ category: s }));
}

export default async function CulturalCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const res = await saListEvents();
  const events = res.ok ? (res.data as Array<{ id: string; name: string; description?: string | null; venue: string; sub_cluster: string; cluster_name?: string | null }>) : [];
  const cultural = events.filter((e) => (e.cluster_name || "").toLowerCase() === "cultural");
  const list = cultural.filter((e) => e.sub_cluster === category);
  if (list.length === 0) return notFound();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{category}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((e) => (
          <div key={e.id} className="border rounded-lg p-4 space-y-1">
            <h2 className="text-lg font-medium">{e.name}</h2>
            {e.description && <p className="text-sm text-gray-600">{e.description}</p>}
            <p className="text-sm">Venue: {e.venue}</p>
            <Link
              className="inline-block mt-2 text-sm text-white bg-black px-3 py-1 rounded"
              href={`/cultural_events/${encodeURIComponent(category)}/${encodeURIComponent(e.id)}`}
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

