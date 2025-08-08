import Link from "next/link";
import { sportsCategories } from "@/lib/mock_data/categories";

export const revalidate = 60;

export default function SportsEvents() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Sports Events</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sportsCategories.map((cat) => (
          <div key={cat.id} className="border rounded-lg p-4">
            <h2 className="text-xl font-medium mb-2">{cat.title}</h2>
            <ul className="space-y-1">
              {cat.subcategories.map((s) => (
                <li key={s.id}>
                  <Link
                    className="text-blue-600 hover:underline"
                    href={`/sports_events/${cat.slug}`}
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              className="inline-block mt-3 text-sm text-white bg-black px-3 py-1 rounded"
              href={`/sports_events/${cat.slug}`}
            >
              View {cat.title}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

