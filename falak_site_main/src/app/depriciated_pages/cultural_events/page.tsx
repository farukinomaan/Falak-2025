import Link from "next/link";

export const revalidate = 60;

// Legacy page kept for backward compatibility; directs users to new unified /events
export default function CulturalEventsLegacy() {
  return (
    <div className="max-w-xl mx-auto p-8 space-y-6 text-center">
      <h1 className="text-3xl font-semibold">Cultural Events (Moved)</h1>
      <p className="text-sm text-muted-foreground">
        This page has been consolidated into the new unified Events directory.
      </p>
      <Link
        href="/events"
        className="inline-block text-sm bg-black text-white px-4 py-2 rounded"
      >
        Go to All Events
      </Link>
    </div>
  );
}

