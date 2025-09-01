import { ClusterCategory, getClusterCategoryParams } from "@/app/_clusterPages/clusterPages";

export const dynamicParams = false;
export const revalidate = 60;

export async function generateStaticParams() { return getClusterCategoryParams("sports"); }

export default async function SportsCategoryPage({ params }: { params: Promise<{ category: string }> }) { const { category } = await params; return ClusterCategory({ cluster: "sports", category }); }
