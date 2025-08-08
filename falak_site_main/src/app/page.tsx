import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-4xl font-bold">Falak Cultural Fest</h1>
      <p className="text-gray-700">Welcome! Explore events and get your passes.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Link className="border rounded p-4" href="/passes">Passes</Link>
        <Link className="border rounded p-4" href="/cultural_events">Cultural Events</Link>
        <Link className="border rounded p-4" href="/sports_events">Sports Events</Link>
        <Link className="border rounded p-4" href="/tickets">Tickets</Link>
      </div>
    </div>
  );
}
