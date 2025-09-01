"use client";

import Link from "next/link";
import Image from "next/image";
import { Dancing_Script } from "next/font/google";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "700"],
});

gsap.registerPlugin(ScrollTrigger);

type EventType = { id: string; sub_cluster: string; cluster_name?: string | null };

export default function Sports({ events }: { events: EventType[] }) {
  const introRef = useRef<SVGSVGElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [showIntro, setShowIntro] = useState(true);

  useLayoutEffect(() => {
    if (introRef.current) {
      const textEl = introRef.current.querySelector("text") as SVGTextElement | null;
      if (textEl) {
        const length = textEl.getComputedTextLength();
        gsap.set(textEl, {
          strokeDasharray: length,
          strokeDashoffset: length,
          fill: "transparent",
          stroke: "white",
        });
        const tl = gsap.timeline({
          onComplete: () => {
            setShowIntro(false);
            cardsRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        });
        
        tl.to(textEl, {
          strokeDashoffset: 0,
          duration: 4,
          ease: "power2.out"
        })
        .to(introRef.current, {
          opacity: 0,
          duration: 1
        }, "-=1.2"); 
        
      }
    }
  }, []);

  const sports = events.filter((e) => (e.cluster_name || "").toLowerCase() === "sports");
  const subs = Array.from(new Set(sports.map((e) => e.sub_cluster)));

  return (
    <div className="bg-black text-white">
      {/* Intro - only shows once */}
      {showIntro && (
        <div className="h-screen flex items-center justify-center">
          <svg
            ref={introRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -80 4500 900"
            className="w-[80%] h-auto"
          >
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className={dancingScript.className}
              fontSize="800"
              fill="transparent"
              stroke="white"
              strokeWidth="6"
            >
              Sports
            </text>
          </svg>
        </div>
      )}

      {/* Cards Section */}
      <div
        ref={cardsRef}
        className="max-w-5xl mx-auto min-h-screen pt-28 p-12 grid grid-cols-1 sm:grid-cols-2 gap-8 items-start"
      >
        {subs.slice(0, 2).map((slug) => (
          <div
            key={slug}
            className="relative w-full aspect-square overflow-hidden rounded-2xl 
                       border border-white/50 shadow-sm group 
                       transition duration-300 hover:shadow-lg hover:shadow-white/20"
          >
            {/* Image */}
            <Image
              src="/images/artist.png"
              alt={slug}
              fill
              className="object-cover transition duration-500 group-hover:blur-md"
            />

            {/* Hover Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center 
                            text-center opacity-0 group-hover:opacity-100 transition duration-500">
              <h2 className="text-2xl font-semibold mb-3">{slug}</h2>
              <Link
                className="inline-block text-sm text-black bg-white px-4 py-2 rounded"
                href={`/sports_events/${encodeURIComponent(slug)}`}
              >
                View {slug}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
