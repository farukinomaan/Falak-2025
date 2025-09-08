import LoadingIndicatorClient from "@/app/_clusterPages/LoadingIndicatorClient";

export default function Loading() {
  return (
    <div className="clusterContainer max-w-6xl mx-auto p-4 md:p-6 space-y-8 sports">
      <LoadingIndicatorClient startOnMount stopOnUnmount={false} />
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold">Sports Events</h1>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 clusterCard border rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
