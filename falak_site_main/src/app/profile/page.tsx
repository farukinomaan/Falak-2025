import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { listUserPassesByUserId } from "@/lib/actions/tables/userPasses";
import { listPassesByIds } from "@/lib/actions/tables/pass";
import { listTeamMembersByMemberId } from "@/lib/actions/tables/teamMembers";
import { listEventsByIds } from "@/lib/actions/tables/events";
import QrCode from "@/components/QrCode";
import RetroAnimations from "../../components/profile/RetroAnimations";
import styles from "./page.module.css";
// import BackgroundColorSetter from "./BackgroundColorSetter"; // Removed

export default async function ProfilePage() {
  // const session = await getServerSession(authOptions);
  // const email = session?.user?.email;
  // if (!email) redirect("/api/auth/signin");

  // const userRes = await getUserByEmail(email);
  // if (!userRes.ok || !userRes.data) redirect("/onboarding");
  // const user = userRes.data;

  // // Fetch passes owned by user
  // const upRes = await listUserPassesByUserId(user.id!);
  // const userPasses = upRes.ok && upRes.data ? upRes.data : [];
  // const passIds = userPasses.map((p) => p.passId).filter(Boolean) as string[];
  // const passRes = await listPassesByIds(passIds);
  // const passes = passRes.ok && passRes.data ? passRes.data : [];

  // // Fetch events by team membership
  // const tmRes = await listTeamMembersByMemberId(user.id!);
  // const memberships = tmRes.ok && tmRes.data ? tmRes.data : [];
  // const eventIds = Array.from(new Set(memberships.map((m) => m.eventId))).filter(Boolean) as string[];
  // const evRes = await listEventsByIds(eventIds);
  // const events = evRes.ok && evRes.data ? evRes.data : [];

  // --- TEMP DATA ---
  const user = {
    name: "Falak",
    email: "falak@mitblr.in",
    mahe: true,
    reg_no: "2109XXXXX",
    institute: "MIT",
    id: "user_123"
  };

  const passes = [
    { id: "pass_1", pass_name: "Proshow Pass", description: "Access to all proshows.", cost: 1500 },
    { id: "pass_2", pass_name: "Cultural Pass", description: "Access to all cultural events.", cost: 800 },
    { id: "pass_3", pass_name: "Sports Pass", description: "Access to all sports events.", cost: 500 },
  ];

  const userPasses = [
    { id: "up_1", userId: "user_123", passId: "pass_1", qr_token: "qr_token_123" },
    { id: "up_2", userId: "user_123", passId: "pass_2", qr_token: "qr_token_456" },
  ];

  const events = [
    { id: "event_1", name: "Battle of Bands", description: "Rock and metal bands competition.", sub_cluster: "Music", venue: "Quadrangle", time: "6 PM", date: "2025-10-28" },
    { id: "event_2", name: "Street Play", description: "Nukkad natak competition.", sub_cluster: "Drama", venue: "KC", time: "2 PM", date: "2025-10-29" },
    { id: "event_3", name: "Footloose", description: "Group dance competition.", sub_cluster: "Dance", venue: "AB5", time: "4 PM", date: "2025-10-30" },
  ];
  // --- END TEMP DATA ---

  return (
    <>
      <div className={styles.profilePage}>
        <div className={styles.pageContent}>
        <header className={styles.header}>
          <div>
            <h1>Welcome, {user.name}!</h1>
          </div>
          <div>
            <p>{user.email}</p>
            {user.mahe ? (
              <p>MAHE {user.reg_no ? `• ${user.reg_no}` : ""}</p>
            ) : (
              <p>{user.institute || "Non-MAHE"}</p>
            )}
          </div>
        </header>

        <div className={styles.mainContent}>
          <div className={styles.detailsColumn}>
            <section className={styles.section}>
              <h2>Your Passes</h2>
              {passes.length === 0 ? (
                <EmptyState message="You don’t own any passes yet." ctaHref="/passes" ctaLabel="Browse Passes" />
              ) : (
                <ul className={styles.passList}>
                  {userPasses.map((up) => {
                    const pass = passes.find((p) => p.id === up.passId);
                    const qr = up.qr_token as string | null | undefined;
                    const qrPayloadUrl = qr ? `${process.env.NEXT_PUBLIC_QR_BASE_URL ?? "https://falak.mitblr.in"}/api/qr/verify?token=${encodeURIComponent(qr)}` : null;
                    return (
                      <li key={up.id ?? `${up.userId}-${up.passId}`} className={styles.passItem}>
                        <div className={styles.passDetails}>
                          <h3>{pass?.pass_name ?? "Pass"}</h3>
                          <p className={styles.passDescription}>{pass?.description || ""}</p>
                          {typeof pass?.cost !== "undefined" && (
                            <p className={styles.passCost}>₹{Number(pass?.cost)}</p>
                          )}
                        </div>
                        {qrPayloadUrl && (
                          <div className={styles.qrContainer}>
                            <QrCode value={qrPayloadUrl} size={192} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className={styles.section}>
              <h2>Registered Events</h2>
              {events.length === 0 ? (
                <EmptyState message="You haven’t registered for any events yet." ctaHref="/sports_events" ctaLabel="Explore Events" />
              ) : (
                <ul className={styles.eventList}>
                  {events.map((e) => (
                    <li key={e.id} className={styles.eventItem}>
                      <div className={styles.eventContent}>
                        <h3>{e.name}</h3>
                        <div className={styles.eventMeta}>
                          <span>{e.sub_cluster}</span>
                        </div>
                        <p className={styles.eventDescription}>{e.description || ""}</p>
                      </div>
                      <div className={styles.eventDetails}>
                        <div className={styles.eventTiming}>
                          <div className={styles.timingItem}>
                            <strong>Venue</strong>
                            <span>{e.venue}</span>
                          </div>
                          <div className={styles.timingSeparator}></div>
                          <div className={styles.timingItem}>
                            <strong>Time</strong>
                            <span>{e.time}</span>
                          </div>
                          <div className={styles.timingSeparator}></div>
                          <div className={styles.timingItem}>
                            <strong>Date</strong>
                            <span>{new Date(String(e.date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
        <RetroAnimations />
        </div>
        <img src="/wave.svg" alt="decorative wave" className={`${styles.waveImg} ${styles.waveTopLeft}`} />
        <img src="/wave.svg" alt="decorative wave" className={`${styles.waveImg} ${styles.waveBottomRight}`} />
      </div>
    </>
  );
}

function EmptyState({ message, ctaHref, ctaLabel }: { message: string; ctaHref: string; ctaLabel: string }) {
  return (
    <div className={styles.emptyState}>
      <p>{message}</p>
      <a href={ctaHref} className={styles.ctaLink}>
        {ctaLabel}
      </a>
    </div>
  );
}