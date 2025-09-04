import { ClusterRoot } from "@/app/_clusterPages/clusterPages";
export const revalidate = 60;
export default function SportsPage() { return ClusterRoot({ cluster: "sports" }); }
