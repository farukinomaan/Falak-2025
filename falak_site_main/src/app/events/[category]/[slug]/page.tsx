import { redirect } from "next/navigation";

export const dynamicParams = true;

export default async function EventsSlugRedirect({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  redirect(`/sports/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`);
}
