/* eslint-disable @next/next/no-img-element */
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
import TeamRegistrationClient from "./team-registration-client";
import { getServiceClient } from "@/lib/actions/supabaseClient";
import "./cluster.css";
import FlipCard from "./FlipCard";
import CulturalAnimations from "@/components/CulturalAnimations";

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

function clusterLabel(cluster: string) {
  return cluster.charAt(0).toUpperCase() + cluster.slice(1).toLowerCase();
}

export function PageBackground({ cluster }: { cluster: string }) {
  const isSports = cluster === 'sports';
  const bgStyle = `
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-position: center center;
      background-attachment: fixed;
      z-index: 1; 
      background-repeat: no-repeat;
      background-size: cover;
      ${isSports
        ? `
            background-image: url('/sports.svg');
            opacity: 0.3;
          `
        : `
            background-image: url('/cultural.svg');
            opacity: 0.3;
          `
      }
    }
  `;
  return <style>{bgStyle}</style>;
}

// Root: list sub-clusters for a cluster (sports / cultural)
export async function ClusterRoot({ cluster }: { cluster: string }) {
  const res = await saListEvents();
  const events = res.ok ? (res.data as EvtBase[]) : [];

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
    <>
      {cluster === 'cultural' && <CulturalAnimations />}
      <PageBackground cluster={cluster} />
      <div className={`clusterContainer max-w-6xl mx-auto p-4 md:p-6 space-y-8 ${cluster}`}>
        
        <header className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold">{nice} Events</h1>
          <p className="text-md text-muted-foreground">All {nice.toLowerCase()} categories.</p>
        </header>
        {subs.length === 0 && (
          <p className="text-md text-muted-foreground">No {nice.toLowerCase()} events available.</p>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
          {subs.map(([slug, meta], index) => (
            <FlipCard
              key={slug}
              containerClassName="h-48"
              style={{ animationDelay: `${index * 100}ms` }}
              frontClassName="clusterCard border rounded-lg p-6 flex flex-col justify-center items-center text-center"
              backClassName="clusterCard border rounded-lg p-6"
              front={
                <>
                  <h3 className="text-3xl font-medium mb-2 break-words">{slug}</h3>
                  <p className="text-muted-foreground flex items-center gap-2 cluster-meta-text text-md">
                    <span className="inline-block px-3 py-1 rounded-full bg-black text-white cluster-tag">{nice}</span>
                    {meta.count} event{meta.count !== 1 && "s"}
                  </p>
                </>
              }
              back={
                <Link
                  className="clusterButton cluster-root-button"
                  href={`/${cluster}/${encodeURIComponent(slug)}`}
                >
                  View {slug}
                </Link>
              }
            />
          ))}
        </div>
  {/* <img src="/wave2.svg" className="waveImage" alt="" /> */}
      </div>
    </>
  );
}

// Category page for a cluster
export async function ClusterCategory({ cluster, category }: { cluster: string; category: string }) {
  // Backend logic re-enabled
  const session = await getServerSession(authOptions);
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  const [ownedRes, eventsRes, passesRes, teamEvtRes] = await Promise.all([
    userId ? saListUserPassIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
    saListEvents(),
    saListPasses(),
    userId ? saListUserTeamEventIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
  ]);

  const ownedPassIds = new Set<string>(ownedRes.ok ? ownedRes.data : []);
  type PassLite = { id: string; event_id?: string | null; mahe?: boolean | null };
  const passes = passesRes.ok ? (passesRes.data as PassLite[]) : [];
  const ownedEventIds = new Set<string>();
  for (const p of passes) if (p.event_id && ownedPassIds.has(p.id)) ownedEventIds.add(p.event_id);
  const teamEventIds = new Set<string>(teamEvtRes.ok ? teamEvtRes.data : []);
  const events = eventsRes.ok ? (eventsRes.data as EvtBase[]) : [];

  // Determine if user has a MAHE proshow pass (no event_id) to unlock access (except esports)
  let userIsMahe = false;
  if (userId) {
    const supabase = getServiceClient();
    const { data: userRow } = await supabase.from("Users").select("mahe").eq("id", userId).maybeSingle();
    userIsMahe = Boolean((userRow as { mahe?: boolean } | null)?.mahe);
  }
  const userOwnedPasses = passes.filter(p => ownedPassIds.has(p.id));
  const hasMaheProshow = userOwnedPasses.some(p => !p.event_id && (p.mahe === true || userIsMahe));

  const decodedCategory = decodeURIComponent(category);

  const list = events.filter(
    (e) =>
      (e.cluster_name || "").toLowerCase() === cluster &&
      e.sub_cluster.toLowerCase() === decodedCategory.toLowerCase()
  );

  if (list.length === 0) return notFound();

  const nice = clusterLabel(cluster);
  return (
    <>
      {cluster === 'cultural' && <CulturalAnimations />}
      <PageBackground cluster={cluster} />
      <div className={`clusterContainer max-w-5xl mx-auto p-4 md:p-6 space-y-4 ${cluster}`}>
        <h1 className="text-3xl font-semibold">{decodedCategory}</h1>
        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-8">
          {list.map((e) => {
            const eligibleUniversal = hasMaheProshow && e.sub_cluster.toLowerCase() !== 'esports';
            const owned = ownedEventIds.has(e.id) || eligibleUniversal;
            const inTeam = teamEventIds.has(e.id);
            return (
              <FlipCard
                key={e.id}
                containerClassName="h-56"
                frontClassName="clusterCard border rounded-lg p-6 flex flex-col justify-center items-center"
                backClassName="clusterCard border rounded-lg p-6"
                front={
                  <h2 className="text-3xl font-medium text-center break-words">{e.name}</h2>
                }
                back={
                  <>
                    <div className={`status-tag ${inTeam ? 'in-team' : owned ? 'owned' : 'available'}`}>
                      {inTeam ? "In Team" : owned ? "Owned" : "Available"}
                    </div>
                    <Link
                      className="clusterButton mt-4"
                      href={`/${cluster}/${encodeURIComponent(decodedCategory)}/${encodeURIComponent(e.id)}`}
                    >
                      Go to Event Page
                    </Link>
                  </>
                }
              />
            );
          })}
        </div>
  {/* <img src="/wave2.svg" className="waveImage" alt="" /> */}
      </div>
    </>
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
  // Backend logic re-enabled
  const session = await getServerSession(authOptions);
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  const [ownedRes, eventsRes, passesRes, teamRes] = await Promise.all([
    userId ? saListUserPassIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
    saListEvents(),
    saListPasses(),
    userId ? saGetUserTeamForEvent(userId, slug) : Promise.resolve({ ok: true as const, data: null }),
  ]);


  const ownedPassIds = new Set<string>(ownedRes.ok ? ownedRes.data : []);
  type PassLite = { id: string; event_id?: string | null; mahe?: boolean | null };
  const passes = passesRes.ok ? (passesRes.data as PassLite[]) : [];
  const ownedEventIds = new Set<string>();
  for (const p of passes) if (p.event_id && ownedPassIds.has(p.id)) ownedEventIds.add(p.event_id);
  const events: EvtBase[] = eventsRes.ok ? (eventsRes.data as unknown as EvtBase[]) : [];
  const event = events.find(
    (e) => e.id === slug && e.sub_cluster.toLowerCase() === decodeURIComponent(category).toLowerCase() && (e.cluster_name || "").toLowerCase() === cluster
  );
  if (!event) return notFound();
  const nice = clusterLabel(cluster);
  // Determine if user has a MAHE proshow pass (no event_id) to unlock access (except esports)
  let userIsMahe = false;
  if (userId) {
    const supabase = getServiceClient();
    const { data: userRow } = await supabase.from("Users").select("mahe").eq("id", userId).maybeSingle();
    userIsMahe = Boolean((userRow as { mahe?: boolean } | null)?.mahe);
  }
  const userOwnedPasses = passes.filter(p => ownedPassIds.has(p.id));
  const hasMaheProshow = userOwnedPasses.some(p => !p.event_id && (p.mahe === true || userIsMahe));
  const eligibleUniversal = hasMaheProshow && event.sub_cluster.toLowerCase() !== 'esports';
  const owned = ownedEventIds.has(event.id) || eligibleUniversal;
  
  const date = event.date ? new Date(event.date) : null;
  const dateStr = date?.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const priceStr =
    typeof event.price === "number" || typeof event.price === "string"
      ? String(event.price)
      : undefined;

  interface ExistingTeamData {
    team: { id: string; name: string; captainId?: string };
    members: Array<{ id: string; memberId: string }>;
  }
  let existingTeam: ExistingTeamData | null = null;
  let memberUsersById: Map<string, { name: string | null; email: string | null }> | null = null;
  if (teamRes.ok && teamRes.data) {
    existingTeam = teamRes.data as ExistingTeamData;
    const supabase = getServiceClient();
    const ids = existingTeam
      ? Array.from(
          new Set([
            existingTeam.team.captainId,
            ...existingTeam.members.map((m) => m.memberId),
          ].filter(Boolean))
        )
      : [];
    if (ids.length) {
      const { data: users } = await supabase
        .from("Users")
        .select("id, name, email")
        .in("id", ids);

      memberUsersById = new Map();
      (users as Array<{ id: string; name: string | null; email: string | null }> | null)?.forEach((u) =>
        memberUsersById!.set(u.id, { name: u.name, email: u.email })
      );
    }
  }

  return (
    <>
      {cluster === 'cultural' && <CulturalAnimations />}
      <PageBackground cluster={cluster} />
      <div className={`clusterContainer max-w-3xl mx-auto p-4 md:p-6 space-y-4 ${cluster}`}>
        <div className="decorated-card-container mt-8">
          <div className="clusterCard rounded-2xl p-6 md:p-8 lg:p-10 space-y-6">
            <h1 className="text-4xl font-semibold flex items-center justify-center gap-3">
              {event.name}
              <span className="text-sm uppercase tracking-wide px-3 py-1 rounded-full bg-black text-white">{nice}</span>
            </h1>
            {event.description && (
              <p className="text-gray-300 whitespace-pre-line text-lg">{event.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-md border-t border-gray-600 pt-6">
              <p><span className="font-semibold text-gray-400">Category:</span> {event.sub_cluster}</p>
              <p><span className="font-semibold text-gray-400">Venue:</span> {event.venue}</p>
              {dateStr && <p><span className="font-semibold text-gray-400">Date:</span> {dateStr}</p>}
              {timeStr && <p><span className="font-semibold text-gray-400">Time:</span> {timeStr}</p>}
              {priceStr && <p><span className="font-semibold text-gray-400">Price:</span> ₹{priceStr}</p>}
            </div>
            {(() => {
              if (existingTeam) {
                return (
                  <div className="space-y-3 border rounded-lg p-4 bg-black/20">
                    <h2 className="text-xl font-medium">Your Team</h2>
                    <p className="text-md">Name: {existingTeam.team.name}</p>
                    <p className="text-md">Members ({existingTeam.members.length}):</p>
                    <ul className="list-disc list-inside text-md space-y-1">
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
              if (!owned) {
                return <AddToCartButton passId={event.id} className="clusterButton" />;
              }
              return null;
            })()}
          </div>
        </div>

        
        {owned && !existingTeam && (
          <div className="mt-8" style={{ position: 'relative', zIndex: 5 }}>
            
            <TeamRegistrationClient
              eventId={event.id}
              captainId={userId || ""}
              captainName={session?.user?.name || null}
              minSize={1}
            />
          </div>
        )}
        {/* <img src="/wave2.svg" className="waveImage" alt="" /> */}
      </div>
    </>
  );
}

// Static params helpers
export async function getClusterCategoryParams(cluster: string) {
  // Backend logic re-enabled
  const res = await saListEvents();
  const events = res.ok ? (res.data as EvtBase[]) : [];

  const filtered = events.filter((e) => (e.cluster_name || "").toLowerCase() === cluster);
  const subs = Array.from(new Set(filtered.map((e) => e.sub_cluster).filter(Boolean)));
  return subs.map((s) => ({ category: s }));
}

export async function getClusterEventParams(cluster: string) {
  // Backend logic re-enabled
  const res = await saListEvents();
  const events = res.ok ? (res.data as EvtBase[]) : [];
  
  const filtered = events.filter((e) => (e.cluster_name || "").toLowerCase() === cluster);
  return filtered.map((e) => ({ category: e.sub_cluster, slug: e.id }));
}