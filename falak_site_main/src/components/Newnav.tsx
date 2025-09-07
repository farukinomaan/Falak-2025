"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react"; 

export default function Navbar() {
const [show, setShow] = useState(true);
const [menuOpen, setMenuOpen] = useState(false);
const lastScrollY = useRef(0);

useEffect(() => {
const handleScroll = () => {
const currentScrollY = window.scrollY;

if (currentScrollY <= 10) {
setShow(true);
lastScrollY.current = currentScrollY;
return;
}

if (currentScrollY > lastScrollY.current) {
setShow(false);
} else {
setShow(true);
}

lastScrollY.current = currentScrollY;
};

window.addEventListener("scroll", handleScroll, { passive: true });
return () => window.removeEventListener("scroll", handleScroll);
}, []);

const navLinks = (
<>
<Link href="/" className="font-semibold">FALAK</Link>
<Link href="/passes">Passes</Link>
<Link href="/cultural_events">Cultural</Link>
<Link href="/sports_events">Sports</Link>
<Link href="/tickets">Tickets</Link>
<Link href="/profile">Profile</Link>
<Link href="/admin_manage">Admin</Link>
</>
);

return (
<nav
className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 px-6 py-3 
bg-black/70 text-white rounded-full shadow-lg backdrop-blur-md border border-white/10
transition-transform duration-300 ${show ? "translate-y-0" : "-translate-y-32"}
before:content-[''] before:absolute before:inset-0 before:rounded-full 
before:bg-gradient-to-t before:from-white/10 before:to-transparent
before:pointer-events-none before:z-[-1]`}
>
{/* Desktop View */}
<div className="hidden md:flex items-center gap-4">
{navLinks}
</div>

{/* Mobile View */}
<div className="flex md:hidden items-center justify-between w-full relative">
<Link
href="/"
className="font-semibold text-lg sm:text-xl"
onClick={() => setMenuOpen(false)}
>
{/* FALAK */}
</Link>
<button onClick={() => setMenuOpen(!menuOpen)} className="p-1">
{menuOpen ? <X size={22} /> : <Menu size={22} />}
</button>

{menuOpen && (
<div
className="absolute top-full right-0 mt-2 w-48 bg-black/80 rounded-lg shadow-lg 
     backdrop-blur-md border border-white/10 flex flex-col p-4 gap-3"
>
<Link href="/passes" onClick={() => setMenuOpen(false)}>Passes</Link>
<Link href="/cultural_events" onClick={() => setMenuOpen(false)}>Cultural</Link>
<Link href="/sports_events" onClick={() => setMenuOpen(false)}>Sports</Link>
<Link href="/tickets" onClick={() => setMenuOpen(false)}>Tickets</Link>
<Link href="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
<Link href="/admin_manage" onClick={() => setMenuOpen(false)}>Admin</Link>
</div>
)}
</div>

</nav>
);
}
