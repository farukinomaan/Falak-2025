import { redirect } from "next/navigation";

// Kept only to satisfy any lingering build references; runtime redirects to /sports
export default function EventsRedirect() {
  redirect("/sports");
}
