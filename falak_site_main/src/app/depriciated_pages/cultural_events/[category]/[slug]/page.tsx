import { redirect } from "next/navigation";
export const dynamicParams = true;
export default async function CulturalSlugRedirect({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  redirect(`/cultural/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`);
}

