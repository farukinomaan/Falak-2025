import { EventCategory } from "@/lib/types";

export const culturalCategories: EventCategory[] = [
  {
    id: "cultural-music",
    slug: "music",
    title: "Music",
    kind: "cultural",
    subcategories: [
      { id: "music-solo", slug: "solo", title: "Solo" },
      { id: "music-band", slug: "band", title: "Band" },
    ],
  },
  {
    id: "cultural-dance",
    slug: "dance",
    title: "Dance",
    kind: "cultural",
    subcategories: [
      { id: "dance-solo", slug: "solo", title: "Solo" },
      { id: "dance-group", slug: "group", title: "Group" },
    ],
  },
  {
    id: "cultural-drama",
    slug: "drama",
    title: "Drama",
    kind: "cultural",
    subcategories: [
      { id: "drama-street", slug: "street", title: "Street" },
      { id: "drama-theatre", slug: "theatre", title: "Theatre" },
    ],
  },
];

export const sportsCategories: EventCategory[] = [
  {
    id: "sports-football",
    slug: "football",
    title: "Football",
    kind: "sports",
    subcategories: [
      { id: "football-5v5", slug: "5v5", title: "5 v 5" },
      { id: "football-11v11", slug: "11v11", title: "11 v 11" },
    ],
  },
  {
    id: "sports-basketball",
    slug: "basketball",
    title: "Basketball",
    kind: "sports",
    subcategories: [
      { id: "basketball-3x3", slug: "3x3", title: "3 x 3" },
      { id: "basketball-5x5", slug: "5x5", title: "5 x 5" },
    ],
  },
  {
    id: "sports-athletics",
    slug: "athletics",
    title: "Athletics",
    kind: "sports",
    subcategories: [
      { id: "athletics-track", slug: "track", title: "Track" },
      { id: "athletics-field", slug: "field", title: "Field" },
    ],
  },
];

export const allCategories: EventCategory[] = [
  ...culturalCategories,
  ...sportsCategories,
];

