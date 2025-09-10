import LoadingIndicatorClient from "@/app/_clusterPages/LoadingIndicatorClient";

export default function Loading() {
  return (
    <div className="clusterContainer max-w-3xl mx-auto p-6 md:p-10 cultural">
      <LoadingIndicatorClient startOnMount stopOnUnmount={false} />
      <div className="clusterCard rounded-2xl p-10 flex items-center justify-center min-h-[40vh] animate-pulse">
        <h1 className="text-4xl md:text-6xl font-semibold text-center tracking-wide">Loading…</h1>
      </div>
    </div>
  );
}
