import { PassItem } from "@/lib/types";

export const passes: PassItem[] = [
  {
    id: "pass-pro-show",
    slug: "pro-show",
    title: "Pro Show Pass",
    description: "Access to headliner pro show night.",
    price: 799,
    perks: ["VIP Entry", "Preferred Seating"],
    videoSrc: "videos/feature-1.mp4"
  },
  {
    id: "pass-event",
    slug: "event-pass",
    title: "Event Pass",
    description: "Entry to cultural and sports events (non-pro-show).",
    price: 499,
    perks: ["All Events Access"],
    videoSrc: "videos/feature-1.mp4"
  },
  {
    id: "pass-all-access",
    slug: "all-access",
    title: "All Access Pass",
    description: "Includes pro show and all events.",
    price: 1199,
    perks: ["All Events", "Pro Show", "Merch Coupon"],
    videoSrc: "videos/feature-1.mp4"
  },
];

