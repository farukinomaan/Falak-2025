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
import { computeUserAccessibleEventIds } from "@/lib/actions/access";
import AddToCartButton from "@/components/cart/AddToCartButton";
import TeamRegistrationClient from "./team-registration-client";
import CopySmall from "@/components/CopySmall";
import EsportsTeamRegistration from "@/components/teams/EsportsTeamRegistration";
import { getServiceClient } from "@/lib/actions/supabaseClient";
import "./cluster.css";
import FlipCard from "./FlipCard";
import CulturalAnimations from "@/components/CulturalAnimations";
import MountReveal from "./MountReveal";
import LoadingIndicatorClient from "./LoadingIndicatorClient";

// Events now live (flag removed; always show detail)

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
  enable?: boolean | null;
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
  pointer-events: none; /* Don't block clicks */
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

  const filtered = events
    .filter((e) => (e.cluster_name || "").toLowerCase() === cluster)
    .filter((e) => (e.enable ?? true) as boolean);
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
          {/* <p className="text-md text-muted-foreground">All {nice.toLowerCase()} categories.</p> */}
        </header>
        {subs.length === 0 && (
          <p className="text-md text-muted-foreground">No {nice.toLowerCase()} events available.</p>
        )}
        <MountReveal
          fallback={
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
              {Array.from({ length: Math.max(4, subs.length || 4) }).map((_, i) => (
                <div key={i} className="h-48 clusterCard border rounded-lg animate-pulse" />
              ))}
            </div>
          }
        >
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
        </MountReveal>
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
  const [ownedRes, eventsRes, passesRes, teamEvtRes, accessibleRes] = await Promise.all([
    userId ? saListUserPassIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
    saListEvents(),
    saListPasses(),
    userId ? saListUserTeamEventIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
    userId ? computeUserAccessibleEventIds(userId) : Promise.resolve({ eventIds: [] }),
  ]);

  const ownedPassIds = new Set<string>(ownedRes.ok ? ownedRes.data : []);
  type PassLite = { id: string; event_id?: string | null; mahe?: boolean | null };
  const passes = passesRes.ok ? (passesRes.data as PassLite[]) : [];
  const ownedEventIds = new Set<string>();
  for (const p of passes) if (p.event_id && ownedPassIds.has(p.id)) ownedEventIds.add(p.event_id);
  // Incorporate unified access layer (includes esports bundle / Falak25 esports full bundle / proshow unlocks)
  const accessibleIds = new Set<string>(accessibleRes.eventIds || []);
  const teamEventIds = new Set<string>(teamEvtRes.ok ? teamEvtRes.data : []);
  const events = eventsRes.ok ? ((eventsRes.data as EvtBase[]) || []).filter((e) => (e.enable ?? true) as boolean) : [];

  // Determine if user has a MAHE proshow pass (no event_id) to unlock access (except esports)
  interface SessWithMahe { user?: { mahe?: boolean | null } }
  const userIsMahe = Boolean((session as SessWithMahe | null)?.user?.mahe);
  const userOwnedPasses = passes.filter(p => ownedPassIds.has(p.id));
  const hasMaheProshow = userOwnedPasses.some(p => !p.event_id && (p.mahe === true || userIsMahe));

  const decodedCategory = decodeURIComponent(category);

  // Esports note will be shown below title when viewing the esports sub-cluster
  const isEsportsCategory = decodedCategory.toLowerCase() === 'esports';

  const list = events.filter(
    (e) =>
      (e.cluster_name || "").toLowerCase() === cluster &&
      ((e.sub_cluster || "").toLowerCase() === decodedCategory.toLowerCase())
  );

  if (list.length === 0) return notFound();

  return (
    <>
      {cluster === 'cultural' && <CulturalAnimations />}
      <PageBackground cluster={cluster} />
      <div className={`clusterContainer max-w-5xl mx-auto p-4 md:p-6 space-y-4 ${cluster}`}>
        <h1 className="text-3xl font-semibold">{decodedCategory}</h1>
        {isEsportsCategory && (
          <p className="text-sm text-gray-300 italic -mt-2">
            Note: You are allowed to register for only one Esports event. Choose wisely – access is locked after your first team registration.
          </p>
        )}
        <MountReveal
          fallback={
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-8">
              {Array.from({ length: Math.max(4, list.length || 4) }).map((_, i) => (
                <div key={i} className="h-56 clusterCard border rounded-lg animate-pulse" />
              ))}
            </div>
          }
        >
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-8">
            {list.map((e) => {
              // Ownership / access now centralized
              const eligibleUniversal = hasMaheProshow && (e.sub_cluster || '').toLowerCase() !== 'esports'; // legacy (still valid for display)
              const owned = accessibleIds.has(e.id) || ownedEventIds.has(e.id) || eligibleUniversal;
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
                        {inTeam ? "In Team" : owned ? "Owned" : userIsMahe ? "MAHE" : "Available"}
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <Link
                          className="clusterButton"
                          href={`/${cluster}/${encodeURIComponent(decodedCategory)}/${encodeURIComponent(e.id)}`}
                        >
                          Go to Event Page
                        </Link>
                        {!owned && userIsMahe && (
                          <Link href="/passes" className="clusterButton alt">
                            Get Access
                          </Link>
                        )}
                      </div>
                    </>
                  }
                />
              );
            })}
          </div>
        </MountReveal>
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
  // Keep backend calls (will be used when enabling event detail)
  const session = await getServerSession(authOptions);
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  // Keeping these fetches for when events go live
  const [ownedRes, eventsRes, passesRes, teamRes, accessibleRes] = await Promise.all([
    userId ? saListUserPassIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
    saListEvents(),
    saListPasses(),
    userId ? saGetUserTeamForEvent(userId, slug) : Promise.resolve({ ok: true as const, data: null }),
    userId ? computeUserAccessibleEventIds(userId) : Promise.resolve({ eventIds: [] }),
  ]);

