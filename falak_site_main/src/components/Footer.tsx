"use client";

import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#DBAAA6] text-[#2e1a47] border-t-4 border-[#513b61] relative overflow-hidden">
      {/* Retro radial background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(242,234,225,0.3)_0%,transparent_70%)]"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-2 md:grid-cols-3 gap-3 text-center md:text-left">
  {/* Fest Info - spans both columns on mobile */}
  <div className="mb-0 md:mb-0 col-span-2 md:col-span-1">
    <h2 className="retro-heading text-2xl sm:text-3xl tracking-widest">
      FALAK 2025
    </h2>
    <p className="text-[#2e1a47]/90 mt-3 text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-line">
      Manipal Institute of Technology{"\n"}Yelahanka, Bengaluru{"\n"}Karnataka - 560064
    </p>
  </div>

  {/* Quick Links */}
  <div className="mb-8 md:mb-0">
    <h2 className="retro-heading text-xl sm:text-2xl mb-3">Quick Links</h2>
    <ul className="space-y-2 font-mono text-[#2e1a47]/90 text-sm sm:text-base">
      <li>
        <a className="hover:text-[#2e1a47] underline">
          Privacy Policy
        </a>
      </li>
      <li>
        <a className="hover:text-[#2e1a47] underline">
          Terms of Service
        </a>
      </li>
      <li className="flex items-center gap-2 justify-center md:justify-start">
  <MapPin size={18} aria-hidden="true" />
  <span>MIT Bengaluru</span>
</li>
    </ul>
  </div>

  {/* Contact */}
<div>
  <h2 className="retro-heading text-xl sm:text-2xl mb-3">Contact Us</h2>
  <ul className="space-y-3 font-mono text-[#2e1a47]/90 text-sm sm:text-base">
    <li className="text-xs flex items-center gap-2 justify-center md:justify-start">
      <Mail size={18} aria-hidden="true" />
      <a href="mailto:fest@falak2025.com" className="hover:underline">
      fest.mitblr@manipal.edu
      </a>
    </li>

    <li className="flex flex-col justify-center md:justify-start">
  <div className="flex items-center gap-2">
    <Phone size={18} aria-hidden="true" />
    <span className="text-sm">+91 90281 86267</span>
  </div>
  <span className="text-xs font-semibold text-[#2e1a47]/80 pl-6">
    Swaraj Shewale, HR Head
  </span>
</li>

<li className="flex flex-col justify-center md:justify-start">
  <div className="flex items-center gap-2">
    <Phone size={18} aria-hidden="true" />
    <span className="text-sm">+91 95353 90081</span>
  </div>
  <span className="text-xs font-semibold text-[#2e1a47]/80 pl-6">
    Aishani Sharma, HR Head
  </span>
</li>

  </ul>
</div>

</div>


      {/* Bottom bar */}
      <div className="relative text-center py-3 sm:py-4 border-t border-[#2e1a47]/40 text-xs sm:text-sm text-[#2e1a47]/80 font-mono">
        © {new Date().getFullYear()} FALAK 2025 · All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
