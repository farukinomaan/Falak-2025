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
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Support Ticket</h1>
      {!session || !email ? (
        <GuestContactForm />
      ) : !registeredUser ? (
        <UnregisteredNotice />
      ) : (
        <RegisteredTicketForm action={submit} />
      )}
    </div>
  );
}

function UnregisteredNotice() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        You are logged in but haven&apos;t completed registration. Please finish onboarding to raise a support ticket tied to your account.
      </p>
      <a href="/onboarding" className="inline-block px-4 py-2 rounded bg-black text-white">Complete Registration</a>
      <div className="pt-4 border-t">
        <GuestContactForm />
      </div>
    </div>
  );
}

function RegisteredTicketForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium">Category</label>
        <select name="category" className="w-full border rounded px-3 py-2">
          {ticketCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Problem</label>
        <textarea
          name="issue"
          required
          rows={5}
          className="w-full border rounded px-3 py-2"
          placeholder="Describe the issue..."
        />
      </div>
      <button type="submit" className="px-4 py-2 rounded bg-black text-white">Submit</button>
    </form>
  );
}

 

