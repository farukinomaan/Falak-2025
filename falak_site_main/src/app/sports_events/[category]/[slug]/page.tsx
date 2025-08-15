import { notFound } from "next/navigation";
import { saListEvents } from "@/lib/actions/adminAggregations";

export const dynamicParams = false;

export async function generateStaticParams() {
  const res = await saListEvents();
  const events = res.ok ? (res.data as Array<{ id: string; sub_cluster: string; cluster_name?: string | null }>) : [];
  const sports = events.filter((e) => (e.cluster_name || "").toLowerCase() === "sports");
  return sports.map((e) => ({ category: e.sub_cluster, slug: e.id }));
}

export default async function SportsEventDetail({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const res = await saListEvents();
  type Evt = { id: string; name: string; description?: string | null; venue: string; sub_cluster: string; date?: string | Date | null; price?: number | string | null; cluster_name?: string | null };
  const events = res.ok ? (res.data as Evt[]) : [];
  const event = events.find((e) => e.id === slug && e.sub_cluster === category && (e.cluster_name || "").toLowerCase() === "sports");
  if (!event) return notFound();
  const dateStr = event.date ? (typeof event.date === "string" ? new Date(event.date).toLocaleString() : event.date instanceof Date ? event.date.toLocaleString() : undefined) : undefined;
  const priceStr = typeof event.price === "number" || typeof event.price === "string" ? String(event.price) : undefined;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-semibold">{event.name}</h1>
      {event.description && <p className="text-gray-700">{event.description}</p>}
      <div className="text-sm space-y-1">
        <p>Venue: {event.venue}</p>
        {dateStr && <p>Date: {dateStr}</p>}
        {priceStr && <p>Price: ₹{priceStr}</p>}
      </div>
      <button className="px-4 py-2 rounded bg-black text-white">Buy Now</button>
    </div>
  );
}

