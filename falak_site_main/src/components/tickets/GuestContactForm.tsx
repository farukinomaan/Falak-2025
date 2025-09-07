
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Orbitron } from "next/font/google";
import { Roboto_Mono } from "next/font/google"; 
const robotoMono = Roboto_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700"], 
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

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
        ${standalone ? 'font-roboto-mono max-h-screen max-w-screen bg-white/10 border-2 backdrop-blur-sm rounded-2xl border-white py-10 px-7' : 'bg-transparent'}
        text-neutral-50
      `}>
  <p className="text-sm text-center font-roboto-mono">
    Not registered yet? Leave us a note and we&apos;ll reach out. This doesn&apos;t create a ticket in our system.
  </p>
      <div className="space-y-1 py-5">
        <label className="block text-sm font-medium font-orbitron">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="w-full border rounded px-3 py-2 font-roboto-mono"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium font-orbitron">Query</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          className="w-full border rounded px-3 py-2 font-roboto-mono"
          placeholder="Type your question..."
          required
        />
      </div>
      <div className="mb-0 py-5">
      <center>
        <div className="text-center">
      <button disabled={pending} className="px-4 py-2 rounded bg-[#cbb4cc] text-black text-bold border-1 border-white hover:bg-[#513b61] hover:text-white disabled:opacity-50">
        Send
      </button>
      </div>
      </center>
      </div>
      </div>
    </form>
    
    
  );
}


