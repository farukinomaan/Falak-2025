"use client";
import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { culturalCategories } from "@/lib/mock_data/categories";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const Horizontal: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  const [isTablet, setIsTablet] = useState(false);
  const [extraSpace, setExtraSpace] = useState(0);

  useEffect(() => {
    const checkSize = () => {
      setIsTablet(window.innerWidth <= 1024);
      setExtraSpace(window.innerWidth / 2.5);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useLayoutEffect(() => {
    if (isTablet) return;

    const section = sectionRef.current;
    const slider = sliderRef.current;
    if (!section || !slider) return;

    const totalScrollWidth = slider.scrollWidth - window.innerWidth;
    if (totalScrollWidth <= 0) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.killAll(false);
      const horizontalTween = gsap.to(slider, {
        x: -totalScrollWidth,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalScrollWidth}`,
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      cardsRef.current.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: "left center",
          end: "right center",
          containerAnimation: horizontalTween,
          onEnter: () => highlightCard(i),
          onEnterBack: () => highlightCard(i),
        });
      });

      function highlightCard(index: number) {
        cardsRef.current.forEach((c, i) => {
          if (i === index) {
            gsap.to(c, {
              scale: 1.05,
              opacity: 1,
              border: "3px solid white",
              duration: 0.3,
            });
          } else {
            gsap.to(c, {
              scale: 0.9,
              opacity: 0.5,
              border: "3px solid transparent",
              duration: 0.3,
            });
          }
        });
      }
    }, section);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [isTablet, extraSpace]);

  return (
    <section
      ref={sectionRef}
      className={`overflow-hidden bg-transparent ${isTablet ? "py-10 px-4" : ""}`}
      style={{
        margin: 0,
        padding: 0,
        width: "100vw",
        height: isTablet ? "auto" : "100vh",
      }}
    >
      <div
        ref={sliderRef}
        className={`${isTablet ? "flex flex-col items-center gap-6" : "flex items-start"}`}
        style={{
          willChange: "transform",
          height: isTablet ? "auto" : "100vh",
        }}
      >
        <div
  className={`flex-shrink-0 flex items-center justify-center text-white font-bold ${
    isTablet ? "text-4xl mb-6 pt-20" : "text-6xl"
  }`}
  style={{
    width: isTablet ? "100%" : "100vw",
    height: isTablet ? "auto" : "100vh",
    fontFamily: "'Orbitron', sans-serif",
  }}
>
  Cultural Events
</div>


        {culturalCategories.map((cat, index) => (
          <div
            key={cat.id}
            ref={(el) => {
              if (el) cardsRef.current[index] = el;
            }}
            className="flex-shrink-0 flex flex-col justify-center items-center p-4 transition-all"
            style={{
              height: isTablet ? "auto" : "80vh",
              width: isTablet ? "70%" : "350px",
              margin: isTablet ? "0" : "80px 20px",
              backgroundColor: "rgba(0,0,0,0.6)",
              border: "3px solid transparent",
              boxSizing: "border-box",
              borderRadius: "1rem",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              {cat.title}
            </h2>
            <ul className="space-y-2 mb-4">
              {cat.subcategories.map((s) => (
                <li key={s.id}>
                  <Link
                    className="text-blue-400 hover:text-blue-300"
                    href={`/cultural_events/${cat.slug}`}
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              className="text-white bg-gray-900 px-4 py-2 rounded hover:bg-gray-800"
              href={`/cultural_events/${cat.slug}`}
            >
              View {cat.title}
            </Link>
          </div>
        ))}

        {!isTablet && (
          <div
            style={{
              flexShrink: 0,
              width: `${extraSpace}px`,
              height: "100%",
            }}
          />
        )}
      </div>
    </section>
  );
};

export default Horizontal;
