"use client";

import EventAdminPanel from "./EventAdminPanel";
import SuperAdminDashboard from "./SuperAdminDashboard";
import TicketAdminPanel from "./TicketAdminPanel";

export default function AdminManage({ role }: { role: string }) {
  const active = role;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      {active === "event_admin" && <EventAdminPanel />}
      {active === "super_admin" && <SuperAdminDashboard />}
      {active === "ticket_admin" && <TicketAdminPanel />}
      {!(active === "event_admin" || active === "super_admin" || active === "ticket_admin") && (
        <p>Unknown role: {active}</p>
      )}
    </div>
  );
}
