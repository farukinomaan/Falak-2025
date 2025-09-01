"use client";

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
  // activeSection prop deprecated; kept optional for backward compatibility
  activeSection?: string;
  setActiveSection: (id: string) => void;
  rollNext: () => void;
  rollPrev: () => void;
}

export const DesktopNavbar: React.FC<DesktopNavbarProps> = ({ show, navItems, setActiveSection, rollNext, rollPrev }) => {
  const pathname = usePathname();
  // Spinner rotation state (persistent incremental rotation each click)
  const [leftAngle, setLeftAngle] = useState(0);
  const [rightAngle, setRightAngle] = useState(0);
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2, 4);

  const [eventsOpen, setEventsOpen] = useState(false);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const openDropdown = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setEventsOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => { setEventsOpen(false); }, 160);
  };
  useEffect(()=>()=>{ if (closeTimer.current) clearTimeout(closeTimer.current); },[]);
  const eventsItem = navItems.find(n => n.id === 'events');
  const dropdownItems = [
    { id: 'sports', label: 'Sports', href: '/sports' },
    { id: 'cultural', label: 'Cultural', href: '/cultural' }
  ];

  // Determine if the current route matches a nav item; fallback to prop-based activeSection if it also matches
  const matched = useMemo(() => {
    if (!pathname) return null;
    // Sports & Cultural should map to Events label for center display
    if (pathname.startsWith('/sports') || pathname.startsWith('/cultural')) {
      return navItems.find(n => n.id === 'events') || null;
    }
    return navItems.find(n => pathname === n.href || pathname.startsWith(n.href + '/')) || null;
  }, [pathname, navItems]);

  const effectiveActiveId = matched ? matched.id : undefined;
  const centerLabel = matched ? matched.label.toUpperCase() : "-------";

  return (
    <nav
      role="navigation"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 hidden xl:flex items-stretch justify-center gap-3 px-3 py-2
          rounded-xl shadow-lg border-2 transition-all duration-500
          ${press.className} ${show ? "translate-y-0" : "-translate-y-32"}`}
      style={{
        backgroundColor: "rgba(25, 25, 25, 0.95)",
        borderColor: "rgba(89, 144, 125, 0.6)",
        backdropFilter: "blur(12px)",
        minWidth: "560px",
        maxWidth: "760px",
        width: "72%",
        boxShadow: "0 6px 28px rgba(0,0,0,0.45), 0 0 18px rgba(244, 202, 142, 0.18)",
      }}
    >
      {/* Left spinner + nav (fixed width group for symmetry) */}
      <div className="flex items-center gap-2 pl-1 pr-2" style={{width:"33%", justifyContent:"flex-start"}}>
        <button
          onClick={() => {
            setLeftAngle(a => a - 180);
            rollPrev();
          }}
          className="relative w-6 h-6 flex-shrink-0 focus:outline-none"
          aria-label="Previous"
        >
          <div
            className="w-full h-full rounded-full shadow-md relative transition-transform duration-500"
            style={{
              background: "radial-gradient(circle, #59907D 0%, #191919 100%)",
              border: "1.5px solid #D24A58",
              transform: `rotate(${leftAngle}deg)`
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
      {leftItems.map((item) => {
          const isEvents = item.id === 'events';
          if (!isEvents) return (
            <RetroButton
              key={item.id}
              item={item}
              isActive={effectiveActiveId === item.id}
              onClick={setActiveSection}
              size="sm"
            />
          );
          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={scheduleClose}
              onFocus={openDropdown}
              onBlur={scheduleClose}
            >
              <button
                aria-haspopup="true"
                aria-expanded={eventsOpen}
                onClick={(e)=>{ e.preventDefault(); openDropdown(); }}
                className={`group relative px-2.5 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1 transition-all duration-300 ${effectiveActiveId === item.id ? 'scale-105' : 'hover:scale-102'}`}
                style={{
                  backgroundColor: effectiveActiveId === item.id ? '#D24A58' : '#59907D',
                  color: effectiveActiveId === item.id ? '#fff' : '#F4CA8E',
                  border: `1.5px solid ${effectiveActiveId === item.id ? '#F4CA8E' : '#191919'}`,
                  boxShadow: effectiveActiveId === item.id ? '0 0 12px rgba(210,74,88,0.6),0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                <span>{item.label}</span>
                <span className={`transition-transform duration-300 ${eventsOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {eventsOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-44 border rounded-lg p-2 z-50"
                  style={{background:'rgba(25,25,25,0.95)', borderColor:'rgba(89,144,125,0.6)', backdropFilter:'blur(12px)'}}
                  onMouseEnter={openDropdown}
                  onMouseLeave={scheduleClose}
                >
                  <div className="flex flex-col gap-1">
                    {dropdownItems.map(d => (
                      <a
                        key={d.id}
                        href={d.href}
                        onClick={()=>{ setActiveSection(d.id); setEventsOpen(false); }}
                        className={`px-2 py-1 rounded text-xs font-semibold uppercase transition-colors ${pathname?.startsWith(d.href) ? 'bg-[#D24A58] text-white' : 'text-[#F4CA8E] hover:bg-[#59907D] hover:text-white'}`}
                        style={{fontFamily: press.style.fontFamily}}
                      >
                        {d.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

    {/* Center glowing display (fixed width to keep sides balanced) */}
    <div className="flex items-center justify-center" style={{width:"34%"}}>
        <div
      className="relative px-5 py-2 rounded-lg flex items-center justify-center min-w-[140px]"
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
              {centerLabel}
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <div
                className={`h-full w-full ${matched ? 'opacity-40' : 'opacity-10'}`}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(244,202,142,0.15) 1px, rgba(244,202,142,0.15) 2px)",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

  {/* Right nav + spinner (mirrors left group) */}
  <div className="flex items-center gap-2 pr-1 pl-2 justify-end" style={{width:"33%"}}>
        {/* Right buttons */}
        <div className="flex gap-1.5">
      {rightItems.map((item) => (
            <RetroButton
              key={item.id}
              item={item}
        isActive={effectiveActiveId === item.id}
              onClick={setActiveSection}
              size="sm"
            />
          ))}
        </div>

        {/* Spinner with trigger */}
        <button
          onClick={() => {
            setRightAngle(a => a + 180);
            rollNext();
          }}
          className="relative w-6 h-6 flex-shrink-0 focus:outline-none"
          aria-label="Next"
        >
          <div
            className="w-full h-full rounded-full shadow-md relative transition-transform duration-500"
            style={{
              background: "radial-gradient(circle, #59907D 0%, #191919 100%)",
              border: "1.5px solid #D24A58",
              transform: `rotate(${rightAngle}deg)`
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