// Coming soon mode removed; always render full event detail


  const ownedPassIds = new Set<string>(ownedRes.ok ? ownedRes.data : []);
  type PassLite = { id: string; event_id?: string | null; mahe?: boolean | null };
  const passes = passesRes.ok ? (passesRes.data as PassLite[]) : [];
  const ownedEventIds = new Set<string>();
  for (const p of passes) if (p.event_id && ownedPassIds.has(p.id)) ownedEventIds.add(p.event_id);
  const events: EvtBase[] = eventsRes.ok ? (eventsRes.data as unknown as EvtBase[]) : [];
  const event = events.find(
    (e) => e.id === slug && ((e.sub_cluster || '').toLowerCase() === decodeURIComponent(category).toLowerCase()) && (e.cluster_name || "").toLowerCase() === cluster
  );
  if (!event) return notFound();
  const nice = clusterLabel(cluster);
  // Determine if user has a MAHE proshow pass (no event_id) to unlock access (except esports)
  interface SessWithMahe2 { user?: { mahe?: boolean | null } }
  const userIsMahe = Boolean((session as SessWithMahe2 | null)?.user?.mahe);
  const userOwnedPasses = passes.filter(p => ownedPassIds.has(p.id));
  const hasMaheProshow = userOwnedPasses.some(p => !p.event_id && (p.mahe === true || userIsMahe));
  const accessibleIds = new Set<string>(accessibleRes.eventIds || []);
  const eligibleUniversal = hasMaheProshow && (event.sub_cluster || '').toLowerCase() !== 'esports';
  const owned = accessibleIds.has(event.id) || ownedEventIds.has(event.id) || eligibleUniversal;
  
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

  // Esports single-registration enforcement (applies to ALL users)
  const supabase = getServiceClient();
  const isEsports = (event.sub_cluster || '').toLowerCase() === 'esports';
  let redeemedEventId: string | null = null;
  let participationEventId: string | null = null; // any esports event where user participates (captain or member)
  if (userId) {
    try {
      // 1. Determine if user already participates in ANY esports event via Teams / Team_members join
      const { data: esportsEvents } = await supabase
        .from('Events')
        .select('id')
        .eq('sub_cluster', 'Esports');
      const esportsIds = new Set((esportsEvents as Array<{ id: string }> | null)?.map(r => r.id) || []);
      if (esportsIds.size) {
        const [captainRows, memberRows] = await Promise.all([
          supabase.from('Teams').select('eventId').eq('captainId', userId).in('eventId', Array.from(esportsIds)),
          supabase.from('Team_members').select('eventId').eq('memberId', userId).in('eventId', Array.from(esportsIds)),
        ]);
        if (!captainRows.error) {
          for (const r of (captainRows.data as Array<{ eventId: string }> || [])) { participationEventId = r.eventId; break; }
        }
        if (!participationEventId && !memberRows.error) {
          for (const r of (memberRows.data as Array<{ eventId: string }> || [])) { participationEventId = r.eventId; break; }
        }
      }
      // 2. Fetch redeemed row if any
      const { data: redeemed } = await supabase
        .from('esports_redeemed')
        .select('event_id')
        .eq('user_id', userId)
        .limit(1);
      if (Array.isArray(redeemed) && redeemed.length) redeemedEventId = (redeemed[0] as { event_id: string }).event_id;
      // 3. If user participates & no redeemed record, insert one now
      if (participationEventId && !redeemedEventId) {
        try {
          await supabase.from('esports_redeemed').insert({ user_id: userId, event_id: participationEventId });
          redeemedEventId = participationEventId;
        } catch { /* ignore */ }
      }
    } catch { /* ignore top-level esports logic errors */ }
  }

  const lockedToDifferentEsports = isEsports && (redeemedEventId && redeemedEventId !== event.id);
  const blockedEsportsRegistration = lockedToDifferentEsports;

  return (
    <>
      {cluster === 'cultural' && <CulturalAnimations />}
      <PageBackground cluster={cluster} />
      <div className={`clusterContainer max-w-3xl mx-auto p-4 md:p-6 space-y-4 ${cluster}`}>
  {/* Ensure global top loader stops once event content renders */}
  <LoadingIndicatorClient startOnMount={false} stopOnMount />
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
              {userIsMahe ? (
                <p><span className="font-semibold text-gray-400">Pass:</span> {(event.sub_cluster || '').toLowerCase() === 'esports' ? 'Esports Pass' : 'Pro-show Pass'}</p>
              ) : (
                priceStr && <p><span className="font-semibold text-gray-400">Price:</span> ₹{priceStr}</p>
              )}
            </div>
            {(() => {
              if (existingTeam) {
                const capId = existingTeam.team.captainId;
                const capInfo = capId ? memberUsersById?.get(capId) : undefined;
                return (
                  <div className="space-y-3 border rounded-lg p-4 bg-black/20">
                    <h2 className="text-xl font-medium">Your Team</h2>
                    <p className="text-md">Name: {existingTeam.team.name}</p>
                    <p className="text-md break-all flex items-center gap-2">Team Code: <span className="font-mono text-sm inline-flex items-center gap-2 bg-white/10 px-2 py-1 rounded border border-white/20">{existingTeam.team.id}<CopySmall text={existingTeam.team.id} /></span></p>
                    {capInfo && (
                      <p className="text-md">Captain: {capInfo.name || capInfo.email || capId}</p>
                    )}
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
                // Non-MAHE: always show Add to Cart for the specific event
                if (!userIsMahe) {
                  return <AddToCartButton passId={event.id} className="clusterButton" />;
                }
                // MAHE: unified pass CTA
                return (
                  <Link href="/passes" className="clusterButton">
                    Get Access
                  </Link>
                );
              }
              return null;
            })()}
          </div>
        </div>

        
    {owned && !existingTeam && (
          <div className="mt-8" style={{ position: 'relative', zIndex: 5 }}>
            {blockedEsportsRegistration ? (
              <div className="clusterCard border rounded-lg p-6 text-center bg-black/30">
                <p className="text-lg font-medium mb-2">Esports Registration Locked</p>
                <p className="text-md text-gray-300">You are already registered (captain or member) in another Esports event. Only one Esports event registration is allowed.</p>
                {(redeemedEventId || participationEventId) && (
                  <Link href={`/${cluster}/${encodeURIComponent(category)}/${encodeURIComponent((redeemedEventId || participationEventId) || '')}`} className="clusterButton mt-4">
                    View My Registered Esports Event
                  </Link>
                )}
              </div>
            ) : (
              isEsports ? (
                <EsportsTeamRegistration eventId={event.id} userId={userId || ''} />
              ) : (
                <TeamRegistrationClient
                  eventId={event.id}
                  captainId={userId || ""}
                  captainName={session?.user?.name || null}
                  minSize={1}
                  leaderHint={eligibleUniversal && !ownedEventIds.has(event.id)}
                />
              )
            )}
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