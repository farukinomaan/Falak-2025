
"use client";

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { press } from "@/styles/fonts";
import { Home, Music, Trophy, Ticket, ShoppingCart, MessageSquareDashed, type LucideIcon } from 'lucide-react';
import { RetroButton } from './nav-components/RetroButton';
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";


// using shared font instance

// Icon mapping for center display
const iconMap: Record<string, LucideIcon> = {
  'home': Home,
  'events': Music,
  'sports': Trophy,
  'cultural': Music,
  'passes': Ticket,
  'support': MessageSquareDashed,
  'cart': ShoppingCart
};

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

export const DesktopNavbar: React.FC<DesktopNavbarProps> = ({ show, navItems, setActiveSection }) => {
  const router = useRouter();
  const pathname = usePathname();
  // Spinner rotation state (persistent incremental rotation each click)
  // const [leftAngle, setLeftAngle] = useState(0);
  // const [rightAngle, setRightAngle] = useState(0);
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
  // const eventsItem = navItems.find(n => n.id === 'events');
  const dropdownItems = [
    { id: 'sports', label: 'Sports', href: '/sports' },
    { id: 'cultural', label: 'Cultural', href: '/cultural' }
  ];
  // Inside matched useMemo → add profile route handling
const matched = useMemo(() => {
  if (!pathname) return null;

  if (pathname === '/') {
    return { id: 'home', label: 'HOME', href: '/' };
  }

  if (pathname.startsWith('/cart')) {
    return { id: 'cart', label: 'CART', href: '/cart' };
  }

  if (pathname.startsWith('/tickets')) {
    return { id: 'support', label: 'SUPPORT', href: '/tickets' };
  }

  if (pathname.startsWith('/sports')) {
    return { id: 'sports', label: 'SPORTS', href: '/sports' };
  }

  if (pathname.startsWith('/cultural')) {
    return { id: 'cultural', label: 'CULTURAL', href: '/cultural' };
  }

  if (pathname.startsWith('/profile')) {
    return { id: 'profile', label: '*', href: '/profile' };
  }

  return navItems.find(n => pathname === n.href || pathname.startsWith(n.href + '/')) || null;
}, [pathname, navItems]);

  const effectiveActiveId = matched ? matched.id : undefined;

  return (
    <nav
      role="navigation"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 hidden xl:flex items-stretch justify-center gap-3 px-3 py-2
      rounded-3xl shadow-lg border-2 transition-transform duration-500
      ${press.className} ${show ? "translate-y-0" : "-translate-y-32"}`}
      style={{
        backgroundColor: "rgba(50, 33, 44, 0.95)",
        borderColor: "rgba(219, 170, 166, 0.6)",
        backdropFilter: "blur(12px)",
        minWidth: "560px",
        maxWidth: "600px",
        width: "72%",
        boxShadow: "0 6px 28px rgba(0,0,0,0.45), 0 0 18px rgba(215, 137, 125, 0.18)",
      }}
    >
      {/* Left spinner + nav (fixed width group for symmetry) */}
      <div className="flex items-center gap-2 pl-1 pr-2 flex-1 justify-start">
      <button
  onClick={() => router.back()}
  className="w-7 h-7 flex items-center justify-center rounded-full border border-[#D7897D] bg-[#32212C] text-[#DBAAA6] hover:bg-[#DBAAA6] hover:text-[#32212C] transition-colors"
  aria-label="Go back"
>
  <ChevronLeft size={16} />
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
                className={`group relative px-2.5 py-1 rounded-md text-xs uppercase flex items-center gap-1 transition-colors duration-300`}
                style={{
                  backgroundColor: effectiveActiveId === item.id ? '#D7897D' : '#DBAAA6',
                  color: effectiveActiveId === item.id ? '#fff' : '#32212C',
                  border: `1.5px solid ${effectiveActiveId === item.id ? '#DBAAA6' : '#32212C'}`,
                  boxShadow: effectiveActiveId === item.id ? '0 0 12px rgba(215,137,125,0.6),0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                <span>{item.label}</span>
                <span className={`transition-transform duration-300 ${eventsOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {eventsOpen && (
                <div
                  className="absolute left-0 top-full mt-5 w-44 border rounded-lg p-2 z-50" //increased top margin to mt-4 from m-2
                  style={{background:'rgba(50,33,44,0.95)', borderColor:'rgba(219,170,166,0.6)', backdropFilter:'blur(12px)'}}
                  onMouseEnter={openDropdown}
                  onMouseLeave={scheduleClose}
                >
                  <div className="flex flex-col gap-1">
                    {dropdownItems.map(d => (
                      <a
                        key={d.id}
                        href={d.href}
                        onClick={()=>{ 
                          setActiveSection(d.id); 
                          setEventsOpen(false); 
                          if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-start'));
                          setTimeout(()=>{
                            if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-stop'));
                          }, 8000);
                        }}
                        className={`px-2 py-1 rounded text-xs font-semibold uppercase transition-colors ${pathname?.startsWith(d.href) ? 'bg-[#D7897D] text-white' : 'text-[#DBAAA6] hover:bg-[#DBAAA6] hover:text-[#32212C]'}`}
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
    <div className="flex items-center justify-center flex-1">
        <div
      className="relative px-0 py-2 rounded-lg flex items-center justify-center min-w-[60px] h-[36px]"
          style={{
            backgroundColor: "#000000",
            border: "1.5px solid #DBAAA6",
            boxShadow:
              "inset 0 2px 6px rgba(0,0,0,0.7), 0 1px 3px rgba(219,170,166,0.3)",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded bg-orange-300 opacity-20 blur-sm"></div>
            <div className="relative flex items-center justify-center">
              {matched && iconMap[matched.id] ? (
                React.createElement(iconMap[matched.id], {
                  size: 18,
                  style: {
                    color: "#DBAAA6",
                    filter: "drop-shadow(0 0 8px #DBAAA6)"
                  }
                })
              ) : (
                <div
                  className={`text-xs font-mono tracking-widest font-bold uppercase ${press.className}`}
                  style={{
                    color: "#DBAAA6",
                    textShadow: "0 0 8px #DBAAA6, 0 0 12px #DBAAA6",
                    fontFamily: "monospace",
                    minWidth: "60px",
                    textAlign: "center",
                  }}
                >
                  *
                </div>
              )}
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
  <div className="flex items-center gap-2 pr-1 pl-2 flex-1 justify-end">
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
  onClick={() => router.forward()}
  className="w-7 h-7 flex items-center justify-center rounded-full border border-[#D7897D] bg-[#32212C] text-[#DBAAA6] hover:bg-[#DBAAA6] hover:text-[#32212C] transition-colors"
  aria-label="Go forward"
>
  <ChevronRight size={16} />
</button>
      </div>
    </nav>
  );
};