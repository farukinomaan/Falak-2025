import { ClusterCategory, getClusterCategoryParams } from "@/app/_clusterPages/clusterPages";

export const dynamicParams = false;
export const revalidate = 60;

export async function generateStaticParams() { return getClusterCategoryParams("cultural"); }

export default async function CulturalCategoryPage({ params }: { params: Promise<{ category: string }> }) { const { category } = await params; return ClusterCategory({ cluster: "cultural", category }); }
