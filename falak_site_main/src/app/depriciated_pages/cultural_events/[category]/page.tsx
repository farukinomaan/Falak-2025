import { redirect } from "next/navigation";
export const dynamicParams = true;
export default async function CulturalCategoryRedirect({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  redirect(`/cultural/${encodeURIComponent(category)}`);
}

