"use client";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, User, LogIn, LogOut } from "lucide-react";
import { useCartCount } from "@/components/cart/useCartCount";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Press_Start_2P } from "next/font/google";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"] });

export function UserMenu({ className = "" }: { className?: string }) {
  const cartCount = useCartCount();
  const { status, data: session } = useSession();
  const isMahe = Boolean((session?.user as { mahe?: boolean } | undefined)?.mahe);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      className={`fixed top-4 right-4 z-50 xl:relative xl:top-auto xl:right-auto ${className}`}
    >
      {/* Cart Badge */}
  {!isMahe && cartCount > 0 && (
        <span
          className="absolute -top-1 -right-1 text-[10px] rounded-full px-1.5 py-0.5 font-bold animate-bounce z-20"
          style={{
            backgroundColor: "#D7897D",
            color: "#fff",
            border: "1px solid #DBAAA6",
            boxShadow: "0 0 8px rgba(215, 137, 125, 0.6)",
            fontFamily: "monospace",
          }}
        >
          {cartCount}
        </span>
      )}

      {/* User Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-12 h-12 flex-shrink-0 focus:outline-none group rounded-full overflow-hidden transition-all duration-300"
        style={{
          background: open
            ? "radial-gradient(circle, #D7897D 0%, #32212C 50%)"
            : "radial-gradient(circle, #D7897D 0%, #32212C 60%)",
          border: `2px solid ${open ? "#DBAAA6" : "#DBAAA6"}`,
          boxShadow: open
            ? "0 0 20px rgba(215, 137, 125, 0.8), 0 4px 12px rgba(0,0,0,0.4)"
            : "0 2px 8px rgba(215, 137, 125, 0.4)",
        }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {open && (
          <div
            className="absolute inset-0 rounded-full border-2 animate-pulse opacity-75"
            style={{ borderColor: "#DBAAA6", animationDuration: "1.5s" }}
          />
        )}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <User
            size={18}
            style={{
              color: "#F4CA8E",
              filter: open ? "drop-shadow(0 0 8px #F4CA8E)" : "drop-shadow(0 0 4px #F4CA8E)",
            }}
          />
        </div>
        <div
          className={`absolute inset-1 rounded-full border border-opacity-40 ${
            open ? "animate-spin" : ""
          }`}
          style={{
            borderColor: open ? "rgba(244,202,142,0.6)" : "rgba(244,202,142,0.4)",
            animationDuration: "3s",
          }}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`origin-top-right absolute right-0 mt-3 w-52 rounded-xl border-2 shadow-lg overflow-hidden transition-all duration-300 ease-out transform ${
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
        style={{
          backgroundColor: "rgba(50, 33, 44, 0.98)",
          borderColor: "rgba(219, 170, 166, 0.6)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(244, 202, 142, 0.2)",
        }}
        role="menu"
        aria-hidden={!open}
      >
        <div className="flex flex-col py-3 text-sm">
          {status === "authenticated" ? (
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className={`px-4 py-3 flex items-center gap-3 transition-all duration-200 group ${press.className}`}
              style={{
                color: "#F4CA8E",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
              role="menuitem"
            >
              <User size={16} style={{ color: "#DBAAA6", filter: "drop-shadow(0 0 4px rgba(219, 170, 166, 0.6))" }} />
              Profile
            </Link>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-start'));
                signIn("google").finally(() => {
                  setTimeout(() => {
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-stop'));
                  }, 8000);
                });
              }}
              className={`text-left px-4 py-3 flex items-center gap-3 transition-all duration-200 group ${press.className}`}
              style={{
                color: "#F4CA8E",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
              role="menuitem"
            >
              <LogIn size={16} style={{ color: "#DBAAA6", filter: "drop-shadow(0 0 4px rgba(219, 170, 166, 0.6))" }} />
              Sign In
            </button>
          )}

          {/* Divider */}
          <div className="mx-4 my-2 h-px opacity-30" style={{ background: "linear-gradient(to right, transparent, #DBAAA6, transparent)" }} />

          {/* Cart (hidden for MAHE users who use unified pass) */}

          {!isMahe && (
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className={`px-4 py-3 flex items-center gap-3 transition-all duration-200 group relative ${press.className}`}
              style={{
                color: "#F4CA8E",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
              role="menuitem"
            >
              <ShoppingCart size={16} style={{ color: "#DBAAA6", filter: "drop-shadow(0 0 4px rgba(219, 170, 166, 0.6))" }} />
              Cart
              {cartCount > 0 && (
                <span
                  className="ml-auto inline-flex items-center justify-center text-[9px] rounded-full px-2 py-1 font-bold animate-pulse"
                  style={{
                    backgroundColor: "#D7897D",
                    color: "#fff",
                    border: "1px solid #DBAAA6",
                    boxShadow: "0 0 8px rgba(215, 137, 125, 0.6)",
                    fontFamily: "monospace",
                    minWidth: "20px",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          )}


          {/* Divider between Cart and Sign Out (only if cart is shown) */}
          {!isMahe && status === 'authenticated' && (
            <div className="mx-4 my-2 h-px opacity-30" style={{ background: "linear-gradient(to right, transparent, #DBAAA6, transparent)" }} />
          )}
          {status === 'authenticated' && (
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className={`text-left px-4 py-3 flex items-center gap-3 transition-all duration-200 group ${press.className}`}
              style={{
                color: "#F4CA8E",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
              role="menuitem"
            >
              <LogOut size={16} style={{ color: "#DBAAA6", filter: "drop-shadow(0 0 4px rgba(219, 170, 166, 0.6))" }} />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
