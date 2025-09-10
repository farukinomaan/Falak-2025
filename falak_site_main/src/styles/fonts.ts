import { Press_Start_2P } from "next/font/google";

// Single shared instance to avoid duplicate font injection and reduce flicker
export const press = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  preload: true,
  variable: "--font-press-start-2p",
});
