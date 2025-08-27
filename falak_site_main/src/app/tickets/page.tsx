import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { createTicket } from "@/lib/actions/tables/tickets";
import { ticketCategories } from "@/lib/validation/tickets";
import GuestContactForm from "../../components/tickets/GuestContactForm";
import RegisteredTicketForm from "../../components/tickets/ti_register"
import UnregisteredNotice from "../../components/tickets/ti_unreg";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen md:bg-[url/(background-mob.gif)] bg-[url(/background.gif)] bg-cover bg-center bg-no-repeat bg-fixed flex items-center py-4 sm:py-8 px-4">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-100 font-semibold mb-4 sm:mb-6 text-center">
          Support Ticket
        </h1>
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



