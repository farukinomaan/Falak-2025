"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function GuestContactForm({standalone=true}) {
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
    <div className={`
        ${standalone ? 'max-h-screen max-w-screen bg-[#32212C] backdrop-blur-sm rounded-2xl border-black/5 py-10 px-7' : 'bg-transparent'}
        text-neutral-50
      `}>
        <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-100 font-semibold mb-4 sm:mb-6 text-center">
        Support Ticket
      </h1>
  <p className="text-sm">
    Not registered yet? Leave us a note and we&apos;ll reach out. This doesn&apos;t create a ticket in our system.
  </p>
      <div className="space-y-1 py-5">
        <label className="block text-sm font-medium">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="w-full border-2 rounded px-3 py-2 border-[#D3877A] focus:border-[#DBAAA6]"
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
          className="w-full border-2 rounded px-3 py-2 border-[#D3877A]"
          placeholder="Type your question..."
          required
        />
      </div>
      <div className="mb-0 py-5">
      <center>
        <div className="text-center">
      <button disabled={pending} className="px-4 py-2 rounded bg-[#de8c89] w-full hover:bg-[#DBAAA6] text-[#32212C] disabled:opacity-50">
        Send
      </button>
      </div>
      </center>
      </div>
      </div>
    </form>
    
    
  );
}
