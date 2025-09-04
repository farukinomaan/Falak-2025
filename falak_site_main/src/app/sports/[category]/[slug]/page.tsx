import { ClusterEvent, getClusterEventParams } from "@/app/_clusterPages/clusterPages";

export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() { return getClusterEventParams("sports"); }

export default async function SportsEventDetail({ params }: { params: Promise<{ category: string; slug: string }> }) { const { category, slug } = await params; return ClusterEvent({ cluster: "sports", category, slug }); }
