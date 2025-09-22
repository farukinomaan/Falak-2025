"use server";
import { getServiceClient } from "./supabaseClient";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function createEsportsTeam(params: { eventId: string; captainId: string; name: string }) {
  const { eventId, captainId, name } = params;
  if (!eventId || !captainId || !name.trim()) return { ok: false as const, error: "Missing required fields" };
  const supabase = getServiceClient();
  // Basic event validation + ensure it's esports
  const { data: evt, error: evtErr } = await supabase.from("Events").select("id, sub_cluster").eq("id", eventId).maybeSingle();
  if (evtErr) return { ok: false as const, error: evtErr.message };
  if (!evt) return { ok: false as const, error: "Event not found" };
  if ((evt.sub_cluster || '').toLowerCase() !== 'esports') return { ok: false as const, error: "Not an esports event" };
  // Ensure captain not already has a team for this event
  const { data: existing, error: exErr } = await supabase.from("Teams").select("id").eq("eventId", eventId).eq("captainId", captainId).maybeSingle();
  if (exErr) return { ok: false as const, error: exErr.message };
  if (existing) return { ok: false as const, error: "You already created a team for this event" };
  const { data: team, error: tErr } = await supabase.from("Teams").insert({ eventId, captainId, name: name.trim() }).select("id").single();
  if (tErr) return { ok: false as const, error: tErr.message };
  return { ok: true as const, data: { teamId: (team as { id: string }).id } };
}

export async function getEsportsTeam(teamId: string) {
  if (!teamId) return { ok: false as const, error: "Team id required" };
  const supabase = getServiceClient();
  const { data: team, error } = await supabase.from("Teams").select("id, name, eventId").eq("id", teamId).maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!team) return { ok: false as const, error: "Team not found" };
  // verify event is esports
  const { data: evt } = await supabase.from("Events").select("id, sub_cluster").eq("id", (team as { eventId: string }).eventId).maybeSingle();
  if (!evt || (evt.sub_cluster || '').toLowerCase() !== 'esports') return { ok: false as const, error: "Not an esports team" };
  return { ok: true as const, data: team as { id: string; name: string; eventId: string } };
}

export async function joinEsportsTeam(params: { teamId: string; userId: string }) {
  const { teamId, userId } = params;
  if (!teamId || !userId) return { ok: false as const, error: "Missing fields" };
  const supabase = getServiceClient();
  // Fetch team to get event & verify esports
  const teamRes = await getEsportsTeam(teamId);
  if (!teamRes.ok) return teamRes;
  const { eventId } = teamRes.data;
  // Capacity check: block if team full (members + captain >= max_team_size)
  try {
    const { data: evtRow, error: evtErr } = await supabase
      .from("Events")
      .select("id, max_team_size")
      .eq("id", eventId)
      .maybeSingle();
    if (evtErr) return { ok: false as const, error: evtErr.message };
    const maxSize = (evtRow as { max_team_size?: number | null } | null)?.max_team_size ?? null;
    if (typeof maxSize === 'number' && maxSize > 0) {
      const { count, error: cntErr } = await supabase
        .from("Team_members")
        .select("id", { count: "exact", head: true })
        .eq("teamId", teamId);
      if (cntErr) return { ok: false as const, error: cntErr.message };
      const currentMembers = typeof count === 'number' ? count : 0; // members only
      const totalWithCaptain = 1 + currentMembers; // add captain
      if (totalWithCaptain > maxSize) {
        return { ok: false as const, error: "Team is full" };
      }
    }
  } catch (e) {
    // Fail-safe: if capacity check fails unexpectedly, allow graceful join path to proceed
  }
  // Check if user already captain this team event
  const { data: existingCaptain, error: capErr } = await supabase.from("Teams").select("id").eq("eventId", eventId).eq("captainId", userId).maybeSingle();
  if (capErr) return { ok: false as const, error: capErr.message };
  if (existingCaptain) return { ok: false as const, error: "You are already captain of a team for this event" };
  // Check already member
  const { data: existingMember, error: memErr } = await supabase.from("Team_members").select("id").eq("eventId", eventId).eq("memberId", userId).maybeSingle();
  if (memErr) return { ok: false as const, error: memErr.message };
  if (existingMember) return { ok: false as const, error: "You already joined a team for this event" };
  const { error: insErr } = await supabase.from("Team_members").insert({ teamId, memberId: userId, eventId });
  if (insErr) return { ok: false as const, error: insErr.message };
  return { ok: true as const, data: { eventId, teamId } };
}
