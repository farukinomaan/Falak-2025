"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
      style={{ backgroundColor: "#E57373", color: "#ffffff" }}
    >
      Log out
    </button>
  );
}
