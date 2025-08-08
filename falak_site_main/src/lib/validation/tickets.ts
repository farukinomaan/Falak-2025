import { z } from "zod";
import type { TicketCategory } from "@/lib/types";

export const ticketCategories: TicketCategory[] = [
  "pro-show-pass not generated",
  "event-pass not generated",
  "other",
];

export const SupportTicketSchema = z.object({
  username: z.string().min(2),
  phone: z
    .string()
    .min(7)
    .max(15)
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone"),
  non_mahe_student: z.boolean().default(false),
  clg_registration_number: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  category: z.enum(ticketCategories as [TicketCategory, ...TicketCategory[]]),
  problem: z.string().min(10),
});

