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
				className="inline-block text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
			>
				Register Team
			</button>
			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="bg-white w-full max-w-md rounded-lg p-6 space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-medium">Team Registration</h2>
							<button onClick={() => setOpen(false)} className="text-xs px-2 py-1 rounded bg-gray-200">Close</button>
						</div>
						<div>
								Note: Make sure your team members have registered on the site.
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
