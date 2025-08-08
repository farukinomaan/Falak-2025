import { notFound } from "next/navigation";
import { culturalCategories } from "@/lib/mock_data/categories";
import { events, getEventBySlug } from "@/lib/mock_data/events";

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { category: string; slug: string }[] = [];
  for (const cat of culturalCategories) {
    for (const e of events.filter((ev) => ev.categorySlug === cat.slug)) {
      params.push({ category: cat.slug, slug: e.slug });
    }
  }
  return params;
}

export default async function CulturalEventDetail({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const cat = culturalCategories.find((c) => c.slug === category);
  const event = getEventBySlug(slug);
  if (!cat || !event || event.categorySlug !== cat.slug) return notFound();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-semibold">{event.title}</h1>
      <p className="text-gray-700">{event.description}</p>
      <div className="text-sm space-y-1">
        <p>Venue: {event.venue}</p>
        <p>Start: {new Date(event.startDate).toLocaleString()}</p>
        {event.endDate && <p>End: {new Date(event.endDate).toLocaleString()}</p>}
        {typeof event.price === "number" && <p>Price: ₹{event.price}</p>}
      </div>
      <button className="px-4 py-2 rounded bg-black text-white">Buy Now</button>
    </div>
  );
}

