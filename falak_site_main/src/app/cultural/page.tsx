import { ClusterRoot } from "@/app/_clusterPages/clusterPages";
export const revalidate = 60;
export default function CulturalPage() { return ClusterRoot({ cluster: "cultural" }); }
