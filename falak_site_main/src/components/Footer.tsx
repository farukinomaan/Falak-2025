"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Mail, MessageSquareText } from "lucide-react";

interface SessionShape { user?: { mahe?: boolean | null } }

async function fetchSessionMahe(): Promise<boolean | null> {
  try {
    // NextAuth exposes the session at this endpoint client-side
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!res.ok) return null;
    const json: SessionShape = await res.json();
    return json?.user?.mahe ?? null;
  } catch {/* ignore */}
  return null;
}

const Footer: React.FC = () => {
  const [isMahe, setIsMahe] = useState<boolean | null>(null);
  useEffect(() => { fetchSessionMahe().then(setIsMahe); }, []);

  const maheContacts = [
    { name: 'Adrita Mitra, HR Team', phone: '+91 76058 92406' },
    { name: 'Aditya Akkannavar, HR Team', phone: '+91 93183 02452' },
  ];
  const defaultContacts = [
    { name: 'Aishani Sharma, HR Head', phone: '+91 95353 90081' },
    { name: 'Swaraj Shewale, HR Head', phone: '+91 90281 86267' },
  ];
  const contacts = isMahe ? maheContacts : defaultContacts;

  return (
    <footer className="bg-[#32212C] text-[#DBAAA6] border-t-4 border-[#D7897D] relative overflow-hidden">
      {/* Retro radial background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(242,234,225,0.3)_0%,transparent_70%)]"></div>

      <div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 
                   grid grid-cols-2 md:grid-cols-3 gap-8 items-center"
      >
        {/* Fest Info */}
        <div className="flex flex-col items-start text-left">
          <h2 className="vintage-font text-2xl sm:text-3xl tracking-widest">
            FALAK&#39;25
          </h2>
          <p className="abhaya-font text-[#DBAAA6] mt-3 text-sm sm:text-base font-mono leading-relaxed whitespace-pre-line">
            Manipal Institute of Technology{"\n"}Yelahanka, Bengaluru{"\n"}
            Karnataka - 560064
          </p>
        </div>

        {/* Center Logo - only visible on md+ */}
        <div className="hidden md:flex justify-center">
          <Image
            src="/images/logo.png"
            alt="Falak Logo"
            width={300}
            height={300}
            className="object-contain"
          />
        </div>

        {/* Contact */}
        <div className="flex flex-col items-end text-right">
          <h2 className="vintage-font text-xl sm:text-2xl mb-3">Contact Us</h2>
          <ul className="space-y-3 font-mono text-[#DBAAA6] text-sm sm:text-base">
            <li className="flex items-center justify-end gap-2">
              <Mail size={18} aria-hidden="true" />
              <a
                href="mailto:fest.mitblr@manipal.edu"
                className="hover:underline text-xs sm:text-base"
              >
                fest.mitblr@manipal.edu
              </a>
            </li>
            {contacts.map(c => (
              <li key={c.phone} className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <MessageSquareText size={18} aria-hidden="true" />
                  <span className="text-sm">{c.phone}</span>
                </div>
                <span className="text-xs font-semibold text-[#DBAAA6]">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative text-center py-3 sm:py-4 border-t border-[#D7897D]/40 text-xs sm:text-sm text-[#DBAAA6]/80 font-mono">
        © {new Date().getFullYear()} FALAK 2025 · All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
