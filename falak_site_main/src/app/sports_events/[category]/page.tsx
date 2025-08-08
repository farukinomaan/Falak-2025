import { notFound } from "next/navigation";
import Link from "next/link";
import { sportsCategories } from "@/lib/mock_data/categories";
import { getEventsByCategorySlug } from "@/lib/mock_data/events";

export const dynamicParams = false;

export function generateStaticParams() {
  return sportsCategories.map((c) => ({ category: c.slug }));
}

export default async function SportsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categoryParam } = await params;
  const category = sportsCategories.find((c) => c.slug === categoryParam);
  if (!category) return notFound();
  const list = getEventsByCategorySlug(category.slug);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{category.title}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((e) => (
          <div key={e.id} className="border rounded-lg p-4 space-y-1">
            <h2 className="text-lg font-medium">{e.title}</h2>
            <p className="text-sm text-gray-600">{e.description}</p>
            <p className="text-sm">Venue: {e.venue}</p>
            <Link
              className="inline-block mt-2 text-sm text-white bg-black px-3 py-1 rounded"
              href={`/sports_events/${category.slug}/${e.slug}`}
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

