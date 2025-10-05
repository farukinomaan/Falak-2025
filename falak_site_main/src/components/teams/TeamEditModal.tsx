"use client";
import React, { useState } from "react";
import { useTransition } from "react";
import { toast } from "sonner";

interface Props {
  teamId: string;
  eventId: string;
  initialName: string;
  captainId: string;
  captainName?: string | null;
  memberEmails: string[]; // existing members excluding captain
  minSize?: number; // adjusted (excluding captain)
  maxSize?: number; // adjusted (excluding captain)
}

export default function TeamEditModal({
  teamId,
  eventId,
  initialName,
  captainId,
  captainName,
  memberEmails,
  minSize = 0,
  maxSize,
}: Props) {
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState(initialName);
  // Initialize members array with current emails; ensure at least minSize slots
  const initialMembers = React.useMemo(() => {
    const base = [...memberEmails];
    while (base.length < minSize) base.push("");
    return base;
  }, [memberEmails, minSize]);
  const [members, setMembers] = useState<string[]>(initialMembers);
  const [isPending, startTransition] = useTransition();

  function updateMember(i: number, val: string) {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? val : m)));
  }
  function addMember() {
    setMembers((prev) => {
      if (maxSize && prev.length >= maxSize) {
        toast.error(`Maximum team size is ${maxSize + 1} including captain`);
        return prev;
      }
      return [...prev, ""];
    });
  }
  function removeMember(i: number) {
    setMembers((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filtered = members.map(m => m.trim().toLowerCase()).filter(Boolean);
    if (!teamName.trim()) {
      toast.error("Team name required");
      return;
    }
    if (filtered.length < minSize) {
      toast.error(`Need at least ${minSize} member${minSize>1?"s":""} (excluding captain)`);
      return;
    }
    if (maxSize && filtered.length > maxSize) {
      toast.error(`Cannot exceed ${maxSize} members (excluding captain)`);
      return;
    }
    const payload = { teamId, eventId, name: teamName.trim(), memberEmails: filtered };
    startTransition(async () => {
      try {
        const res = await fetch('/api/teams/updateWithEmails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          toast.error(json.error || 'Failed to update team');
        } else {
          toast.success('Team updated');
          setOpen(false);
          if (typeof window !== 'undefined') window.location.reload();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        toast.error(msg);
      }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="clusterButton alt w-full md:w-auto">Edit Team</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-xl p-6 relative">
            <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-neutral-400 hover:text-white" aria-label="Close">✕</button>
            <h2 className="text-2xl font-semibold mb-4">Edit Team</h2>
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
              {(maxSize === 0 && minSize === 0) ? (
                <div className="text-sm text-gray-400">Solo event – no additional members required.</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-medium">Team Members (Emails)</label>
                    <button type="button" onClick={addMember} disabled={!!maxSize && members.length >= maxSize} className="text-xs px-2 py-1 rounded bg-black text-white disabled:opacity-40">Add Member</button>
                  </div>
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        className="w-full border rounded px-3 py-2 text-base"
                        value={m}
                        onChange={(e) => updateMember(i, e.target.value)}
                        placeholder={`Member #${i + 1} email`}
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
                  <p className="text-xs text-gray-400">Remove all entries to clear members (must still satisfy min size).</p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="w-1/2 px-4 py-2 rounded border border-white/30 text-sm">Cancel</button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="clusterButton clusterButton-form-submit w-1/2 disabled:opacity-50 text-base"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
