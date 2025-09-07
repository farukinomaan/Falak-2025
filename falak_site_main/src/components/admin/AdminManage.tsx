"use client";

import EventAdminPanel from "./EventAdminPanel";
import SuperAdminDashboard from "./SuperAdminDashboard";
import TicketAdminPanel from "./TicketAdminPanel";

export default function AdminManage({ role }: { role: string }) {
  const active = role;

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-6 text-white">
      <style>{`
        /* Improve contrast for admin tables and cards on dark background */
        .admin-scope table { color: #fff; }
        .admin-scope th { color: #fff; border-color: rgba(255,255,255,0.2); }
        .admin-scope td { color: #fff; border-color: rgba(255,255,255,0.2); }
        .admin-scope .border { border-color: rgba(255,255,255,0.2) !important; }
        .admin-scope .bg-muted { background-color: rgba(255,255,255,0.08) !important; }
        .admin-scope .text-muted-foreground { color: rgba(255,255,255,0.75) !important; }
        .admin-scope .bg-background { background-color: rgba(20,20,20,0.95) !important; color: #fff; }
        .admin-scope input, .admin-scope select, .admin-scope textarea {
          background-color: rgba(0,0,0,0.4) !important;
          color: #fff !important;
          border-color: rgba(255,255,255,0.3) !important;
        }
        .admin-scope input::placeholder, .admin-scope textarea::placeholder { color: rgba(255,255,255,0.6) !important; }
        .admin-scope .bg-primary { background-color: #dfc08f !important; color: #000 !important; }
        .admin-scope .text-primary { color: #dfc08f !important; }
      `}</style>
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="admin-scope space-y-6">
        {active === "event_admin" && <EventAdminPanel />}
        {active === "super_admin" && <SuperAdminDashboard />}
        {active === "ticket_admin" && <TicketAdminPanel />}
      </div>
      {!(active === "event_admin" || active === "super_admin" || active === "ticket_admin") && (
        <p>Unknown role: {active}</p>
      )}
    </div>
  );
}
