import { culturalCategories, sportsCategories } from "@/lib/mock_data/categories";
import { events } from "@/lib/mock_data/events";
import { passes } from "@/lib/mock_data/passes";

export default function AdminManagePage() {
  const counts = {
    culturalEvents: events.filter((e) => e.kind === "cultural").length,
    sportsEvents: events.filter((e) => e.kind === "sports").length,
    passes: passes.length,
    categories: culturalCategories.length + sportsCategories.length,
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="font-medium">Cultural Events</h2>
          <p className="text-2xl font-bold">{counts.culturalEvents}</p>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-medium">Sports Events</h2>
          <p className="text-2xl font-bold">{counts.sportsEvents}</p>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-medium">Passes</h2>
          <p className="text-2xl font-bold">{counts.passes}</p>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-medium">Categories</h2>
          <p className="text-2xl font-bold">{counts.categories}</p>
        </div>
      </div>
      <p className="text-sm text-gray-600">Support tickets count will appear when Supabase is configured.</p>
    </div>
  );
}

