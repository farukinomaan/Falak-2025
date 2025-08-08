"use client";

import { useState } from "react";
import { submitSupportTicket } from "./actions";
import { toast } from "sonner";

import { ticketCategories } from "@/lib/validation/tickets";

export default function TicketsPage() {
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "success" } | { type: "error"; message: string }
  >({ type: "idle" });
  const [nonMahe, setNonMahe] = useState(false);

  async function onSubmit(formData: FormData) {
    setStatus({ type: "idle" });
    // sync checkbox value into formData as string
    formData.set("non_mahe_student", nonMahe ? "true" : "false");
    // Provide placeholder supabase details if missing, so server action does not crash
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
      toast.warning("Using placeholder SUPABASE_URL in mock mode");
    }
    const res = await submitSupportTicket(formData);
    if (res.ok) {
      setStatus({ type: "success" });
      toast.success("Ticket submitted");
    } else {
      setStatus({ type: "error", message: res.message });
      toast.error(res.message || "Failed to submit ticket");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Support Ticket</h1>
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Username</label>
          <input
            name="username"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Your name"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Phone</label>
          <input
            name="phone"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. 9876543210"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="non_mahe_student"
            type="checkbox"
            checked={nonMahe}
            onChange={(e) => setNonMahe(e.target.checked)}
          />
          <label htmlFor="non_mahe_student">Non MAHE student</label>
        </div>
        {!nonMahe && (
          <div className="space-y-1">
            <label className="block text-sm font-medium">College Registration Number</label>
            <input
              name="clg_registration_number"
              className="w-full border rounded px-3 py-2"
              placeholder="MAHE Reg No."
            />
          </div>
        )}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Category</label>
          <select name="category" className="w-full border rounded px-3 py-2">
            {ticketCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Problem</label>
          <textarea
            name="problem"
            required
            rows={5}
            className="w-full border rounded px-3 py-2"
            placeholder="Describe the issue..."
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-black text-white"
          disabled={status.type === "success"}
        >
          Submit
        </button>
        {status.type === "success" && (
          <p className="text-green-600">Ticket submitted successfully.</p>
        )}
        {status.type === "error" && (
          <p className="text-red-600">{status.message}</p>
        )}
      </form>
    </div>
  );
}

