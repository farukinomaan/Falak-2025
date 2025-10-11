"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import React, { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Button from "./Button";

gsap.registerPlugin(ScrollTrigger);

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const dateRef = useRef<HTMLHeadingElement | null>(null);
  const ctaBlockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.set("#video-frame", {
      clipPath: "polygon(14% 0, 72% 0, 88% 90%, 0 95%)",
      borderRadius: "0% 0% 40% 10%",
    });
    gsap.from("#video-frame", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      borderRadius: "0% 0% 0% 0%",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#video-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
  }, []);

  // Title animation (staggered characters + gentle bob)
  useEffect(() => {
    const titleEl = titleRef.current;
    if (!titleEl) return;
    const chars = titleEl.querySelectorAll<HTMLElement>(".hero-char");
    gsap.set(chars, { y: 60, opacity: 0, filter: "blur(4px)" });
    const tl = gsap.timeline();
    tl.fromTo(
      chars,
      { y: 60, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out", stagger: 0.02 }
    );
    tl.fromTo(
      titleEl,
      { scale: 0.96 },
      { scale: 1, duration: 0.6, ease: "back.out(1.6)" },
      "<"
    );
    // Gentle bob
    gsap.to(titleEl, { y: "+=6", duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    return () => { tl.kill(); };
  }, []);

  // Support text animations
  useEffect(() => {
    const d = dateRef.current;
    const cta = ctaBlockRef.current;
    if (d) gsap.fromTo(d, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.15 });
    if (cta) gsap.fromTo(cta, { x: -20, y: -10, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.25 });
  }, []);

  // Title text split into characters for stagger
  const titleText = useMemo(() => "Welcome to FALAK'25", []);
  const titleChars = useMemo(() => Array.from(titleText), [titleText]);
  // We want a mobile-only line break before "FALAK'25"
  const mobileBreakIndex = useMemo(() => titleText.indexOf(" FALAK"), [titleText]);

  // No background video. Keep a transparent frame and animated shape only.

  return (
  <div ref={containerRef} className="relative h-[100dvh] w-full overflow-hidden bg-transparent">
  <div
    id="video-frame"
    className="relative z-10 h-[100dvh] w-full overflow-hidden rounded-lg bg-transparent"
    style={{ willChange: "transform", pointerEvents: "none"}}
  >
        {/* Centered Hero Title */}
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <h1
            ref={titleRef}
            aria-label={titleText}
            className="vintage-font text-[#DBAAA6] text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl drop-shadow-[0_3px_14px_rgba(0,0,0,0.38)] text-center px-4 whitespace-normal"
          >
            {titleChars.map((ch, i) => {
              // Insert a responsive line break on mobile at the desired breakpoint
              if (i === mobileBreakIndex) {
                return (
                  <React.Fragment key="mobile-br">
                    {/* Keep a space on >= sm screens to stay on one line */}
                    <span className="hidden sm:inline" aria-hidden>
                      &nbsp;
                    </span>
                    {/* Force a line break on small screens */}
                    <br className="block sm:hidden" />
                  </React.Fragment>
                );
              }
              return (
                <span
                  key={i}
                  className="hero-char inline-block will-change-transform"
                  aria-hidden="true"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              );
            })}
          </h1>
        </div>
        {/* Background removed: transparent to show page background */}

        {/* Foreground Text */}
        <div className="absolute bottom-5 right-5 z-40 flex flex-col items-end pointer-events-none space-y-1">
  <h3 ref={dateRef} className="vintage-font text-[#D7897D] sm:text-xl md:text-3xl">
    <b>6-12 Oct 25</b>
  </h3>
  <h1 className="vintage-font text-[#DBAAA6] sm:text-2xl md:text-5xl">
    <b>JOIN US</b>
  </h1>
</div>


        {/* Overlay Content */}
{/* Overlay Content */}
<div ref={ctaBlockRef} className="absolute top-20 left-2 sm:top-22 sm:left-10 z-[999] flex flex-col items-start space-y-4 pointer-events-auto">
  <h3 className="vintage-font text-white text-lg sm:text-xl md:text-2xl">
    {/* optional heading content */}
  </h3>

  <div className="absolute top-7 left-2 sm:top-7 sm:left-9 z-[60] pointer-events-auto flex flex-col items-start space-y-4">
    <Link href="/passes" className="pointer-events-auto">
      <Button
        title="Get your passes now"
        containerClass="
          bg-[#DBAAA6]
          text-[#1A0E07]
          uppercase tracking-wide
          rounded-md
          vintage-font
          text-sm sm:text-base md:text-lg
          button-shadow-border
          whitespace-nowrap
        "
      />
    </Link>
  </div>
</div>


      </div>

      {/* Background Text */}
      <h1 className="vintage-font absolute bottom-5 right-5 text-[#D7897D] sm:text-2xl md:text-5xl z-[10] pointer-events-none">
        <b>JOIN US</b>
      </h1>
    </div>

  );
};



export default Hero;
