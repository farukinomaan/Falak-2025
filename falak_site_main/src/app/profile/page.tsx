import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { listUserPassesByUserId } from "@/lib/actions/tables/userPasses";
import { listPassesByIds } from "@/lib/actions/tables/pass";
import { listTeamMembersByMemberId } from "@/lib/actions/tables/teamMembers";
import { listEventsByIds } from "@/lib/actions/tables/events";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/api/auth/signin");

  const userRes = await getUserByEmail(email);
  if (!userRes.ok || !userRes.data) redirect("/onboarding");
  const user = userRes.data;

  // Fetch passes owned by user
  const upRes = await listUserPassesByUserId(user.id!);
  const userPasses = upRes.ok && upRes.data ? upRes.data : [];
  const passIds = userPasses.map((p) => p.passId).filter(Boolean) as string[];
  const passRes = await listPassesByIds(passIds);
  const passes = passRes.ok && passRes.data ? passRes.data : [];

  // Fetch events by team membership
  const tmRes = await listTeamMembersByMemberId(user.id!);
  const memberships = tmRes.ok && tmRes.data ? tmRes.data : [];
  const eventIds = Array.from(new Set(memberships.map((m) => m.eventId))).filter(Boolean) as string[];
  const evRes = await listEventsByIds(eventIds);
  const events = evRes.ok && evRes.data ? evRes.data : [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your Profile</h1>
          <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>{user.email}</p>
          {user.mahe ? (
            <p>MAHE {user.reg_no ? `• ${user.reg_no}` : ""}</p>
          ) : (
            <p>{user.institute || "Non-MAHE"}</p>
          )}
        </div>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-3">Your Passes</h2>
        {passes.length === 0 ? (
          <EmptyState message="You don’t own any passes yet." ctaHref="/passes" ctaLabel="Browse Passes" />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {passes.map((p) => (
              <li key={p.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                <h3 className="font-medium">{p.pass_name}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{p.description || ""}</p>
                <div className="mt-2 text-sm text-gray-800">₹{Number(p.cost)}</div>
                {p.enable === false && (
                  <span className="mt-2 inline-block text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Disabled</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Registered Events</h2>
        {events.length === 0 ? (
          <EmptyState message="You haven’t registered for any events yet." ctaHref="/sports_events" ctaLabel="Explore Events" />
        ) : (
          <ul className="divide-y border rounded-lg">
            {events.map((e) => (
              <li key={e.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{e.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{e.description || ""}</p>
                  <div className="mt-1 text-xs text-gray-700">
                    <span>{e.sub_cluster}</span>
                    {" • "}
                    <span>{e.venue}</span>
                    {" • "}
                    <span>{e.time}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{new Date(String(e.date)).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyState({ message, ctaHref, ctaLabel }: { message: string; ctaHref: string; ctaLabel: string }) {
  return (
    <div className="border rounded-lg p-6 text-center text-sm text-gray-600">
      <p>{message}</p>
      <a href={ctaHref} className="inline-block mt-3 px-4 py-2 rounded bg-black text-white">
        {ctaLabel}
      </a>
    </div>
  );
}

