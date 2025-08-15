"use client";

import React from "react";
import Link from "next/link";
import { sportsCategories } from "@/lib/mock_data/categories";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Sports: React.FC = () => {
  useGSAP(() => {
    gsap.utils.toArray<HTMLElement>(".sports-card").forEach((card) => {
      gsap.from(card, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
        },
      });
    });
  });

  return (
    <section className="sports-section relative w-full overflow-hidden">
      {/* Background */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/images/sports-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Content */}
      <div
        className="container mx-auto flex flex-col items-center py-20 relative z-20"
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        <div className="text-center text-white space-y-2">
          <h1 className="text-4xl font-bold">Sports Events</h1>
          <p className="text-lg max-w-xl mx-auto text-gray-200">
            Explore our exciting lineup of sports events and activities. Choose
            your game, get the details, and join the action!
          </p>
        </div>

        {/* Feature Cards */}
        <div className="sports-grid mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {sportsCategories.map((cat) => (
            <div
              key={cat.id}
              className="sports-card flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300"
            >
              {/* Image */}
              <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Image here</span>
              </div>

              {/* Text */}
              <div className="flex flex-col flex-grow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {cat.title}
                </h2>
                <ul className="space-y-2 flex-grow">
                  {cat.subcategories.map((s) => (
                    <li key={s.id}>
                      <Link
                        className="text-blue-600 hover:underline"
                        href={`/sports_events/${cat.slug}`}
                      >
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Link
                    className="inline-block text-sm text-white bg-black px-4 py-2 rounded hover:bg-gray-800 transition"
                    href={`/sports_events/${cat.slug}`}
                  >
                    View {cat.title}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Sports;
