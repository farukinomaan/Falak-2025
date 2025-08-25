"use client";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, User, LogIn } from "lucide-react";
import { useCartCount } from "@/components/cart/useCartCount";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

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
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <User size={18} />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white rounded-full px-1 py-0.5">
            {cartCount}
          </span>
        )}
      </button>
      <div
        className={`origin-top-right absolute right-0 mt-3 w-44 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden transition-all duration-200 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        role="menu"
        aria-hidden={!open}
      >
        <div className="flex flex-col py-2 text-sm">
          {status === 'authenticated' ? (
            <Link href="/profile" onClick={() => setOpen(false)} className="px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition" role="menuitem">
              <User size={16} /> <span>Profile</span>
            </Link>
          ) : (
            <button onClick={() => { setOpen(false); signIn('google'); }} className="text-left px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition" role="menuitem">
              <LogIn size={16} /> <span>Sign in</span>
            </button>
          )}
          <Link href="/cart" onClick={() => setOpen(false)} className="px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition relative" role="menuitem">
            <ShoppingCart size={16} /> <span>Cart</span>
            {cartCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
