import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { createTicket } from "@/lib/actions/tables/tickets";
import { ticketCategories } from "@/lib/validation/tickets";
import RegisteredTicketForm from "../../components/tickets/ti_register";
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
    <div className="relative min-h-screen flex items-center py-4 sm:py-8 px-4">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/nbg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Page content */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-100 font-semibold mb-4 sm:mb-6 text-center font-orbitron">
          Support Ticket
        </h1>

        {!session || !email ? (
  <UnregisteredNotice />
) : !registeredUser ? (
  <UnregisteredNotice />
) : (
  <RegisteredTicketForm action={submit} />
)}
      </div>
    </div>
  );
}
