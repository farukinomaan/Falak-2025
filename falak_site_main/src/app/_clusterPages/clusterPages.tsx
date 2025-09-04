// Shared server-side helpers for Sports & Cultural event pages to avoid duplication.
// Each function returns the JSX formerly duplicated in individual route files.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  saListEvents,
  saListUserPassIds,
  saListPasses,
  saListUserTeamEventIds,
  saGetUserTeamForEvent,
} from "@/lib/actions/adminAggregations";
import AddToCartButton from "@/components/cart/AddToCartButton";
// @ts-expect-error local client component path resolution at build
import TeamRegistrationClient from "./team-registration-client";
import { getServiceClient } from "@/lib/actions/supabaseClient";
import "./cluster.css";

type EvtBase = {
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

// --- MOCK DATA ---
const mockEventsData: EvtBase[] = [
    { id: 'sp1', name: 'Football', cluster_name: 'sports', sub_cluster: 'Team Sports', venue: 'Field A', date: '2025-10-10', price: 100, max_team_size: 11, description: 'A friendly football match.' },
    { id: 'sp2', name: 'Basketball', cluster_name: 'sports', sub_cluster: 'Team Sports', venue: 'Court 1', date: '2025-10-11', price: 100, max_team_size: 5, description: 'A competitive basketball game.' },
    { id: 'sp3', name: 'Chess', cluster_name: 'sports', sub_cluster: 'Individual Sports', venue: 'Hall C', date: '2025-10-12', price: 50, max_team_size: 1, description: 'A battle of wits.' },
    { id: 'cu1', name: 'Dance', cluster_name: 'cultural', sub_cluster: 'Performing Arts', venue: 'Stage 1', date: '2025-10-15', price: 75, max_team_size: 10, description: 'A beautiful dance performance.' },
    { id: 'cu2', name: 'Singing', cluster_name: 'cultural', sub_cluster: 'Performing Arts', venue: 'Stage 2', date: '2025-10-16', price: 75, max_team_size: 1, description: 'A solo singing competition.' },
    { id: 'cu3', name: 'Painting', cluster_name: 'cultural', sub_cluster: 'Fine Arts', venue: 'Art Room', date: '2025-10-17', price: 60, max_team_size: 1, description: 'Express yourself with colors.' },
];

const mockPassesData = [{id: 'pass1', event_id: 'sp1'}];
const mockUserPassIdsData = ['pass1'];
const mockUserTeamEventIdsData = ['sp2'];
// --- END MOCK DATA ---


function clusterLabel(cluster: string) {
  return cluster.charAt(0).toUpperCase() + cluster.slice(1).toLowerCase();
}

// Root: list sub-clusters for a cluster (sports / cultural)
export async function ClusterRoot({ cluster }: { cluster: string }) {
  // const res = await saListEvents();
  // const events = res.ok ? (res.data as EvtBase[]) : [];
  const events = mockEventsData;
  const filtered = events.filter((e) => (e.cluster_name || "").toLowerCase() === cluster);
  const subMap = new Map<string, { count: number }>();
  for (const e of filtered) {
    const sub = e.sub_cluster;
    if (!sub) continue;
    const node = subMap.get(sub);
    if (node) node.count += 1; else subMap.set(sub, { count: 1 });
  }
  const subs = Array.from(subMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const nice = clusterLabel(cluster);
  return (
    <div className="clusterContainer max-w-6xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{nice} Events</h1>
        <p className="text-sm text-muted-foreground">All {nice.toLowerCase()} sub-clusters.</p>
      </header>
      {subs.length === 0 && (
        <p className="text-sm text-muted-foreground">No {nice.toLowerCase()} events available.</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {subs.map(([slug, meta]) => (
          <div key={slug} className="clusterCard border rounded-lg p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium mb-2 break-words">{slug}</h3>
              <p className="text-muted-foreground flex items-center gap-2 cluster-meta-text">
                <span className="inline-block px-2 py-0.5 rounded-full bg-black text-white cluster-tag">{nice}</span>
                {meta.count} event{meta.count !== 1 && "s"}
              </p>
            </div>
            <Link
              className="clusterButton"
              href={`/${cluster}/${encodeURIComponent(slug)}`}
            >
              View {slug}
            </Link>
          </div>
        ))}
      </div>
      <img src="/wave2.svg" className="waveImage" alt="" />
    </div>
  );
}

// Category page for a cluster
export async function ClusterCategory({ cluster, category }: { cluster: string; category: string }) {
  // const session = await getServerSession(authOptions);
  // const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  const userId = 'mock-user-id';
  // const [ownedRes, eventsRes, passesRes, teamEvtRes] = await Promise.all([
  //   userId ? saListUserPassIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
  //   saListEvents(),
  //   saListPasses(),
  //   userId ? saListUserTeamEventIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
  // ]);
  const ownedRes = { ok: true, data: mockUserPassIdsData };
  const eventsRes = { ok: true, data: mockEventsData };
  const passesRes = { ok: true, data: mockPassesData };
  const teamEvtRes = { ok: true, data: mockUserTeamEventIdsData };

  const ownedPassIds = new Set<string>(ownedRes.ok ? ownedRes.data : []);
  type PassLite = { id: string; event_id?: string | null };
  const passes = passesRes.ok ? (passesRes.data as PassLite[]) : [];
  const ownedEventIds = new Set<string>();
  for (const p of passes) if (p.event_id && ownedPassIds.has(p.id)) ownedEventIds.add(p.event_id);
  const teamEventIds = new Set<string>(teamEvtRes.ok ? teamEvtRes.data : []);
  const events = eventsRes.ok ? (eventsRes.data as EvtBase[]) : [];
  const list = events.filter(
    (e) => (e.cluster_name || "").toLowerCase() === cluster && e.sub_cluster === category
  );
  if (list.length === 0) return notFound();
  const nice = clusterLabel(cluster);
  return (
    <div className="clusterContainer max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{category}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {list.map((e) => {
          const owned = ownedEventIds.has(e.id) || ownedPassIds.has(e.id);
            const inTeam = teamEventIds.has(e.id);
          return (
            <div key={e.id} className="clusterCard border rounded-lg p-4 space-y-1">
              <h2 className="text-lg font-medium flex items-center gap-2">
                {e.name}
                <span className="cluster-tag px-2 py-0.5 rounded-full bg-black text-white">{nice}</span>
                {inTeam ? (
                  <span className="cluster-tag px-2 py-0.5 rounded-full bg-indigo-600 text-white">Team</span>
                ) : owned ? (
                  <span className="cluster-tag px-2 py-0.5 rounded-full bg-emerald-600 text-white">Owned</span>
                ) : null}
              </h2>
              {e.description && (
                <p className="text-sm text-gray-600 line-clamp-3">{e.description}</p>
              )}
              <p className="text-sm">Venue: {e.venue}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Link
                  className="clusterButton"
                  href={`/${cluster}/${encodeURIComponent(category)}/${encodeURIComponent(e.id)}`}
                >
                  {inTeam || owned ? "View" : "Details"}
                </Link>
                {!owned && !inTeam && <AddToCartButton passId={e.id} className="clusterButton" />}
              </div>
            </div>
          );
        })}
      </div>
      <img src="/wave2.svg" className="waveImage" alt="" />
    </div>
  );
}

// Event detail for a cluster
export async function ClusterEvent({
  cluster,
  category,
  slug,
}: {
  cluster: string;
  category: string;
  slug: string;
}) {
  // const session = await getServerSession(authOptions);
  // const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  const session = { user: { id: 'mock-user-id', name: 'Mock User' } };
  const userId = session.user.id;

  // const [ownedRes, eventsRes, passesRes, teamRes] = await Promise.all([
  //   userId ? saListUserPassIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
  //   saListEvents(),
  //   saListPasses(),
  //   userId ? saGetUserTeamForEvent(userId, slug) : Promise.resolve({ ok: true as const, data: null }),
  // ]);
  const ownedRes = { ok: true, data: mockUserPassIdsData };
  const eventsRes = { ok: true, data: mockEventsData };
  const passesRes = { ok: true, data: mockPassesData };
  const teamRes = { ok: true, data: slug === 'sp2' ? { team: { id: 'team1', name: 'The Winners', captainId: 'mock-user-id' }, members: [{id: 'mem1', memberId: 'mock-user-id'}, {id: 'mem2', memberId: 'another-user-id'}] } : null };


  const ownedPassIds = new Set<string>(ownedRes.ok ? ownedRes.data : []);
  type PassLite = { id: string; event_id?: string | null };
  const passes = passesRes.ok ? (passesRes.data as PassLite[]) : [];
  const ownedEventIds = new Set<string>();
  for (const p of passes) if (p.event_id && ownedPassIds.has(p.id)) ownedEventIds.add(p.event_id);
  const events: EvtBase[] = eventsRes.ok ? (eventsRes.data as unknown as EvtBase[]) : [];
  const event = events.find(
    (e) => e.id === slug && e.sub_cluster === category && (e.cluster_name || "").toLowerCase() === cluster
  );
  if (!event) return notFound();
  const dateStr = event.date
    ? typeof event.date === "string"
      ? new Date(event.date).toLocaleString()
      : event.date instanceof Date
      ? event.date.toLocaleString()
      : undefined
    : undefined;
  const priceStr =
    typeof event.price === "number" || typeof event.price === "string"
      ? String(event.price)
      : undefined;

  interface ExistingTeamData {
    team: { id: string; name: string; captainId?: string };
    members: Array<{ id: string; memberId: string }>;
  }
  const nice = clusterLabel(cluster);
  let existingTeam: ExistingTeamData | null = null;
  let memberUsersById: Map<string, { name: string | null; email: string | null }> | null = null;
  if (teamRes.ok && teamRes.data) {
    existingTeam = teamRes.data as ExistingTeamData;
    // const supabase = getServiceClient();
    const ids = existingTeam
      ? Array.from(
          new Set([
            existingTeam.team.captainId,
            ...existingTeam.members.map((m) => m.memberId),
          ].filter(Boolean))
        )
      : [];
    if (ids.length) {
      // const { data: users } = await supabase
      //   .from("Users")
      //   .select("id, name, email")
      //   .in("id", ids);
      const users = [
          { id: 'mock-user-id', name: 'Mock User', email: 'mock@user.com' },
          { id: 'another-user-id', name: 'Another User', email: 'another@user.com' },
      ];
      memberUsersById = new Map();
      (users as Array<{ id: string; name: string | null; email: string | null }> | null)?.forEach((u) =>
        memberUsersById!.set(u.id, { name: u.name, email: u.email })
      );
    }
  }

  return (
    <div className="clusterContainer max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-semibold flex items-center gap-3">
        {event.name}
        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-black text-white">{nice}</span>
      </h1>
      {event.description && (
        <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
      )}
      <div className="text-sm space-y-1">
        <p>Sub-cluster: {event.sub_cluster}</p>
        <p>Venue: {event.venue}</p>
        {dateStr && <p>Date: {dateStr}</p>}
        {priceStr && <p>Price: ₹{priceStr}</p>}
      </div>
      {(() => {
        const owned = ownedEventIds.has(event.id) || ownedPassIds.has(event.id);
        if (existingTeam) {
          return (
            <div className="space-y-3 border rounded-lg p-4">
              <h2 className="text-lg font-medium">Your Team</h2>
              <p className="text-sm">Name: {existingTeam.team.name}</p>
              <p className="text-sm">Members ({existingTeam.members.length}):</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {existingTeam.members.map((m) => {
                  const info = memberUsersById?.get(m.memberId);
                  return <li key={m.id}>{info?.name || info?.email || m.memberId}</li>;
                })}
              </ul>
              <Link
                href="/profile"
                className="clusterButton"
              >
                My Passes
              </Link>
            </div>
          );
        }
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
        return <AddToCartButton passId={event.id} className="clusterButton" />;
      })()}
      <img src="/wave2.svg" className="waveImage" alt="" />
    </div>
  );
}

// Static params helpers
export async function getClusterCategoryParams(cluster: string) {
  // const res = await saListEvents();
  // const events = res.ok ? (res.data as EvtBase[]) : [];
  const events = mockEventsData;
  const filtered = events.filter((e) => (e.cluster_name || "").toLowerCase() === cluster);
  const subs = Array.from(new Set(filtered.map((e) => e.sub_cluster)));
  return subs.map((s) => ({ category: s }));
}

export async function getClusterEventParams(cluster: string) {
  // const res = await saListEvents();
  // const events = res.ok ? (res.data as EvtBase[]) : [];
  const events = mockEventsData;
  const filtered = events.filter((e) => (e.cluster_name || "").toLowerCase() === cluster);
  return filtered.map((e) => ({ category: e.sub_cluster, slug: e.id }));
}
