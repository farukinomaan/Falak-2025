import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { createTicket } from "@/lib/actions/tables/tickets";
import RegisteredTicketForm from "../../components/tickets/ti_register";
import UnregisteredNotice from "../../components/tickets/ti_unreg";
import { redirect } from "next/navigation";
import { Orbitron } from "next/font/google"; 

const orbitron = Orbitron({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"], 
  variable: "--font-typewriter",
});

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
    <div className="relative min-h-screen flex flex-col items-center justify-center
  pt-24 sm:pt-28 md:pt-16  
  py-6 sm:py-8 px-4 sm:px-6 md:px-8 lg:px-12"
>
  {/* Base background color */}
  <div
    className="absolute inset-0 bg-[#32212C] z-[-3]"
  />

  {/* SVG overlay */}
  <div
    className="absolute inset-0 bg-cover bg-center opacity-20 z-[-2]"
    style={{ backgroundImage: "url('/bg.svg')" }}
  />

  {/* Optional dark overlay */}
  <div className="absolute inset-0 bg-black/50 z-[-1]" />

  {/* Page content */}
  <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto">
    <h1 className={`vintage-font text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-neutral-100 font-semibold mb-6 sm:mb-8 text-center ${orbitron.variable}`}>
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
