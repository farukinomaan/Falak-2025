"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "./nav/UserMenu";
import { DesktopNavbar } from "./nav/DesktopNavbar";
import { MobileNavbar } from "./nav/MobileNavbar";

interface NavProps {
  isMenuOpen?: boolean; // optional prop from parent
  setIsMenuOpen?: (val: boolean) => void; // setter from parent
}

interface NavItem {
  id: string;
  label: string;
  href: string;
}

export default function Nav({ isMenuOpen, setIsMenuOpen }: NavProps) {
  const [activeSection, setActiveSection] = useState<string>("events");
  const router = useRouter();
  const pathname = usePathname();
  const [internalMenuOpen, setInternalMenuOpen] = useState<boolean>(false);
  const [show, setShow] = useState(true);
  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Determine which state to use: prop-controlled or internal
  const mobileMenuOpen = isMenuOpen ?? internalMenuOpen;
  const setMobileMenuOpen = setIsMenuOpen ?? setInternalMenuOpen;

  // Toggle navbar visibility based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 10) setShow(true);
      else if (currentScrollY > lastScrollY.current) setShow(false);
      else setShow(true);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [mobileMenuOpen]);

  // Desktop primary items (Sports & Cultural moved under Events dropdown)
  const navItems: NavItem[] = useMemo(() => ([
    //note: didnt changed id 
    { id: "FALAK", label: "Home", href: "/" }, 
    { id: "events", label: "Events", href: "/events" },
    { id: "passes", label: "Passes", href: "/passes" },
    { id: "tickets", label: "Support", href: "/tickets" },
  ]), []);

  const extendedCandidates: NavItem[] = useMemo(
    () => [
      ...navItems,
      { id: "sports", label: "Sports", href: "/sports" },
      { id: "cultural", label: "Cultural", href: "/cultural" },
      { id: "cart", label: "Cart", href: "/cart" },
      { id: "profile", label: "Profile", href: "/profile" },
      { id: "signin", label: "Sign In", href: "/signin" },
    ],
    [navItems]
  );

  useEffect(() => {
    if (!pathname) return;
    const match = extendedCandidates.find(
      (n) => pathname === n.href || pathname.startsWith(n.href + "/")
    );
    if (match && match.id !== activeSection) {
      setActiveSection(match.id);
      return;
    }
    if (!match && !extendedCandidates.some((n) => n.id === activeSection)) {
      setActiveSection("events");
    }
  }, [pathname, extendedCandidates, activeSection]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleItemClick = (itemId: string): void => {
    const target = navItems.find((n) => n.id === itemId);
    if (target) {
      setActiveSection(itemId);
      router.push(target.href);
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <div className="hidden xl:block">
        <div className="fixed top-4 left-9 z-50 pointer-events-auto">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} />
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
        rollNext={() => {}}
        rollPrev={() => {}}
      />

      <MobileNavbar
        show={show}
        isMobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        activeSection={activeSection}
        menuButtonRef={menuButtonRef}
      />
    </>
  );
}

