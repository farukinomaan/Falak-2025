import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTicket } from "@/lib/actions/tables/tickets";
import RegisteredTicketForm from "../../components/tickets/ti_register";
import UnregisteredNotice from "../../components/tickets/ti_unreg";
import { redirect } from "next/navigation";
import { Orbitron } from "next/font/google"; 
import Footer from "@/components/Footer";
import styles from "../profile/page.module.css";

const orbitron = Orbitron({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"], 
  variable: "--font-typewriter",
});

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);
  interface MaybeOnboardSession { needsOnboarding?: boolean; user?: { id?: string; email?: string | null } }
  const s = session as MaybeOnboardSession | null;
  const userId = s?.user?.id || null;
  const needsOnboarding = s?.needsOnboarding === true;
  const registered = !!userId && !needsOnboarding; // rely on auth callback logic

  async function submit(formData: FormData) {
    "use server";
    if (!registered || !userId) return;
    const category = String(formData.get("category") || "other");
    const issue = String(formData.get("issue") || "");
    if (!issue || issue.trim().length < 5) return;
    await createTicket({ userId, category, issue });
    redirect("/tickets?submitted=1");
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Base background color */}
      <div className="absolute inset-0 bg-[#32212C] z-[-3]" />

      {/* SVG overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 z-[-2]"
        style={{ backgroundImage: "url('/bg.svg')" }}
      />

      {/* Optional dark overlay */}
      <div className="absolute inset-0 bg-black/50 z-[-1]" />

      {/* Page content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center
        pt-24 sm:pt-28 md:pt-16  
        py-6 sm:py-8 px-4 sm:px-6 md:px-8 lg:px-12"
      >
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto sm:mt-10 mb-10">
          <h1 className={`vintage-font text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-neutral-100 font-semibold mb-6 sm:mb-8 text-center ${orbitron.variable}`}>
            Support Ticket
          </h1>

          {!session || !registered ? (
            <UnregisteredNotice />
          ) : (
            <RegisteredTicketForm action={submit} />
          )}
        </div>
        <div className={styles.infoCard} style={{
                background:'rgba(0,0,0,0.35)',
                border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:12,
                padding:'12px 16px',
                marginBottom:16,
                backdropFilter:'blur(6px)'
              }}>
                <p style={{fontSize:12,lineHeight:1.4,color:'#e2e8f0'}}>
                  <strong style={{color:'#fff'}}>Note:</strong> Support tickets raised will be resolved after mid-sems. If you do not see your pass immediately after purchase, try going to your profile page and click on Verify Purchases button.
                </p>
              </div>
      </main>

      {/* Footer stays full width */}
      <Footer />
    </div>
  );  
}
