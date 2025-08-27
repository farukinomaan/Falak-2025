import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { createTicket } from "@/lib/actions/tables/tickets";
import { ticketCategories } from "@/lib/validation/tickets";


export default function RegisteredTicketForm({ action }: { action: (fd: FormData) => Promise<void> }) {
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
