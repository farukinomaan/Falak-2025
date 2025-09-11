"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { createEsportsTeam, joinEsportsTeam, getEsportsTeam } from "@/lib/actions/esportsTeams";

interface Props {
  eventId: string;
  userId: string;
}

export default function EsportsTeamRegistration({ eventId, userId }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [creating, startCreate] = useTransition();
  const [joining, startJoin] = useTransition();
  const [teamIdCreated, setTeamIdCreated] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [lookupResult, setLookupResult] = useState<{ id: string; name: string } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) { toast.error("Enter team name"); return; }
    startCreate(async () => {
  const res = await createEsportsTeam({ eventId, captainId: userId, name: teamName.trim() });
  if (!res.ok) { toast.error(res.error); return; }
  setTeamIdCreated(res.data.teamId);
  toast.success("Team created. Share the code with members.");
  // Refresh page so server component shows team card (slight delay so user sees toast)
  setTimeout(() => router.refresh(), 800);
    });
  }

  async function handleLookup(code: string) {
    const trimmed = code.trim();
    if (!trimmed) { setLookupResult(null); return; }
    // Only lookup on full UUID length (>= 8 maybe partial) -> require full length to reduce leakage
    if (trimmed.length < 8) { setLookupResult(null); return; }
    setLookupLoading(true);
    const res = await getEsportsTeam(trimmed);
    setLookupLoading(false);
    if (!res.ok) { setLookupResult(null); return; }
    setLookupResult({ id: res.data.id, name: res.data.name });
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) { toast.error("Enter code"); return; }
    startJoin(async () => {
  const res = await joinEsportsTeam({ teamId: joinCode.trim(), userId });
  if (!res.ok) { toast.error(res.error); return; }
  toast.success("Joined team successfully");
  setLookupResult(null);
  // Trigger refresh so the team info card appears
  setTimeout(() => router.refresh(), 600);
    });
  }

  return (
    <div className="clusterCard p-6 space-y-6">
      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={`px-4 py-2 rounded-md text-sm font-semibold ${tab === 'create' ? 'bg-[#dfc08f] text-black' : 'bg-black/40 text-white'}`}
        >
          Create Team
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className={`px-4 py-2 rounded-md text-sm font-semibold ${tab === 'join' ? 'bg-[#dfc08f] text-black' : 'bg-black/40 text-white'}`}
        >
          Join Team
        </button>
      </div>

      {tab === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          {teamIdCreated ? (
            <div className="space-y-3 text-center">
              <p className="text-lg font-medium">Team Created</p>
              <p className="text-sm">Team Code</p>
              <div className="flex items-center justify-center gap-2">
                <div className="bg-black/50 px-3 py-2 rounded-md font-mono text-xs sm:text-sm max-w-xs break-all">
                  {teamIdCreated}
                </div>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(teamIdCreated); toast.success("Code copied"); }}
                  className="p-2 rounded-md bg-black/50 hover:bg-black/70 border border-white/20 transition"
                  aria-label="Copy team code"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-xs italic text-yellow-200">Only give this to your team members.</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="teamName">Team Name</label>
                <input
                  id="teamName"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="w-full rounded-md bg-black/40 border border-white/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dfc08f]"
                  placeholder="Enter team name"
                  maxLength={48}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="clusterButton"
              >{creating ? 'Creating...' : 'Create'}</button>
            </>
          )}
        </form>
      )}

      {tab === 'join' && (
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="teamCode">Team Code</label>
            <input
              id="teamCode"
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value); handleLookup(e.target.value); }}
              className="w-full rounded-md bg-black/40 border border-white/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dfc08f]"
              placeholder="Paste team code"
            />
          </div>
          <div className="min-h-[60px] flex items-center justify-center text-center">
            {lookupLoading && <p className="text-sm opacity-70">Searching...</p>}
            {!lookupLoading && joinCode && !lookupResult && joinCode.length >= 8 && (
              <p className="text-xs text-red-300">No team found</p>
            )}
            {lookupResult && (
              <div className="text-sm space-y-1">
                <p className="font-medium">{lookupResult.name}</p>
                <p className="text-xs opacity-70">ID: {lookupResult.id}</p>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={joining || !lookupResult}
            className="clusterButton"
          >{joining ? 'Joining...' : 'Join Team'}</button>
        </form>
      )}
    </div>
  );
}
