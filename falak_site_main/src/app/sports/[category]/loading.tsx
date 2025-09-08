import LoadingIndicatorClient from "@/app/_clusterPages/LoadingIndicatorClient";

export default function Loading() {
  return (
    <div className="clusterContainer max-w-5xl mx-auto p-4 md:p-6 space-y-4 sports">
      <LoadingIndicatorClient startOnMount stopOnUnmount={false} />
      <h1 className="text-3xl font-semibold">Loading…</h1>
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 clusterCard border rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
