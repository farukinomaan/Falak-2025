"use client";
import React, { useState } from "react";
import { useTransition } from "react";
import { toast } from "sonner";

interface Props {
  eventId: string;
  minSize?: number; // optional, default 1
  captainId: string;
  captainName?: string | null;
  onSuccess?: (teamId: string) => void;
  actionPath?: string; // POST endpoint
  useEmails?: boolean; // if true, send memberEmails instead of memberIds
  maxSize?: number; // optional maximum team size
}

export function TeamRegistrationForm({ eventId, minSize = 1, captainId, captainName, onSuccess, actionPath, useEmails = true, maxSize }: Props) {
  const endpoint = actionPath || (useEmails ? "/api/teams/createWithEmails" : "/api/teams/create");
  const createAsCaptainEndpoint = "/api/teams/createWithEmailsAsCaptain";
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<string[]>(Array.from({ length: minSize }, () => ""));
  const [leaderEmail, setLeaderEmail] = useState<string>(captainName || '');
  const [leaderValidation, setLeaderValidation] = useState<{ ok: boolean; message?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // On mount, try to fetch captain's email by captainId if a name was provided instead
  React.useEffect(() => {
    let mounted = true;
    async function fetchEmail() {
      try {
        if (!captainId) return;
        const res = await fetch(`/api/users/byId?userId=${encodeURIComponent(captainId)}`);
        const json = await res.json();
        if (!mounted) return;
        if (res.ok && json.ok && json.data?.email) {
          setLeaderEmail(json.data.email);
        } else if (captainName) {
          // fallback to showing captainName if email not found
          setLeaderEmail(captainName);
        }
      } catch {
        // ignore network errors
      }
    }
    fetchEmail();
    return () => { mounted = false; };
  }, [captainId, captainName]);

  function updateMember(i: number, val: string) {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? val : m)));
  }
  function addMember() {
    setMembers((prev) => {
      if (maxSize && prev.length >= maxSize) {
        toast.error(`Maximum team size is ${maxSize}`);
        return prev;
      }
      return [...prev, ""];
    });
  }
  function removeMember(i: number) {
    setMembers((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filtered = members.map(m => m.trim()).filter(Boolean);
    if (!teamName.trim()) {
      toast.error("Team name required");
      return;
    }
    if (filtered.length < minSize) {
      toast.error(`Need at least ${minSize} member${minSize>1?"s":""}`);
      return;
    }
    if (maxSize && filtered.length > maxSize) {
      toast.error(`Cannot exceed ${maxSize} members`);
      return;
    }
    if (useEmails) {
      const payload: Record<string, unknown> = { eventId, name: teamName.trim(), memberEmails: filtered };
  if (leaderEmail && leaderEmail.trim()) (payload as Record<string, unknown>)['captainEmail'] = leaderEmail.trim().toLowerCase();
      startTransition(async () => {
        try {
          const res = await fetch(createAsCaptainEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) {
            toast.error(json.error || "Failed to create team");
          } else {
            toast.success("Team registered");
            onSuccess?.(json.data.teamId);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Network error";
          toast.error(msg);
        }
      });
    } else {
      const payload = { eventId, captainId, name: teamName.trim(), memberIds: filtered };
      startTransition(async () => {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) {
            toast.error(json.error || "Failed to create team");
          } else {
            toast.success("Team registered");
            onSuccess?.(json.data.teamId);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Network error";
          toast.error(msg);
        }
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1 text-left">
        <label className="text-base font-medium">Team Name</label>
        <input
          className="w-full border rounded px-3 py-2 text-base"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter team name"
          required
        />
      </div>
      <div className="space-y-1 text-left">
        <label className="text-base font-medium">Team Leader (email)</label>
        <input
          className="w-full border rounded px-3 py-2 text-base"
          value={leaderEmail}
          onChange={(e) => { setLeaderEmail(e.target.value); setLeaderValidation(null); }}
          onBlur={async () => {
            const v = (leaderEmail || '').trim().toLowerCase();
            if (!v) { setLeaderValidation({ ok: false, message: 'Leader email required' }); return; }
            // Simple email format check
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setLeaderValidation({ ok: false, message: 'Invalid email format' }); return; }
            try {
              const res = await fetch(`/api/users/byEmail?email=${encodeURIComponent(v)}`);
              const json = await res.json();
              if (!res.ok || !json.ok) {
                setLeaderValidation({ ok: false, message: 'User not found' });
              } else {
                setLeaderValidation({ ok: true });
              }
            } catch {
              setLeaderValidation({ ok: false, message: 'Lookup failed' });
            }
          }}
        />
        {leaderValidation && !leaderValidation.ok && (
          <div className="text-xs text-red-400">{leaderValidation.message}</div>
        )}
      </div>
      {(maxSize === 0 && minSize === 0) ? (
        <div className="text-sm text-gray-600">Solo event – no additional members required.</div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-base font-medium">Team Members ({useEmails ? "Emails" : "User IDs"})</label>
            <button type="button" onClick={addMember} disabled={!!maxSize && members.length >= maxSize} className="text-xs px-2 py-1 rounded bg-black text-white disabled:opacity-40">Add Member</button>
          </div>
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="w-full border rounded px-3 py-2 text-base"
                value={m}
                onChange={(e) => updateMember(i, e.target.value)}
                placeholder={`Member #${i + 1} ${useEmails ? "email" : "userId"}`}
              />
              <button
                type="button"
                onClick={() => removeMember(i)}
                className="text-sm px-2 py-1 rounded bg-red-600 text-white disabled:opacity-50"
                disabled={members.length <= minSize}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="clusterButton clusterButton-form-submit w-full disabled:opacity-50 text-base"
      >
        {isPending ? "Registering..." : "Register"}
      </button>
    </form>
  );
}

export default TeamRegistrationForm;