export type EventKind = "cultural" | "sports";

export interface SubCategory {
  id: string;
  slug: string;
  title: string;
}

export interface EventCategory {
  id: string;
  slug: string;
  title: string;
  kind: EventKind;
  subcategories: SubCategory[];
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  categorySlug: string;
  subCategorySlug: string;
  kind: EventKind;
  venue: string;
  startDate: string; // ISO
  endDate?: string; // ISO
  image?: string;
  price?: number;
  capacity?: number;
  tags?: string[];
  isRegistrationOpen: boolean;
}

export interface PassItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  perks: string[];
  videoSrc: string;
}

export type TicketCategory =
  | "pro-show-pass not generated"
  | "event-pass not generated"
  | "account-access"
  | "payment-issue"
  | "other";

export interface SupportTicketInput {
  username: string;
  phone: string;
  non_mahe_student: boolean;
  clg_registration_number?: string;
  category: TicketCategory;
  problem: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  purchasedPassSlugs?: string[];
  registeredEventSlugs?: string[];
}

