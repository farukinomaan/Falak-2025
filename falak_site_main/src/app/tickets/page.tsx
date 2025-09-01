import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { createTicket } from "@/lib/actions/tables/tickets";
import { ticketCategories } from "@/lib/validation/tickets";
import GuestContactForm from "./GuestContactForm";
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
          <UnregisteredNotice />
        ) : (
          <RegisteredTicketForm action={submit} />
        )}
      </div>
    </div>
  );
}

function UnregisteredNotice() {
  return (
    <div className="max-h-screen 
  max-w-screen 
  bg-[#191919]/95
  border 
  backdrop-blur-sm
  rounded-2xl 
  border-black/5 
  py-10 
  px-7 
  text-neutral-50">
      <p className="text-sm sm:text-base text-center">
        You are logged in but haven&apos;t completed registration. Please finish onboarding to raise a support ticket tied to your account.
      </p>
      <div className="text-center">
        <a 
          href="/onboarding" 
          className="mb-2 mt-2 inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gray-600 text-white text-sm sm:text-base hover:bg-gray-700 transition-colors"
        >
          Complete Registration
        </a>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <GuestContactForm standalone={false} />
      </div>
    </div>
  );
}

function RegisteredTicketForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  return (
    <div className="bg-[#191919]/95 backdrop-blur-sm rounded-2xl border-2 border-black/95 p-4 sm:p-6 md:p-8">
      <form action={action} className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <label className="block text-sm sm:text-base font-medium text-neutral-50">
            Category
          </label>
          <select 
            name="category" 
            className="text-neutral-50 w-full border-2 border-neutral-50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
          >
            {ticketCategories.map((c) => (
              <option key={c} value={c} className="text-black">
                {c}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm sm:text-base font-medium text-neutral-50 ">
            Problem
          </label>
          <textarea
            name="issue"
            required
            rows={4}
            className="w-full border-2 text-neutral-50 border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            placeholder="Describe the issue..."
          />
        </div>
        
        <div className="text-center pt-2">
          <button 
            type="submit" 
            className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg bg-gray-600 text-white text-sm sm:text-base hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
