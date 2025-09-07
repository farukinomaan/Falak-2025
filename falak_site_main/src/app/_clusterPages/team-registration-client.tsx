'use client';
import React, { useState } from "react";
import { toast } from "sonner";
import TeamRegistrationForm from "@/components/teams/TeamRegistrationForm";

interface Props {
	eventId: string;
	captainId: string;
	captainName?: string | null;
	minSize?: number;
	maxSize?: number;
	leaderHint?: boolean; // show leader-only purchase hint when eligibility comes from proshow pass
}

export default function TeamRegistrationClient(props: Props) {
	const [open, setOpen] = useState(false);
	const [teamId, setTeamId] = useState<string | null>(null);

	if (teamId) {
		return <p className="text-lg text-center text-emerald-400">Team registered (ID:{teamId}). Refresh to view details.</p>;
	}

	if (!open) {
		return (
			<div className="text-center">
				<button
					onClick={() => {
						setOpen(true);
						if (props.leaderHint) {
							toast.info("Only the team leader must purchase access to this event.");
						}
					}}
					className="clusterButton cluster-root-button"
				>
					Register Your Team
				</button>
			</div>
		);
	}

	return (
		<div className="clusterCard team-registration-modal w-full max-w-2xl mx-auto p-8" style={{ minHeight: '50vh' }}>
			<button
				onClick={() => setOpen(false)}
				className="team-reg-close-button"
			>
				Close
			</button>

			{/* Header */}
			<div className="mb-4">
				<h2 className="text-2xl font-medium">Team Registration</h2>
			</div>

			{/* Body (scrollable) */}
			<div className="flex-grow overflow-y-auto py-4">
				<div className="text-base mb-4">
					Note: Make sure your team members have registered on the site and have purchased passes for this event.
				</div>
				<TeamRegistrationForm
					eventId={props.eventId}
					captainId={props.captainId}
					captainName={props.captainName}
					minSize={props.minSize}
					maxSize={props.maxSize}
					useEmails={true}
					onSuccess={(id) => {
						setTeamId(id);
						setOpen(false);
					}}
				/>
			</div>
		</div>
	);
}