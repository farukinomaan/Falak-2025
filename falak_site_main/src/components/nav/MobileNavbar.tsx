import React from 'react';
import Link from 'next/link';
import { Press_Start_2P } from "next/font/google";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"] });

interface MobileNavbarProps {
  show: boolean;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  activeSection: string;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ show, isMobileMenuOpen, toggleMobileMenu, activeSection }) => {
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex xl:hidden items-start justify-between p-4 transition-all duration-500 ${show ? 'translate-y-0' : '-translate-y-32'}`}>
      {/* Logo container top left */}
      <div className={`pointer-events-auto transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}>
        <Link href="/">
          <h1 className="special-font hero-heading text-white">
            F<b>A</b>LAK
          </h1>
        </Link>
      </div>

      {/* Top-right notch with display and menu */}
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg shadow-lg border-2 transition-all duration-500 ${press.className}`}
        style={{
          backgroundColor: "rgba(25, 25, 25, 0.95)", 
          borderColor: "rgba(89, 144, 125, 0.6)", 
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(244, 202, 142, 0.15)",
        }}
      >
        {/* Cyber display - smaller */}
        <div
          className="relative px-2 py-1 rounded"
          style={{
            backgroundColor: "#191919", 
            border: "1px solid #59907D", 
            boxShadow:
              "inset 0 1px 4px rgba(0,0,0,0.7), 0 1px 2px rgba(244,202,142,0.3)",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded bg-orange-300 opacity-20 blur-sm"></div>
            <div
              className={`relative font-mono tracking-wider font-bold uppercase ${press.className}`}
              style={{
                color: "#F4CA8E", 
                textShadow: "0 0 6px #F4CA8E, 0 0 8px #F4CA8E",
                fontFamily: "monospace",
                fontSize: "10px",
                minWidth: "40px",
                textAlign: "center",
              }}
            >
              {activeSection.toUpperCase()}
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="h-full w-full opacity-40"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(244,202,142,0.15) 1px, rgba(244,202,142,0.15) 2px)",
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Menu Button - smaller */}
        <button
          onClick={toggleMobileMenu}
          className="relative w-8 h-8 flex-shrink-0 focus:outline-none group rounded-full overflow-hidden"
          style={{
            background: isMobileMenuOpen
              ? "radial-gradient(circle, #D24A58 0%, #191919 70%)" 
              : "radial-gradient(circle, #59907D 0%, #191919 100%)", 
            border: `1.5px solid ${isMobileMenuOpen ? "#F4CA8E" : "#59907D"}`, 
            boxShadow: isMobileMenuOpen
              ? "0 0 16px rgba(210, 74, 88, 0.6), 0 3px 8px rgba(0,0,0,0.4)"
              : "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          {/* Pulsing ring when active */}
          {isMobileMenuOpen && (
            <div
              className="absolute inset-0 rounded-full border-2 animate-pulse opacity-75"
              style={{
                borderColor: "#F4CA8E", 
                animationDuration: "1.5s"
              }}
            />
          )}

          {/* Center dot - smaller */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${
              isMobileMenuOpen ? "w-2 h-2 animate-pulse" : "w-1 h-1"
            }`}
            style={{
              backgroundColor: "#F4CA8E", 
              boxShadow: isMobileMenuOpen ? "0 0 8px #F4CA8E" : "0 0 4px #F4CA8E"
            }}
          />

          {/* Animated lines forming menu icon - smaller */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`absolute w-3 h-0.5 transition-all duration-500 ${
                isMobileMenuOpen
                  ? "rotate-45 opacity-100"
                  : "rotate-0 opacity-70 -translate-y-0.5"
              }`}
              style={{
                backgroundColor: "#F4CA8E", 
                boxShadow: isMobileMenuOpen ? "0 0 6px rgba(244,202,142,0.8)" : "none",
              }}
            />
            <div
              className={`absolute w-3 h-0.5 transition-all duration-500 ${
                isMobileMenuOpen ? "opacity-0 scale-0" : "opacity-70"
              }`}
              style={{
                backgroundColor: "#F4CA8E", 
              }}
            />
            <div
              className={`absolute w-3 h-0.5 transition-all duration-500 ${
                isMobileMenuOpen
                  ? "-rotate-45 opacity-100"
                  : "rotate-0 opacity-70 translate-y-0.5"
              }`}
              style={{
                backgroundColor: "#F4CA8E", 
                boxShadow: isMobileMenuOpen ? "0 0 6px rgba(244,202,142,0.8)" : "none",
              }}
            />
          </div>

          {/* Rotating outer ring - smaller */}
          <div className={`absolute inset-0.5 rounded-full border border-opacity-40 ${isMobileMenuOpen ? 'animate-spin' : ''}`}
            style={{
              borderColor: isMobileMenuOpen ? "rgba(244,202,142,0.6)" : "rgba(244,202,142,0.4)",
              animationDuration: "3s"
            }}
          />
        </button>
      </div>
    </div>
  );
};