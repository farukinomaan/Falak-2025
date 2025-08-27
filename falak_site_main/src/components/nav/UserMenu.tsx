/**
 * @copyright Falak 2025
 */

"use client";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, User, LogIn } from "lucide-react";
import { useCartCount } from "@/components/cart/useCartCount";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Press_Start_2P } from "next/font/google";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"] });

export function UserMenu({ className = "" }: { className?: string }) {
  const cartCount = useCartCount();
  const { status } = useSession();
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
    <div ref={ref} className={`relative ${className}`}>
      {/* User Button - Matching navbar orb style */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-12 h-12 flex-shrink-0 focus:outline-none group rounded-full overflow-hidden transition-all duration-300"
        style={{
          background: open
            ? "radial-gradient(circle, #D24A58 0%, #191919 70%)" 
            : "radial-gradient(circle, #59907D 0%, #191919 100%)", 
          border: `2px solid ${open ? "#F4CA8E" : "#59907D"}`, 
          boxShadow: open
            ? "0 0 20px rgba(210, 74, 88, 0.6), 0 4px 12px rgba(0,0,0,0.4)"
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Pulsing ring when active */}
        {open && (
          <div
            className="absolute inset-0 rounded-full border-2 animate-pulse opacity-75"
            style={{
              borderColor: "#F4CA8E", 
              animationDuration: "1.5s"
            }}
          />
        )}
        
        {/* User Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <User 
            size={18} 
            style={{
              color: open ? "#F4CA8E" : "#F4CA8E", 
              filter: open ? "drop-shadow(0 0 8px #F4CA8E)" : "drop-shadow(0 0 4px #F4CA8E)"
            }}
          />
        </div>

        {/* Cart Count Badge */}
        {cartCount > 0 && (
          <span
            className="absolute -top-1 -right-1 text-[10px] rounded-full px-1.5 py-0.5 font-bold animate-pulse"
            style={{
              backgroundColor: "#D24A58", 
              color: "#fff",
              border: "1px solid #F4CA8E", 
              boxShadow: "0 0 8px rgba(210, 74, 88, 0.6)",
              fontFamily: "monospace"
            }}
          >
            {cartCount}
          </span>
        )}

        {/* Rotating outer ring */}
        <div className={`absolute inset-1 rounded-full border border-opacity-40 ${open ? 'animate-spin' : ''}`}
          style={{
            borderColor: open ? "rgba(244,202,142,0.6)" : "rgba(244,202,142,0.4)",
            animationDuration: "3s"
          }}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`origin-top-right absolute right-0 mt-3 w-52 rounded-xl border-2 shadow-lg overflow-hidden transition-all duration-300 ease-out transform ${
          open 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
        style={{
          backgroundColor: "rgba(25, 25, 25, 0.98)", 
          borderColor: "rgba(89, 144, 125, 0.6)", 
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(244, 202, 142, 0.2)",
        }}
        role="menu"
        aria-hidden={!open}
      >
        <div className="flex flex-col py-3 text-sm">
          {/* Profile/Sign In */}
          {status === 'authenticated' ? (
            <Link 
              href="/profile" 
              onClick={() => setOpen(false)} 
              className={`px-4 py-3 flex items-center gap-3 transition-all duration-200 group ${press.className}`}
              style={{
                color: "#F4CA8E", // Warm orange text
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
              role="menuitem"
            >
              <div className="relative">
                <User 
                  size={16} 
                  style={{
                    color: "#59907D", 
                    filter: "drop-shadow(0 0 4px rgba(89, 144, 125, 0.6))"
                  }}
                />
              </div>
              <span className="group-hover:text-white transition-colors duration-200">
                Profile
              </span>
              {/* Hover effect */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: "#D24A58" }} 
              />
            </Link>
          ) : (
            <button 
              onClick={() => { setOpen(false); signIn('google'); }} 
              className={`text-left px-4 py-3 flex items-center gap-3 transition-all duration-200 group ${press.className}`}
              style={{
                color: "#F4CA8E", 
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
              role="menuitem"
            >
              <div className="relative">
                <LogIn 
                  size={16} 
                  style={{
                    color: "#59907D", 
                    filter: "drop-shadow(0 0 4px rgba(89, 144, 125, 0.6))"
                  }}
                />
              </div>
              <span className="group-hover:text-white transition-colors duration-200">
                Sign In
              </span>
              {/* Hover effect */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: "#D24A58" }} 
              />
            </button>
          )}

          {/* Divider Line */}
          <div 
            className="mx-4 my-2 h-px opacity-30"
            style={{
              background: "linear-gradient(to right, transparent, #59907D, transparent)"
            }}
          />

          {/* Cart Link */}
          <Link 
            href="/cart" 
            onClick={() => setOpen(false)} 
            className={`px-4 py-3 flex items-center gap-3 transition-all duration-200 group relative ${press.className}`}
            style={{
              color: "#F4CA8E", // Warm orange text
              fontSize: "10px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
            role="menuitem"
          >
            <div className="relative">
              <ShoppingCart 
                size={16} 
                style={{
                  color: "#59907D", // Teal icon
                  filter: "drop-shadow(0 0 4px rgba(89, 144, 125, 0.6))"
                }}
              />
            </div>
            <span className="group-hover:text-white transition-colors duration-200">
              Cart
            </span>
            
            {/* Cart Count Badge */}
            {cartCount > 0 && (
              <span
                className="ml-auto inline-flex items-center justify-center text-[9px] rounded-full px-2 py-1 font-bold animate-pulse"
                style={{
                  backgroundColor: "#D24A58", // Coral
                  color: "#fff",
                  border: "1px solid #F4CA8E", // Orange border
                  boxShadow: "0 0 8px rgba(210, 74, 88, 0.6)",
                  fontFamily: "monospace",
                  minWidth: "20px"
                }}
              >
                {cartCount}
              </span>
            )}

            {/* Hover effect */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ backgroundColor: "#D24A58" }} // Coral accent
            />
          </Link>
        </div>

        {/* Bottom glow accent */}
        <div 
          className="h-px opacity-40"
          style={{
            background: "linear-gradient(to right, transparent, #F4CA8E, transparent)"
          }}
        />
      </div>
    </div>
  );
}