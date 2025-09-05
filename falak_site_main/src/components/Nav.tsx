/**
 * @copyright Falak 2025
 */

"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "./nav/UserMenu";
import { DesktopNavbar } from "./nav/DesktopNavbar";
import { MobileNavbar } from "./nav/MobileNavbar";
// import { MobileMenuDropdown } from "./nav/nav-components/MobileMenuDropdown";(not using)

interface NavItem {
  id: string;
  label: string;
  href: string;
}

export default function Nav() {
  const [activeSection, setActiveSection] = useState<string>("events");
  const router = useRouter();
  const pathname = usePathname();
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
        setShow(true); 
      } else if (currentScrollY > lastScrollY.current) {
        setShow(false);
      } else {
        setShow(true); 
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isMobileMenuOpen]);

  // Desktop primary items (Sports & Cultural moved under Events dropdown)
  const navItems: NavItem[] = useMemo(() => ([
    { id: "FALAK", label: "FALAK", href: "/" },
    { id: "events", label: "Events", href: "/events" },
    { id: "passes", label: "Passes", href: "/passes" },
    { id: "tickets", label: "Tickets", href: "/tickets" },
  ]), []);

  // Extended candidates for mobile & active detection (not all appear in desktop spinner cycle)
  const extendedCandidates: NavItem[] = useMemo(() => ([
    ...navItems,
    { id: "sports", label: "Sports", href: "/sports" },
    { id: "cultural", label: "Cultural", href: "/cultural" },
    { id: "cart", label: "Cart", href: "/cart" },
    { id: "profile", label: "Profile", href: "/profile" },
    { id: "signin", label: "Sign In", href: "/signin" },
  ]), [navItems]);

  // Mobile menu excludes the Events parent (sports & cultural shown directly)
  const mobileNavItems: NavItem[] = useMemo(() => ([
    ...navItems.filter(n => n.id !== 'events'),
    { id: "sports", label: "Sports", href: "/sports" },
    { id: "cultural", label: "Cultural", href: "/cultural" },
    { id: "cart", label: "Cart", href: "/cart" },
    { id: "signin", label: "Sign In", href: "/signin" },
  ]), [navItems]);

  // Sync activeSection with current path (covers direct navigation / deep links)
  useEffect(() => {
    if (!pathname) return;
    const match = extendedCandidates.find(n => pathname === n.href || pathname.startsWith(n.href + "/"));
    if (match && match.id !== activeSection) {
      setActiveSection(match.id);
      return;
    }
    // Fallback: if no match & activeSection not in extended list, reset to events
    if (!match && !extendedCandidates.some(n => n.id === activeSection)) {
      setActiveSection("events");
    }
  }, [pathname, extendedCandidates, activeSection]);

  const rollNext = () => {
    let currentIndex = navItems.findIndex((item) => item.id === activeSection);
    if (currentIndex === -1) currentIndex = 0; // if currently on cart/profile etc.
    const nextIndex = (currentIndex + 1) % navItems.length;
    const next = navItems[nextIndex];
    setActiveSection(next.id);
    router.push(next.href);
  };

  const rollPrev = () => {
    let currentIndex = navItems.findIndex((item) => item.id === activeSection);
    if (currentIndex === -1) currentIndex = 0;
    const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length;
    const prev = navItems[prevIndex];
    setActiveSection(prev.id);
    router.push(prev.href);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleItemClick = (itemId: string): void => {
    const target = navItems.find(n => n.id === itemId);
    if (target) {
      setActiveSection(itemId);
      router.push(target.href);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="hidden xl:block">
        <div className="fixed top-4 left-9 z-50 pointer-events-auto">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            {/* <h1 className="special-font hero-heading text-white">
              F<b>A</b>LAK
            </h1> */}
          </Link>
        </div>
        <div className="fixed top-4 right-6 z-50">
          <UserMenu />
        </div>
      </div>

      <DesktopNavbar
        show={show}
        navItems={navItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        rollNext={rollNext}
        rollPrev={rollPrev}
      />

      <MobileNavbar
        show={show}
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        activeSection={activeSection}
        menuButtonRef={menuButtonRef} // ADDED
      />

      {/* <MobileMenuDropdown
        isMobileMenuOpen={isMobileMenuOpen}
        menuRef={menuRef}
        mobileNavItems={mobileNavItems}
        activeSection={activeSection}
        handleItemClick={handleItemClick}
      /> */}
    </>
  );
}