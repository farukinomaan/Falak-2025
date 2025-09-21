import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { createTicket } from "@/lib/actions/tables/tickets";
import { ticketCategories } from "@/lib/validation/tickets";


export default function RegisteredTicketForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  return (
    <div className="bg-[#32212C] backdrop-blur-sm rounded-2xl border-2 border-black/95 p-4 sm:p-6 md:p-8">
      <h1 className="font-unlock text-xl sm:text-2xl md:text-3xl text-neutral-100 font-semibold mb-4 sm:mb-6 text-center">
        
      </h1>
      <form action={action} className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <label className="abhaya-font block text-xl sm:text-base font-large text-neutral-50">
            Category
          </label>
          <select 
            name="category" 
            className="w-full border-2 rounded px-3 py-2 border-[#D3877A] focus:border-[#DBAAA6] text-neutral-50"
          >
            {ticketCategories.map((c) => (
              <option key={c} value={c} className="text-black">
                {c}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="abhaya-font block text-xl sm:text-base font-large text-neutral-50 ">
            Problem
          </label>
          <textarea
            name="issue"
            required
            rows={4}
            className="w-full text-neutral-50 border-2 rounded px-3 py-2 border-[#D3877A] focus:border-[#DBAAA6]"
            placeholder="Describe the issue..."
          />
        </div>
        
        <div className="text-center pt-2">
          <button 
            type="submit" 
            className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg bg-[#de8c89] w-full hover:bg-[#DBAAA6] text-[#32212C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
