import { notFound } from "next/navigation";
import { saListEvents, saListUserPassIds, saGetUserTeamForEvent, saListPasses } from "@/lib/actions/adminAggregations";
import { getServiceClient } from "@/lib/actions/supabaseClient";
import AddToCartButton from "@/components/cart/AddToCartButton";
// @ts-expect-error local client component path resolution at build
import TeamRegistrationClient from "./team-registration-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export const dynamicParams = true; // allow fallback if new events appear (still ISR)
export const revalidate = 60;

export async function generateStaticParams() {
  const res = await saListEvents();
  const events = res.ok ? (res.data as Array<{ id: string; sub_cluster: string }>) : [];
  return events.map((e) => ({ category: e.sub_cluster, slug: e.id }));
}

// (ownership determined via passes + user passes mapping)

export default async function EventDetail({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  type Evt = {
    id: string;
    name: string;
    description?: string | null;
    venue: string;
    sub_cluster: string;
    cluster_name?: string | null;
    date?: string | Date | null;
    price?: number | string | null;
    max_team_size?: number | null;
  };
  const session = await getServerSession(authOptions);
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  const [ownedRes, eventsRes, passesRes, teamRes] = await Promise.all([
    userId ? saListUserPassIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
    saListEvents(),
    saListPasses(),
    userId ? saGetUserTeamForEvent(userId, slug) : Promise.resolve({ ok: true as const, data: null }),
  ]);
  const ownedPassIds = new Set<string>(ownedRes.ok ? ownedRes.data : []);
  type PassLite = { id: string; event_id?: string | null };
  const passes = passesRes.ok ? (passesRes.data as PassLite[]) : [];
  const ownedEventIds = new Set<string>();
  for (const p of passes) {
    if (p.event_id && ownedPassIds.has(p.id)) ownedEventIds.add(p.event_id);
  }
  const events: Evt[] = eventsRes.ok ? (eventsRes.data as unknown as Evt[]) : [];
  const event = events.find((e) => e.id === slug && e.sub_cluster === category);
  if (!event) return notFound();

  const dateStr = event.date
    ? typeof event.date === "string"
      ? new Date(event.date).toLocaleString()
      : event.date instanceof Date
      ? event.date.toLocaleString()
      : undefined
    : undefined;
  const priceStr =
    typeof event.price === "number" || typeof event.price === "string" ? String(event.price) : undefined;

  // Prefetch team member user data if team exists
  interface ExistingTeamData { team: { id: string; name: string; captainId?: string }; members: Array<{ id: string; memberId: string }> }
  let existingTeam: ExistingTeamData | null = null;
  let memberUsersById: Map<string, { name: string | null; email: string | null }> | null = null;
  if (teamRes.ok && teamRes.data) {
    existingTeam = teamRes.data as ExistingTeamData;
    const supabase = getServiceClient();
    const ids = existingTeam ? Array.from(new Set([existingTeam.team.captainId, ...existingTeam.members.map(m => m.memberId)].filter(Boolean))) : [];
    if (ids.length) {
      const { data: users } = await supabase.from("Users").select("id, name, email").in("id", ids);
      memberUsersById = new Map();
      (users as Array<{ id: string; name: string | null; email: string | null }> | null)?.forEach(u => memberUsersById!.set(u.id, { name: u.name, email: u.email }));
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-semibold flex items-center gap-3">
        {event.name}
        {event.cluster_name && (
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-black text-white">
            {event.cluster_name}
          </span>
        )}
      </h1>
      {event.description && <p className="text-gray-700 whitespace-pre-line">{event.description}</p>}
      <div className="text-sm space-y-1">
        <p>Sub-cluster: {event.sub_cluster}</p>
        <p>Venue: {event.venue}</p>
        {dateStr && <p>Date: {dateStr}</p>}
        {priceStr && <p>Price: ₹{priceStr}</p>}
      </div>
      {(() => {
        const owned = ownedEventIds.has(event.id) || ownedPassIds.has(event.id);
        // Priority: if user is already on a team (captain or member) show team details irrespective of pass ownership
        if (existingTeam) {
          return (
            <div className="space-y-3 border rounded-lg p-4">
              <h2 className="text-lg font-medium">Your Team</h2>
              <p className="text-sm">Name: {existingTeam.team.name}</p>
              <p className="text-sm">Members ({existingTeam.members.length}):</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {existingTeam.members.map(m => {
                  const info = memberUsersById?.get(m.memberId);
                  return <li key={m.id}>{info?.name || info?.email || m.memberId}</li>;
                })}
              </ul>
              <Link href="/profile" className="inline-block text-xs bg-black text-white px-3 py-1 rounded">My Passes</Link>
            </div>
          );
        }
        // If owns pass but not yet on a team -> registration option
        if (owned) {
          return (
            <TeamRegistrationClient
              eventId={event.id}
              captainId={userId || ""}
              captainName={session?.user?.name || null}
              minSize={1}
            />
          );
        }
        // Neither owned nor in team: offer purchase
        return <AddToCartButton passId={event.id} />;
      })()}
    </div>
  );
}
