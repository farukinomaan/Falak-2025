/**
 * @copyright Falak 2025
 */

"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UserMenu } from "./nav/UserMenu";
import { DesktopNavbar } from "./nav/DesktopNavbar";
import { MobileNavbar } from "./nav/MobileNavbar";
import { MobileMenuDropdown } from "./nav/nav-components/MobileMenuDropdown";

interface NavItem {
  id: string;
  label: string;
  href: string;
}

export default function Nav() {
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

  const navItems: NavItem[] = [
    { id: "FALAK", label: "FALAK", href: "/" },
    { id: "events", label: "Events", href: "/events" },
    { id: "passes", label: "Passes", href: "/passes" },
    { id: "tickets", label: "Tickets", href: "/tickets" },
  ];

  const mobileNavItems: NavItem[] = [
    ...navItems,
    { id: "signin", label: "Sign In", href: "/signin" },
    { id: "cart", label: "Cart", href: "/cart" },
  ];

  const rollNext = () => {
    const currentIndex = navItems.findIndex((item) => item.id === activeSection);
    const nextIndex = (currentIndex + 1) % navItems.length;
    setActiveSection(navItems[nextIndex].id);
  };

  const rollPrev = () => {
    const currentIndex = navItems.findIndex((item) => item.id === activeSection);
    const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length;
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
      <div className="hidden xl:block">
        <div className="fixed top-4 left-9 z-50 pointer-events-auto">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <h1 className="special-font hero-heading text-white">
              F<b>A</b>LAK
            </h1>
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

      <MobileMenuDropdown
        isMobileMenuOpen={isMobileMenuOpen}
        menuRef={menuRef}
        mobileNavItems={mobileNavItems}
        activeSection={activeSection}
        handleItemClick={handleItemClick}
        menuButtonRef={menuButtonRef}
      />
    </>
  );
}