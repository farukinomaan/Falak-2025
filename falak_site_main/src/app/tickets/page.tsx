import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { createTicket } from "@/lib/actions/tables/tickets";
import { ticketCategories } from "@/lib/validation/tickets";
import GuestContactForm from "../../components/tickets/GuestContactForm";
import RegisteredTicketForm from "../../components/tickets/ti_register"
import UnregisteredNotice from "../../components/tickets/ti_unreg";
import { redirect } from "next/navigation";
import { Orbitron } from "next/font/google"; 
import { Roboto_Mono } from "next/font/google"; 
const robotoMono = Roboto_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700"], 
});

const orbitron = Orbitron({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"], 
  variable: "--font-typewriter",
});

// Server component renders the right view depending on user registration
export default async function TicketsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  const userRes = email ? await getUserByEmail(email) : { ok: true as const, data: null };
  const registeredUser = userRes.ok ? userRes.data : null;

  async function submit(formData: FormData) {
    "use server";
    if (!registeredUser) return;
    const category = String(formData.get("category") || "other");
    const issue = String(formData.get("issue") || "");
    if (!issue || issue.trim().length < 5) return;
    await createTicket({ userId: registeredUser.id!, category, issue });
    redirect("/tickets?submitted=1");
  }

return (
  <div
    className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden before:absolute before:inset-0 before:bg-black/40 before:pointer-events-none"
    style={{ backgroundColor: '#32212C' }}
  >
    {/* Background SVG */}
    <div 
      className="absolute pointer-events-none inset-0"
      style={{
        backgroundImage: 'url(/background.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover', // or 'contain' depending on your preference
        backgroundPosition: 'center',
        opacity: 0.5, // Adjust opacity so it doesn't overpower content
        zIndex: 0, // Behind the overlay
      }}
    />
    
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto relative z-10">
      {!session || !email ? (
        <GuestContactForm/>
      ) : !registeredUser ? (
        <UnregisteredNotice/>
      ) : (
        <RegisteredTicketForm action={submit} />
      )}
    </div>
  </div>
);

}

