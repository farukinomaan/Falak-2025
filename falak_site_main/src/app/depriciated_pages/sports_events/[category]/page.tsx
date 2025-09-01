import { redirect } from "next/navigation";
export const dynamicParams = true;
export default async function SportsCategoryRedirect({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  redirect(`/sports/${encodeURIComponent(category)}`);
}

