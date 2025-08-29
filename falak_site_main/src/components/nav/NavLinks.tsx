"use client";
import Link from "next/link";

export function NavLinks() {
  return (
    <>
      <Link href="/" className="font-semibold">FALAK</Link>
      <Link href="/passes">Passes</Link>
      <Link href="/events">Events</Link>
      <Link href="/tickets">Tickets</Link>
      <Link href="/admin_manage">Admin</Link>
    </>
  );
}
