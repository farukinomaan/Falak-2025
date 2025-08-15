import Features from "@/components/Features";
import { saListPasses } from "@/lib/actions/adminAggregations";

export const revalidate = 60;

type PassCard = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };

export default async function PassesPage() {
  const res = await saListPasses();
  const passes: PassCard[] = res.ok ? (res.data as PassCard[]) : [];
  return (
    <>
      <Features />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-semibold">Passes</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {passes.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 space-y-2">
              <h2 className="text-xl font-medium">{p.pass_name}</h2>
              {p.description && <p className="text-sm text-gray-600">{p.description}</p>}
              {p.cost && <p className="font-bold">₹{typeof p.cost === "number" ? p.cost : p.cost}</p>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}


