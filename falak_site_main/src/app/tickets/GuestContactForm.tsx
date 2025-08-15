"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function GuestContactForm() {
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => {
          toast.success("Thanks! We received your message. We'll get back soon.");
          setEmail("");
          setQuery("");
        });
      }}
      className="space-y-4"
    >
      <p className="text-sm text-gray-700">
        Not registered yet? Leave us a note and we&apos;ll reach out. This doesn&apos;t create a ticket in our system.
      </p>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="w-full border rounded px-3 py-2"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Query</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          className="w-full border rounded px-3 py-2"
          placeholder="Type your question..."
          required
        />
      </div>
      <button disabled={pending} className="px-4 py-2 rounded bg-black text-white">
        Send
      </button>
    </form>
  );
}
