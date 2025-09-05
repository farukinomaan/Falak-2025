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
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<string[]>(Array.from({ length: minSize }, () => ""));
  const [isPending, startTransition] = useTransition();

  function updateMember(i: number, val: string) {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? val : m)));
  }
  function addMember() {
    setMembers((prev) => (maxSize && prev.length >= maxSize ? prev : [...prev, ""]));
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
      toast.error(`Need at least ${minSize} member id${minSize>1?"s":""}`);
      return;
    }
    const payload = useEmails
      ? { eventId, name: teamName.trim(), memberEmails: filtered }
      : { eventId, captainId, name: teamName.trim(), memberIds: filtered };
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
        <label className="text-base font-medium">Team Leader</label>
        <input
          className="w-full border rounded px-3 py-2 text-base"
          value={captainName || captainId}
          disabled
        />
      </div>
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