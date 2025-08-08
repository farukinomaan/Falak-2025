"use client";

import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="text-sm text-gray-500">Status: {status}</p>
      <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}

