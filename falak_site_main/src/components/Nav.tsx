/**
 * @copyright Falak 2025
 */

"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Press_Start_2P } from "next/font/google";
//import { NavLinks } from "./nav/NavLinks"; (not USING)
import { UserMenu } from "./nav/UserMenu";
const press = Press_Start_2P({ weight: "400", subsets: ["latin"] });

interface NavItem {
  id: string;
  label: string;
  href: string;
}

export default function RetroNavbar() {
  const [activeSection, setActiveSection] = useState<string>("events");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [show, setShow] = useState(true);
  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Toggle navbar visibility based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 10) {
        setShow(true); // Show navbar if we're near the top
      } else if (currentScrollY > lastScrollY.current) {
        setShow(false); // Hide navbar if scrolling down
      } else {
        setShow(true); // Show navbar if scrolling up
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the menu AND not on the menu button
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && !menuButtonRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    { id: "FALAK", label: "FALAK", href: "/" },
    { id: "events", label: "Events", href: "/events" },
    { id: "passes", label: "Passes", href: "/passes" },
    { id: "tickets", label: "Tickets", href: "/tickets" },
    //{ id: "admin", label: "Admin", href: "/admin_manage" },
  ];

  // Mobile-specific items for the dropdown
  const mobileNavItems: NavItem[] = [
    ...navItems,
    { id: "signin", label: "Sign In", href: "/signin" },
    { id: "cart", label: "Cart", href: "/cart" },
  ];

  const leftItems = navItems.slice(0, 2); // FALAK and Events
  const rightItems = navItems.slice(2, 4); // Passes and Tickets

  // helper to roll sections
  const rollNext = () => {
    const currentIndex = navItems.findIndex((item) => item.id === activeSection);
    const nextIndex = (currentIndex + 1) % navItems.length;
    setActiveSection(navItems[nextIndex].id);
  };

  const rollPrev = () => {
    const currentIndex = navItems.findIndex((item) => item.id === activeSection);
    const prevIndex =
      (currentIndex - 1 + navItems.length) % navItems.length;
    setActiveSection(navItems[prevIndex].id);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleItemClick = (itemId: string): void => {
    setActiveSection(itemId);
    setIsMobileMenuOpen(false); 
  };

  return (
    <>
      {/* Desktop elements */}
      <div className="hidden xl:block">
        {/* Logo top-left */}
        <div className="fixed top-4 left-9 z-50 pointer-events-auto">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <h1 className="special-font hero-heading text-white">
              F<b>A</b>LAK
            </h1>
          </Link>
        </div>

        {/* User menu fixed */}
        <div className="fixed top-4 right-6 z-50">
          <UserMenu />
        </div>
      </div>

      {/* Desktop Navbar */}
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
          /* Spinner with trigger */
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
            {leftItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setActiveSection(item.id)}
                  className={`group relative px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-all duration-300
                    ${isActive ? "scale-105 z-10" : ""}`}
                  style={{
                    backgroundColor: isActive ? "#D24A58" : "#59907D", 
                    color: isActive ? "#fff" : "#F4CA8E", 
                    border: `1.5px solid ${isActive ? "#F4CA8E" : "#191919"}`, 
                    boxShadow: isActive
                      ? "0 0 12px rgba(210, 74, 88, 0.6), 0 2px 4px rgba(0,0,0,0.3)"
                      : "0 1px 2px rgba(0,0,0,0.2)",
                  }}
                >
                  {item.label}
                  {isActive && (
                    <span
                      className="pointer-events-none absolute inset-0 rounded-md opacity-40"
                      style={{
                        backgroundColor: "#F4CA8E", 
                        filter: "blur(3px)",
                      }}
                    />
                  )}
                </Link>
              );
            })}
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
              {/* scanline effect */ }
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
            {rightItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setActiveSection(item.id)}
                  className={`group relative px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-all duration-300
                    ${isActive ? "scale-105 z-10" : ""}`}
                  style={{
                    backgroundColor: isActive ? "#D24A58" : "#59907D", 
                    color: isActive ? "#fff" : "#F4CA8E", 
                    border: `1.5px solid ${isActive ? "#F4CA8E" : "#191919"}`, 
                    boxShadow: isActive
                      ? "0 0 12px rgba(210, 74, 88, 0.6), 0 2px 4px rgba(0,0,0,0.3)"
                      : "0 1px 2px rgba(0,0,0,0.2)",
                  }}
                >
                  {item.label}
                  {isActive && (
                    <span
                      className="pointer-events-none absolute inset-0 rounded-md opacity-40"
                      style={{
                        backgroundColor: "#F4CA8E", 
                        filter: "blur(3px)",
                      }}
                    />
                  )}
                </Link>
              );
            })}
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

      {/* Mobile Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex xl:hidden items-start justify-between p-4 transition-all duration-500 ${show ? 'translate-y-0' : '-translate-y-32'}`}>
        {/* Logo container top left */}
        <div className={`pointer-events-auto transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}>
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
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
              {/* scanline effect */}
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
            ref={menuButtonRef}
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

      {/* Mobile Menu Dropdown */}
      <div
        ref={menuRef}
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 xl:hidden transition-all duration-500 ease-out transform w-[95%] max-w-md 
          ${isMobileMenuOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
          }`}
        style={{
          backgroundColor: "rgba(25, 25, 25, 0.98)", 
          borderColor: "rgba(89, 144, 125, 0.6)", 
          backdropFilter: "blur(20px)", 
          border: "2px solid",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(244, 202, 142, 0.2)", 
        }}
      >
        {/* Menu Items Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {mobileNavItems.map((item, index) => {
              const isActive = activeSection === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => handleItemClick(item.id)}
                  className={`group relative p-3 rounded-lg text-xs font-bold uppercase flex justify-center items-center transition-all duration-300 ${press.className}
                    ${isActive ? "scale-105" : "hover:scale-102"}`}
                  style={{
                    backgroundColor: isActive ? "#D24A58" : "#59907D", 
                    color: isActive ? "#fff" : "#F4CA8E", 
                    border: `2px solid ${isActive ? "#F4CA8E" : "#191919"}`, 
                    boxShadow: isActive
                      ? "0 0 15px rgba(210, 74, 88, 0.5), 0 2px 8px rgba(0,0,0,0.3)"
                      : "0 2px 4px rgba(0,0,0,0.2)",
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="relative z-10">
                    {item.label}
                  </div>
                  {/* Active glow effect */}
                  {isActive && (
                    <>
                      <div
                        className="absolute inset-0 rounded-lg opacity-30"
                        style={{
                          backgroundColor: "#F4CA8E", 
                          filter: "blur(4px)",
                        }}
                      />
                      {/* Pulsing border */}
                      <div className="absolute inset-0 rounded-lg border-2 opacity-50 animate-pulse" 
                        style={{ borderColor: "#F4CA8E" }} />
                    </>
                  )}
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-200"
                    style={{ backgroundColor: "#D24A58" }} />
                </Link>
              );
            })}
          </div>
          
          {/* Bottom accent line */}
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-40" />
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 xl:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}