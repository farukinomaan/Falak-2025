"use client";

import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#7a1c1c] text-[#f2eae1] border-t-4 border-[#f2eae1] relative overflow-hidden">
      {/* Retro radial background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(242,234,225,0.3)_0%,transparent_70%)]"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Fest Info */}
        <div>
          <h2 className="retro-heading text-2xl md:text-3xl tracking-widest">
            FALAK 2025
          </h2>
          <p className="mt-2 text-sm font-mono text-[#f2eae1]/90">
            Manipal Institute of Technology <br />
            Yelahanka, Bengaluru <br />
            Karnataka - 560064
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="retro-heading text-xl mb-3">Quick Links</h2>
          <ul className="space-y-2 font-mono text-[#f2eae1]/90">
            <li>
              <a href="/privacy" className="hover:text-[#f2eae1] underline">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-[#f2eae1] underline">
                Terms of Service
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h2 className="retro-heading text-xl mb-3">Contact Us</h2>
          <ul className="space-y-2 font-mono text-[#f2eae1]/90">
            <li className="flex items-center justify-center md:justify-start gap-2">
              <Mail size={16} /> fest@falak2025.com
            </li>
            <li className="flex items-center justify-center md:justify-start gap-2">
              <Phone size={16} /> +91 98765 43210
            </li>
            <li className="flex items-center justify-center md:justify-start gap-2">
              <MapPin size={16} /> MIT, Yelahanka Campus
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative text-center py-4 border-t border-[#f2eae1]/40 text-xs text-[#f2eae1]/80 font-mono">
        © {new Date().getFullYear()} FALAK 2025 · All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
