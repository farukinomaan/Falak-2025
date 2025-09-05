"use client";
import React, { useState } from "react";
import TeamRegistrationForm from "@/components/teams/TeamRegistrationForm";

interface Props {
	eventId: string;
	captainId: string;
	captainName?: string | null;
	minSize?: number;
	maxSize?: number;
}

export default function TeamRegistrationClient(props: Props) {
	const [open, setOpen] = useState(false);
	const [teamId, setTeamId] = useState<string | null>(null);
	if (teamId) return <p className="text-sm text-emerald-600">Team registered (ID: {teamId}). Refresh to view details.</p>;
	return (
		<div className="space-y-3">
			<button
				onClick={() => setOpen(true)}
				className="clusterButton"
			>
				Register Team
			</button>
			{open && (
				<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 backdrop-blur-sm overflow-y-auto overflow-x-hidden">
					<div className="clusterCard w-full max-w-2xl space-y-4 p-8">
						<div className="flex items-center justify-between">
							<h2 className="text-2xl font-medium">Team Registration</h2>
							<button onClick={() => setOpen(false)} className="clusterButton">Close</button>
						</div>
						<div className="text-base">
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
			)}
		</div>
	);
}
