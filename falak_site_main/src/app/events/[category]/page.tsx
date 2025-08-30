import { notFound } from "next/navigation";
import Link from "next/link";
import { saListEvents, saListUserPassIds, saListPasses, saListUserTeamEventIds } from "@/lib/actions/adminAggregations";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamicParams = false; // pre-build known categories
export const revalidate = 60;

export async function generateStaticParams() {
  const res = await saListEvents();
  const events = res.ok ? (res.data as Array<{ sub_cluster: string }>) : [];
  const subs = Array.from(new Set(events.map((e) => e.sub_cluster)));
  return subs.map((s) => ({ category: s }));
}

// (ownership determined via passes + user passes)

export default async function EventsCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  type Evt = { id: string; name: string; description?: string | null; venue: string; sub_cluster: string; cluster_name?: string | null };
  const session = await getServerSession(authOptions);
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  const [ownedRes, eventsRes, passesRes, teamEvtRes] = await Promise.all([
    userId ? saListUserPassIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
    saListEvents(),
    saListPasses(),
    userId ? saListUserTeamEventIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
  ]);
  const ownedPassIds = new Set<string>(ownedRes.ok ? ownedRes.data : []);
  type PassLite = { id: string; event_id?: string | null };
  const passes = passesRes.ok ? (passesRes.data as PassLite[]) : [];
  const ownedEventIds = new Set<string>();
  for (const p of passes) {
    if (p.event_id && ownedPassIds.has(p.id)) ownedEventIds.add(p.event_id);
  }
  const teamEventIds = new Set<string>(teamEvtRes.ok ? teamEvtRes.data : []);
  const events = eventsRes.ok ? (eventsRes.data as Evt[]) : [];
  const list = events.filter((e) => e.sub_cluster === category);
  if (list.length === 0) return notFound();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{category}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((e) => {
          const owned = ownedEventIds.has(e.id) || ownedPassIds.has(e.id);
          const inTeam = teamEventIds.has(e.id);
          return (
            <div key={e.id} className="border rounded-lg p-4 space-y-1">
              <h2 className="text-lg font-medium flex items-center gap-2">
                {e.name}
                {e.cluster_name && (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-black text-white">
                    {e.cluster_name}
                  </span>
                )}
                {inTeam ? (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-600 text-white">Team</span>
                ) : owned ? (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-600 text-white">Owned</span>
                ) : null}
              </h2>
              {e.description && <p className="text-sm text-gray-600 line-clamp-3">{e.description}</p>}
              <p className="text-sm">Venue: {e.venue}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Link
                  className="text-sm text-white bg-black px-3 py-1 rounded"
                  href={`/events/${encodeURIComponent(category)}/${encodeURIComponent(e.id)}`}
                >
                  {inTeam || owned ? "View" : "Details"}
                </Link>
                {!owned && !inTeam && <AddToCartButton passId={e.id} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
