"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCartCount } from "@/components/cart/useCartCount";

export default function Navbar() {
  const [show, setShow] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartCount();
  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement | null>(null); // Type the ref here

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = (
    <>
      <Link href="/" className="font-semibold">
        FALAK
      </Link>
      <Link href="/passes">Passes</Link>
      <Link href="/cultural_events">Cultural</Link>
      <Link href="/sports_events">Sports</Link>
      <Link href="/tickets">Tickets</Link>
      <Link href="/profile">Profile</Link>
      <Link href="/admin_manage">Admin</Link>
      <Link href="/cart" className="relative inline-flex items-center gap-1">
        <ShoppingCart size={18} />
        <span>Cart</span>
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-3 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5">
            {cartCount}
          </span>
        )}
      </Link>
    </>
  );

  return (
    <>
      {/* Logo outside navbar, fixed to top-left */}
      <div className="fixed top-4 left-9 z-50">
        <Link href="/" onClick={() => setMenuOpen(false)}>
          <h1 className="special-font hero-heading text-white">
            F<b>A</b>LAK
          </h1>
        </Link>
      </div>

      {/* Main Navbar */}
      <nav
        className={`fixed top-6 left-1/2 z-40 -translate-x-1/2 px-6 py-3 
          bg-black/70 text-white rounded-full shadow-lg backdrop-blur-md border border-white/10
          transition-transform duration-300 ${show ? "translate-y-0" : "-translate-y-32"}
          before:content-[''] before:absolute before:inset-0 before:rounded-full 
          before:bg-gradient-to-t before:from-white/10 before:to-transparent
          before:pointer-events-none before:z-[-1]`}
      >
        {/* Desktop View */}
        <div className="hidden md:flex items-center gap-4">{navLinks}</div>

        {/* Mobile View */}
        <div className="flex md:hidden items-center justify-between w-full relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 ml-auto">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {menuOpen && (
            <div
              ref={menuRef} // Ref to the menu element
              className="absolute top-full right-0 mt-2 w-48 bg-black/80 rounded-lg shadow-lg 
                         backdrop-blur-md border border-white/10 flex flex-col p-4 gap-3"
            >
              {navLinks}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
