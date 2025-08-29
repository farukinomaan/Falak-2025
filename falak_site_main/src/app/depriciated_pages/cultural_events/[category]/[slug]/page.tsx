// import { notFound } from "next/navigation";
// import { saListEvents } from "@/lib/actions/adminAggregations";
// import AddToCartButton from "@/components/cart/AddToCartButton";

// export const dynamicParams = true;
// export const revalidate = 60;

// export async function generateStaticParams() {
//   const res = await saListEvents();
//   const events = res.ok ? (res.data as Array<{ id: string; sub_cluster: string }>) : [];
//   return events.map((e) => ({ category: e.sub_cluster, slug: e.id }));
// }

// export default async function CulturalEventDetail({
//   params,
// }: {
//   params: Promise<{ category: string; slug: string }>;
// }) {
//   const { category, slug } = await params;
//   type Evt = {
//     id: string;
//     name: string;
//     description?: string | null;
//     venue: string;
//     sub_cluster: string;
//     date?: string | Date | null;
//     price?: number | string | null;
//   };
//   const res = await saListEvents();
//   const events = res.ok ? (res.data as Evt[]) : [];
//   const event = events.find((e) => e.id === slug && e.sub_cluster === category);
//   if (!event) return notFound();
//   const dateStr =
//     event.date &&
//     (typeof event.date === "string"
//       ? new Date(event.date).toLocaleString()
//       : event.date instanceof Date
//       ? event.date.toLocaleString()
//       : undefined);
//   const priceStr =
//     typeof event.price === "number" || typeof event.price === "string" ? String(event.price) : undefined;

//   return (
//     <div className="max-w-3xl mx-auto p-6 space-y-4">
//       <h1 className="text-3xl font-semibold">{event.name}</h1>
//       {event.description && <p className="text-gray-700">{event.description}</p>}
//       <div className="text-sm space-y-1">
//         <p>Venue: {event.venue}</p>
//         {dateStr && <p>Date: {dateStr}</p>}
//         {priceStr && <p>Price: ₹{priceStr}</p>}
//       </div>
//   <AddToCartButton passId={event.id} />
//     </div>
//   );
// }

import { notFound } from "next/navigation";
import { saListEvents } from "@/lib/actions/adminAggregations";
import AddToCartButton from "@/components/cart/AddToCartButton";

export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  const res = await saListEvents();
  const events = res.ok ? (res.data as Array<{ id: string; sub_cluster: string }>) : [];
  return events.map((e) => ({ category: e.sub_cluster, slug: e.id }));
}

export default async function CulturalEventDetail({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  
  type Evt = {
    id: string;
    name: string;
    description?: string | null;
    venue: string;
    sub_cluster: string;
    date?: string | Date | null;
    price?: number | string | null;
  };

  const res = await saListEvents();
  const events = res.ok ? (res.data as Evt[]) : [];
  const event = events.find((e) => e.id === slug && e.sub_cluster === category);

  if (!event) return notFound();

  const dateStr =
    event.date &&
    (typeof event.date === "string"
      ? new Date(event.date).toLocaleString()
      : event.date instanceof Date
      ? event.date.toLocaleString()
      : undefined);

  const priceStr =
    typeof event.price === "number" || typeof event.price === "string" 
      ? String(event.price) 
      : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Animated background shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rotate-45 animate-bounce opacity-60"></div>
        <div className="absolute bottom-32 left-16 w-40 h-40 bg-gradient-to-br from-green-400/20 to-cyan-500/20 rounded-full animate-ping opacity-40"></div>
        <div className="absolute bottom-20 right-12 w-28 h-28 bg-gradient-to-br from-rose-400/20 to-pink-500/20 rotate-12 animate-spin opacity-50"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Category Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 
                        backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6">
            <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse"></div>
            <span className="text-white/80 font-medium uppercase tracking-wider text-sm">
              {category.replace('_', ' ')}
            </span>
          </div>

          {/* Event Title */}
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-gradient-to-r 
                       from-pink-400 via-purple-400 to-cyan-400 bg-clip-text mb-6 
                       leading-tight tracking-tight">
            {event.name}
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent w-24"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-spin"></div>
            <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent w-24"></div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl 
                      shadow-2xl overflow-hidden mb-8">
          
          {/* Event Details Grid */}
          <div className="p-8 md:p-12">
            {/* Description */}
            {event.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full"></div>
                  About This Event
                </h2>
                <p className="text-white/80 text-lg leading-relaxed font-light">
                  {event.description}
                </p>
              </div>
            )}

            {/* Event Info Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Venue Card */}
              <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 
                            backdrop-blur-sm border border-white/20 rounded-2xl p-6 
                            hover:scale-105 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 
                                rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-lg">Venue</h3>
                </div>
                <p className="text-white/80 font-medium">{event.venue}</p>
              </div>

              {/* Date Card */}
              {dateStr && (
                <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 
                              backdrop-blur-sm border border-white/20 rounded-2xl p-6 
                              hover:scale-105 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-cyan-500 
                                  rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold text-lg">Date & Time</h3>
                  </div>
                  <p className="text-white/80 font-medium">{dateStr}</p>
                </div>
              )}

              {/* Price Card */}
              {priceStr && (
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 
                              backdrop-blur-sm border border-white/20 rounded-2xl p-6 
                              hover:scale-105 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 
                                  rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold text-lg">Price</h3>
                  </div>
                  <p className="text-white/80 font-bold text-xl">₹{priceStr}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 
                        backdrop-blur-lg border border-white/20 rounded-3xl p-8 
                        shadow-2xl hover:shadow-3xl transition-all duration-300">
            
            {/* Decorative elements */}
            <div className="flex justify-center gap-2 mb-6">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Experience 
              <span className="text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text"> Falak Fest</span>?
            </h2>
            
            <p className="text-white/80 mb-8 text-lg font-light max-w-2xl mx-auto">
              Don't miss out on this incredible cultural experience. 
              Secure your spot at one of the most vibrant festivals of the year!
            </p>

            {/* Enhanced Add to Cart Button */}
            <div className="relative inline-block group">
              {/* Glowing background effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 
                            rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
              
              {/* Button wrapper */}
              <div className="relative">
                <AddToCartButton passId={event.id} />
              </div>
            </div>

            {/* Additional info */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                Instant Confirmation
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                Secure Payment
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                Mobile Tickets
              </span>
            </div>
          </div>
        </div>

        {/* Festival Branding */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-3 text-white/40 text-sm">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <span className="font-light tracking-widest uppercase">Falak Fest 2025</span>
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping opacity-60"></div>
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-pink-300 rounded-full animate-ping opacity-40" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-purple-300 rounded-full animate-ping opacity-50" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-cyan-300 rounded-full animate-ping opacity-70" style={{animationDelay: '0.5s'}}></div>
    </div>
  );
}

