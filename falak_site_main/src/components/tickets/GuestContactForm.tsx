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
<<<<<<< HEAD:falak_site_main/src/components/tickets/GuestContactForm.tsx
        ${standalone ? 'max-h-screen max-w-screen bg-[#32212C] backdrop-blur-sm rounded-2xl border-black/5 py-10 px-7' : 'bg-transparent'}
        text-neutral-50
      `}>
        <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-100 font-semibold mb-4 sm:mb-6 text-center">
        Support Ticket
      </h1>
  <p className="text-sm">
=======
        ${standalone ? 'font-roboto-mono max-h-screen max-w-screen bg-white/10 border-2 backdrop-blur-sm rounded-2xl border-white py-10 px-7' : 'bg-transparent'}
        text-neutral-50
      `}>
  <p className="text-sm text-center font-roboto-mono">
>>>>>>> 6a33e2e (landing page final):falak_site_main/src/app/tickets/GuestContactForm.tsx
    Not registered yet? Leave us a note and we&apos;ll reach out. This doesn&apos;t create a ticket in our system.
  </p>
      <div className="space-y-1 py-5">
        <label className="block text-sm font-medium font-orbitron">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
<<<<<<< HEAD:falak_site_main/src/components/tickets/GuestContactForm.tsx
          className="w-full border-2 rounded px-3 py-2 border-[#D3877A] focus:border-[#DBAAA6]"
=======
          className="w-full border rounded px-3 py-2 font-roboto-mono"
>>>>>>> 6a33e2e (landing page final):falak_site_main/src/app/tickets/GuestContactForm.tsx
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
<<<<<<< HEAD:falak_site_main/src/components/tickets/GuestContactForm.tsx
          className="w-full border-2 rounded px-3 py-2 border-[#D3877A]"
=======
          className="w-full border rounded px-3 py-2 font-roboto-mono"
>>>>>>> 6a33e2e (landing page final):falak_site_main/src/app/tickets/GuestContactForm.tsx
          placeholder="Type your question..."
          required
        />
      </div>
      <div className="mb-0 py-5">
      <center>
        <div className="text-center">
<<<<<<< HEAD:falak_site_main/src/components/tickets/GuestContactForm.tsx
      <button disabled={pending} className="px-4 py-2 rounded bg-[#de8c89] w-full hover:bg-[#DBAAA6] text-[#32212C] disabled:opacity-50">
=======
      <button disabled={pending} className="px-4 py-2 rounded bg-[#cbb4cc] text-black text-bold border-1 border-white hover:bg-[#513b61] hover:text-white disabled:opacity-50">
>>>>>>> 6a33e2e (landing page final):falak_site_main/src/app/tickets/GuestContactForm.tsx
        Send
      </button>
      </div>
      </center>
      </div>
      </div>
    </form>
    
    
  );
}
