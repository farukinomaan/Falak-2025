import React from 'react';
import Link from 'next/link';
import { Press_Start_2P } from "next/font/google";
import { RetroButton } from './nav-components/RetroButton';

const press = Press_Start_2P({ weight: "400", subsets: ["latin"] });

interface NavItem {
  id: string;
  label: string;
  href: string;
}

interface DesktopNavbarProps {
  show: boolean;
  navItems: NavItem[];
  activeSection: string;
  setActiveSection: (id: string) => void;
  rollNext: () => void;
  rollPrev: () => void;
}

export const DesktopNavbar: React.FC<DesktopNavbarProps> = ({ show, navItems, activeSection, setActiveSection, rollNext, rollPrev }) => {
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2, 4);

  return (
    <nav
      role="navigation"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 hidden xl:flex items-center justify-between gap-4 px-4 py-2
          rounded-lg shadow-lg border-2 transition-all duration-500
          ${press.className} ${show ? "translate-y-0" : "-translate-y-32"}`}
      style={{
        backgroundColor: "rgba(25, 25, 25, 0.95)",
        borderColor: "rgba(89, 144, 125, 0.6)",
        backdropFilter: "blur(12px)",
        minWidth: "450px",
        maxWidth: "700px",
        width: "80%",
        boxShadow: "0 6px 24px rgba(0,0,0,0.4), 0 0 15px rgba(244, 202, 142, 0.15)",
      }}
    >
      {/* Left spinner + nav */}
      <div className="flex items-center gap-2">
        <button
          onClick={rollPrev}
          className="relative w-6 h-6 flex-shrink-0 focus:outline-none group"
        >
          <div
            className="w-full h-full rounded-full shadow-md relative transition-transform duration-500 group-active:rotate-180"
            style={{
              background: "radial-gradient(circle, #59907D 0%, #191919 100%)",
              border: "1.5px solid #D24A58",
            }}
          >
            <div
              className="absolute inset-1 rounded-full border"
              style={{ borderColor: "rgba(244, 202, 142, 0.4)" }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#F4CA8E" }}
            />
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-orange-300 bg-opacity-50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-orange-300 bg-opacity-50" />
            </div>
          </div>
        </button>

        {/* Left buttons */}
        <div className="flex gap-1.5">
          {leftItems.map((item) => (
            <RetroButton
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              onClick={setActiveSection}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Center glowing display */}
      <div className="flex-1 flex justify-center">
        <div
          className="relative px-4 py-2 rounded-lg"
          style={{
            backgroundColor: "#191919",
            border: "1.5px solid #59907D",
            boxShadow:
              "inset 0 2px 6px rgba(0,0,0,0.7), 0 1px 3px rgba(244,202,142,0.3)",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded bg-orange-300 opacity-20 blur-sm"></div>
            <div
              className={`relative text-xs font-mono tracking-widest font-bold uppercase ${press.className}`}
              style={{
                color: "#F4CA8E",
                textShadow: "0 0 8px #F4CA8E, 0 0 12px #F4CA8E",
                fontFamily: "monospace",
                minWidth: "60px",
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
      </div>

      {/* Right nav + spinner */}
      <div className="flex items-center gap-2">
        {/* Right buttons */}
        <div className="flex gap-1.5">
          {rightItems.map((item) => (
            <RetroButton
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              onClick={setActiveSection}
              size="sm"
            />
          ))}
        </div>

        {/* Spinner with trigger */}
        <button
          onClick={rollNext}
          className="relative w-6 h-6 flex-shrink-0 focus:outline-none group"
        >
          <div
            className="w-full h-full rounded-full shadow-md relative transition-transform duration-500 group-active:-rotate-180"
            style={{
              background: "radial-gradient(circle, #59907D 0%, #191919 100%)",
              border: "1.5px solid #D24A58",
            }}
          >
            <div
              className="absolute inset-1 rounded-full border"
              style={{ borderColor: "rgba(244, 202, 142, 0.4)" }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#F4CA8E" }}
            />
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-orange-300 bg-opacity-50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-orange-300 bg-opacity-50" />
            </div>
          </div>
        </button>
      </div>
    </nav>
  );
};