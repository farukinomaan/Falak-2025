import { ClusterEvent, getClusterEventParams } from "@/app/_clusterPages/clusterPages";

export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() { return getClusterEventParams("cultural"); }

export default async function CulturalEventDetail({ params }: { params: Promise<{ category: string; slug: string }> }) { const { category, slug } = await params; return ClusterEvent({ cluster: "cultural", category, slug }); }
