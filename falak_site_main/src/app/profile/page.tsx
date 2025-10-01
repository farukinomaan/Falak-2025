import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { listUserPassesByUserId } from "@/lib/actions/tables/userPasses";
import { listPassesByIds } from "@/lib/actions/tables/pass";
import { listTeamMembersByMemberId } from "@/lib/actions/tables/teamMembers";
import { listTeams } from "@/lib/actions/tables/teams";
import { listEventsByIds } from "@/lib/actions/tables/events";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import { computeDeterministicUserQrToken } from "@/lib/security";
import Image from "next/image";
import RetroAnimations from "../../components/profile/RetroAnimations";
import ManualVerifyButton from "@/components/payments/ManualVerifyButton";
import { PageBackground } from "../_clusterPages/clusterPages";
import styles from "./page.module.css";
import LogoutButton from "@/components/auth/LogoutButton";
import Footer from "@/components/Footer";


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


  // Fetch events by team membership (as member)
  const tmRes = await listTeamMembersByMemberId(user.id!);
  const memberships = tmRes.ok && tmRes.data ? tmRes.data : [];

  // Include events where user is team captain (leader)
  const teamRes = await listTeams();
  const teams = teamRes.ok && teamRes.data ? teamRes.data : [];
  const captainEventIds = teams.filter(t => t.captainId === user.id).map(t => t.eventId);

  const eventIds = Array.from(new Set([
    ...memberships.map(m => m.eventId),
    ...captainEventIds,
   ])).filter(Boolean) as string[];
  const evRes = await listEventsByIds(eventIds);
  const events = evRes.ok && evRes.data ? evRes.data : [];
  return (
    <>
            <PageBackground cluster="cultural" />
      <style>{`
        body {
          overflow-x: hidden;
        }
      `}</style>
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
            <div>
              <p>{user.phone}</p>
              <div className="text-white font-light text-sm"><span className="font-bold text-red-500 text-lg">Note</span>: If you have not used this number while purchasing pass, your pass will not be generated, raise a ticket to get your number changed,else contact HR.</div>
            </div>
          </div>
        </header>

        <div className={styles.mainContent}>
          <div className={styles.detailsColumn}>
            {/* Removed dedicated Universal QR section; now each pass shows the (same) user-level QR so only purchasers see it. */}

            <section className={styles.section}>
              <h2>Your Passes</h2>
              <h3>Your QR is shown under every pass below (it is the SAME for all your passes).</h3>
              <div className={styles.infoCard} style={{
                background:'rgba(0,0,0,0.35)',
                border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:12,
                padding:'12px 16px',
                marginBottom:16,
                backdropFilter:'blur(6px)'
              }}>
                <p style={{fontSize:14,lineHeight:1.4,color:'#e2e8f0'}}>
                  <strong style={{color:'#fff'}}>Note:</strong> If you do not see a pass immediately after purchase, do not panic. Please scroll down to footer and contact HR, show them your reciept. Devs also have mid-sems—thanks for understanding.
                </p>
                <div className="mt-3 mb-1">
                  <ManualVerifyButton label="Verify Purchases" />
                </div>
                <span className="pl-3" style={{fontSize:12,lineHeight:1.8,color:'#e2e8f0'}}>
                  <p style={{color:'#fff'}}>Wait a little after clicking</p> 
                </span>
              </div>
              {passes.length === 0 ? (
                <EmptyState message="You don’t own any passes yet." ctaHref="/passes" ctaLabel="Browse Passes" />
              ) : (
                <ul className={styles.passList}>
                  {userPasses.map((up) => {
                    const pass = passes.find((p) => p.id === up.passId);
                    return (
                      <li key={up.id ?? `${up.userId}-${up.passId}`} className={styles.passItem}>
                        <div className={styles.passDetails}>
                          <h3>{pass?.pass_name ?? "Pass"}</h3>
                          <p className="text-xs opacity-70 mb-2">Owned • QR</p>
                          <div className={styles.qrContainer}>
                            <QrCode size={192} value={computeDeterministicUserQrToken(user.id!)}  className="" />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className={styles.section}>
              <h2>Registered Events</h2>
              {events.length === 0 ? (
                <EmptyState message="You haven’ t registered for any events yet." ctaHref="/sports" ctaLabel="Explore Events" />
              ) : (
                <ul className={styles.eventList}>
                  {events.map((e) => {
                    const cluster = (e.cluster_name || "").toLowerCase().includes("sport") ? "sports" : "cultural";
                    const href = `/${cluster}/${encodeURIComponent(e.sub_cluster)}/${encodeURIComponent(e.id)}`;
                    return (
                      <li key={e.id} className={styles.eventItem}>
                        <Link href={href} className={styles.eventLink}>
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
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
        <RetroAnimations />
        </div>
        {/* Logout button fixed at bottom-right */}
        <div className="right-6 bottom-6 z-50">
          <LogoutButton />
        </div>
  <Image src="/wave.svg" alt="decorative wave" width={400} height={200} className={`${styles.waveImg} ${styles.waveTopLeft}`} />
  <Image src="/wave.svg" alt="decorative wave" width={400} height={200} className={`${styles.waveImg} ${styles.waveBottomRight} z-0`} />
      </div>
<div id="site-footer-wrapper" style={{ position: 'relative', zIndex: 99999 }}>
  <Footer />
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