// Shared server-side helpers for Sports & Cultural event pages to avoid duplication.
// Each function returns the JSX formerly duplicated in individual route files.

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  saListAllEvents,
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
import TeamEditModal from "@/components/teams/TeamEditModal";
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
  rules?: string | null;
  venue: string;
  time?: string | null;
  sub_cluster: string;
  cluster_name?: string | null;
  date?: string | Date | null;
  price?: number | string | null;
  prize?: string | number | null; // Added: prize / prize pool information
  min_team_size?: number | null;
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
  const res = await saListAllEvents();
  const events = res.ok ? (res.data as EvtBase[]) : [];

  // Include disabled events so they still appear (will be marked Unavailable later)
  const filtered = events
    .filter((e) => (e.cluster_name || "").toLowerCase() === cluster);
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
  saListAllEvents(),
    saListPasses(),
    userId ? saListUserTeamEventIds(userId) : Promise.resolve({ ok: true as const, data: [] as string[] }),
    userId ? computeUserAccessibleEventIds(userId) : Promise.resolve({ eventIds: [] }),
  ]);

  const ownedPassIds = new Set<string>(ownedRes.ok ? ownedRes.data : []);
  type PassLite = { id: string; event_id?: string | null; mahe?: boolean | null; cost?: number | string | null };
  const passes = passesRes.ok ? (passesRes.data as PassLite[]) : [];
  const ownedEventIds = new Set<string>();
  for (const p of passes) if (p.event_id && ownedPassIds.has(p.id)) ownedEventIds.add(p.event_id);
  // Incorporate unified access layer (includes esports bundle / Falak25 esports full bundle / proshow unlocks)
  const accessibleIds = new Set<string>(accessibleRes.eventIds || []);
  const teamEventIds = new Set<string>(teamEvtRes.ok ? teamEvtRes.data : []);
  // Include disabled events; gating handled in UI (Unavailable state)
  const events = eventsRes.ok ? ((eventsRes.data as EvtBase[]) || []) : [];

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
              const disabled = !(e.enable ?? true);
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
                      <div className={`status-tag ${disabled ? 'unavailable' : inTeam ? 'in-team' : owned ? 'owned' : 'available'}`}>
                        {disabled ? 'Unavailable' : inTeam ? "In Team" : owned ? "Owned" : userIsMahe ? "MAHE" : "Available"}
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <Link
                          className="clusterButton"
                          href={`/${cluster}/${encodeURIComponent(decodedCategory)}/${encodeURIComponent(e.id)}`}
                        >
                          Go to Event Page
                        </Link>
                        {!disabled && !owned && userIsMahe && (
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
  saListAllEvents(),
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
  const disabled = !(event.enable ?? true);
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
  // Use time from DB directly; it's authoritative and not derived from date
  const timeStr = (typeof event.time === 'string' ? event.time : null) || undefined;
  const minTeamSize = typeof event.min_team_size === 'number' && event.min_team_size > 0 ? event.min_team_size : null;
  const maxTeamSize = typeof event.max_team_size === 'number' && event.max_team_size > 0 ? event.max_team_size : null;
  let teamSizeLabel: string | null = null;
  if (minTeamSize && maxTeamSize) {
    if (minTeamSize === maxTeamSize) teamSizeLabel = `${minTeamSize} player${minTeamSize === 1 ? '' : 's'}`;
    else teamSizeLabel = `${minTeamSize}-${maxTeamSize} players`;
  } else if (minTeamSize) {
    teamSizeLabel = `Min ${minTeamSize}`;
  } else if (maxTeamSize) {
    teamSizeLabel = `Up to ${maxTeamSize}`;
  }

  // Price comes from the Pass mapped to this event (not from the Event itself)
  type PassWithCost = PassLite & { cost?: number | string | null };
  const passesWithCost = (passes as unknown as PassWithCost[]);
  const eventPasses = passesWithCost.filter(p => (p.event_id || "") === event.id);
  const nonMaheEventPass = eventPasses.find(p => p.mahe !== true) || eventPasses[0];
  const priceStr = (nonMaheEventPass && (typeof nonMaheEventPass.cost === "number" || typeof nonMaheEventPass.cost === "string"))
    ? String(nonMaheEventPass.cost)
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
            {disabled && (
              <div className="rounded-lg border border-red-500/40 bg-red-900/30 text-red-200 px-4 py-3 text-sm leading-relaxed">
                This event is currently <strong>unavailable</strong>. Registration and new purchases are disabled while it is deactivated.
              </div>
            )}
            {event.description && (
              <p className="text-gray-300 whitespace-pre-line text-lg">{event.description}</p>
            )}
            {(() => {
              // Build rules link (existing logic) AND prize badge aligned horizontally
              const rawRules = (event.rules || '').trim();
              const match = rawRules.match(/https?:\/\/[^\s]+/i);
              const url = match ? match[0] : (rawRules.startsWith('http://') || rawRules.startsWith('https://') ? rawRules : null);
              const rawPrize = (event as { prize?: string | number | null }).prize;
              const hasPrize = !(rawPrize === undefined || rawPrize === null || String(rawPrize).trim() === '');
              if (!url && !hasPrize) return null;
              let prizeFragment: React.ReactNode = null;
              if (hasPrize) {
                const prizeStrRaw = String(rawPrize).trim();
                const isNumeric = /^\d+(?:[.,]\d+)?$/.test(prizeStrRaw.replace(/,/g, ''));
                const prizeStr = isNumeric ? `₹${prizeStrRaw.replace(/\.0+$/, '')}` : prizeStrRaw;
                prizeFragment = (
                  <div className="prize-badge inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black font-semibold shadow-lg ring-2 ring-amber-300/60 ring-offset-2 ring-offset-black self-start ml-auto">
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-5 h-5'>
                      <path d='M7 2a1 1 0 0 0-1 1v3a6 6 0 0 0 4 5.659V17H7a1 1 0 1 0 0 2h4v2.382a1 1 0 0 0 1.553.833L15 20.764 17.447 22.215A1 1 0 0 0 19 21.382V19h4a1 1 0 1 0 0-2h-3V11.659A6 6 0 0 0 23 6V3a1 1 0 0 0-1-1H7Zm1 2h14v2a4 4 0 1 1-8 0 1 1 0 1 0-2 0 4 4 0 1 1-4-4v2Z'/>
                    </svg>
                    <span className="uppercase tracking-wide text-xs md:text-sm font-bold text-black/70">Prize</span>
                    <span className="text-xl md:text-2xl font-bold">{prizeStr}</span>
                  </div>
                );
              }
              return (
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mt-2">
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-amber-300 hover:text-white underline decoration-dotted underline-offset-4"
                    >
                      View Event Rules / Guidelines
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M13 3a1 1 0 0 0 0 2h4.586l-9.293 9.293a1 1 0 1 0 1.414 1.414L19 6.414V11a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-7Z" />
                        <path d="M5 5a2 2 0 0 0-2 2v12c0 1.103.897 2 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 1 0-2 0v5H5V7h5a1 1 0 1 0 0-2H5Z" />
                      </svg>
                    </a>
                  )}
                  {prizeFragment}
                </div>
              );
            })()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-md border-t border-gray-600 pt-6">
              <p><span className="font-semibold text-gray-400">Category:</span> {event.sub_cluster}</p>
              <p><span className="font-semibold text-gray-400">Venue:</span> {event.venue}</p>
              {dateStr && <p><span className="font-semibold text-gray-400">Date:</span> {dateStr} <span>*</span></p>}
              {timeStr && <p><span className="font-semibold text-gray-400">Time:</span> {timeStr} <span>*</span></p>}
              {teamSizeLabel && (
                <p><span className="font-semibold text-gray-400">Team Size:</span> {teamSizeLabel}</p>
              )}
              {userIsMahe ? (
                <p><span className="font-semibold text-gray-400">Pass:</span> {(event.sub_cluster || '').toLowerCase() === 'esports' ? 'Esports Pass' : 'Pro-show Pass'}</p>
              ) : (
                ""
              )}
            </div>
            {(() => {
              if (existingTeam) {
                const capId = existingTeam.team.captainId;
                const capInfo = capId ? memberUsersById?.get(capId) : undefined;
                return (
                  <div className="space-y-3 border rounded-lg p-4 bg-black/20">
                    <h2 className="text-xl font-medium flex items-center gap-2">
                      Your Team
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-600/20 text-green-300 border border-green-500/40">
                        Confirmed
                      </span>
                    </h2>
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
                    <div className="flex flex-col md:flex-row gap-3 pt-2">
                      <Link
                        href="/profile"
                        className="clusterButton w-full md:w-auto"
                      >
                        My Passes
                      </Link>
                      {/* Show edit only to captain, and not for Esports events */}
                      {userId && capId === userId && !isEsports && (
                        <TeamEditModal
                          teamId={existingTeam.team.id}
                          eventId={event.id}
                          initialName={existingTeam.team.name}
                          captainId={userId}
                          captainName={capInfo?.name || capInfo?.email || null}
                          memberEmails={existingTeam.members.map(m => {
                            const info = memberUsersById?.get(m.memberId);
                            return (info?.email || '').toLowerCase();
                          }).filter(e => !!e)}
                          // Adjusted sizes exclude captain (same logic used in registration below)
                          minSize={minTeamSize ? Math.max(minTeamSize - 1, 0) : 0}
                          maxSize={maxTeamSize ? Math.max(maxTeamSize - 1, 0) : undefined}
                        />
                      )}
                    </div>
                  </div>
                );
              }
              if (!owned && !disabled) {
                // Non-MAHE: always show Add to Cart for the specific event
                if (!userIsMahe) {
                  return (
                    <div className="flex items-center justify-end gap-4">
                      {priceStr && (
                        <div className="text-3xl font-semibold text-white">
                          <span className="mr-1">₹</span>{priceStr}{" "}
                          <span className="text-xs text-gray-300 align-top">+gst</span>
                        </div>
                      )}
                      <AddToCartButton passId={event.id} className="clusterButton" />
                    </div>
                  );
                }
                // MAHE: unified pass CTA
                return (
                  <Link href="/passes" className="clusterButton">
                    Get Access
                  </Link>
                );
              }
              if (!owned && disabled) {
                return (
                  <div className="flex items-center justify-end gap-4">
                    <div className="text-lg font-medium text-red-300">Unavailable</div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>

        
    {owned && !existingTeam && !disabled && (
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
                // Adjust min/max to account for captain already counted in event team size.
                // If event requires 7 total, user should add only 6 additional members.
                (() => {
                  // Special-case: Shark Tank registration redirects to external link instead of in-app form
                  const isSharkTank = (event.name || '').trim().toLowerCase() === 'shark tank';
                  if (isSharkTank) {
                    return (
                      <a
                        href="https://unstop.com/p/shark-tank-falak-2025-manipal-institute-of-technology-bengaluru-1561237"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clusterButton"
                      >
                        Go to Unstop
                      </a>
                    );
                  }
                  const adjustedMin = minTeamSize ? Math.max(minTeamSize - 1, 0) : 0;
                  const adjustedMax = maxTeamSize ? Math.max(maxTeamSize - 1, 0) : undefined;
                  return (
                <TeamRegistrationClient
                  eventId={event.id}
                  captainId={userId || ""}
                  captainName={session?.user?.name || null}
                  minSize={adjustedMin}
                  maxSize={adjustedMax}
                  leaderHint={eligibleUniversal && !ownedEventIds.has(event.id)}
                  clusterName={cluster}
                />
                  );
                })()
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
  const res = await saListAllEvents();
  const events = res.ok ? (res.data as EvtBase[]) : [];

  const filtered = events.filter((e) => (e.cluster_name || "").toLowerCase() === cluster);
  const subs = Array.from(new Set(filtered.map((e) => e.sub_cluster).filter(Boolean)));
  return subs.map((s) => ({ category: s }));
}

export async function getClusterEventParams(cluster: string) {
  // Backend logic re-enabled
  const res = await saListAllEvents();
  const events = res.ok ? (res.data as EvtBase[]) : [];
  
  const filtered = events.filter((e) => (e.cluster_name || "").toLowerCase() === cluster);
  return filtered.map((e) => ({ category: e.sub_cluster, slug: e.id }));
}