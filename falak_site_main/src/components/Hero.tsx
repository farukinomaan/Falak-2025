"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "./Button";

gsap.registerPlugin(ScrollTrigger);

const Hero: React.FC = () => {
  const [currentIndex] = useState<number>(1);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);

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

  const getVideoSrc = (index: number): string => `/videos/bh.mp4`;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative h-[100dvh] w-screen overflow-x-hidden bg-transparent">
      <div
        id="video-frame"
        className="relative z-10 h-[100dvh] w-screen overflow-hidden rounded-lg bg-blue-75"
        style={{ willChange: "transform" }}
      >
        <div>
          {!prefersReducedMotion ? (
            <video
              ref={mainVideoRef}
              src={getVideoSrc(currentIndex)}
              autoPlay
              loop
              muted
              preload="auto"
              playsInline
              poster="/window.svg"
              className="absolute left-0 top-0 w-full h-full object-cover object-center"
              onLoadedData={(e) => {
                (e.currentTarget as HTMLVideoElement).classList.remove("opacity-0");
              }}
            />
          ) : (
            <Image
              src="/window.svg"
              alt="Falak hero"
              fill
              priority
              sizes="100vw"
              className="absolute left-0 top-0 object-cover object-center"
            />
          )}
        </div>

        {/* Foreground Text */}
        <h1 className="special-font hero-heading absolute bottom-5 right-5 z-40 text-[#DBAAA6] text-xl sm:text-2xl md:text-3xl">
          <b>JOIN US</b>
        </h1>

        {/* Overlay Content */}
<div className="absolute inset-0 z-40 flex items-start justify-start">
  <div className="mt-20 sm:mt-22 px-2 sm:px-2 flex flex-col items-start">
    {/* Heading */}
    <h3
      className="special-font hero-heading text-white mb-2 text-lg sm:text-xl md:text-2xl ml-2 sm:ml-11"
    >
      {/* optional heading content */}
    </h3>

    {/* Button */}
    <Link href="/passes">
      <Button
        id=""
        title="Get your passes now"
        containerClass="
          bg-[#DBAAA6]
          text-[#1A0E07]
          font-extrabold uppercase tracking-wide
          px-4 sm:px-6 py-2 sm:py-3 rounded-md
          border-2 border-[#1A0E07]
          shadow-[4px_4px_0px_0px_rgba(26,14,7,1)]
          hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none
          transition-all duration-150
          ml-2 sm:ml-10
          text-sm sm:text-base md:text-lg
        "
      />
    </Link>
  </div>
</div>

      </div>

      {/* Background Text */}
      <h1 className="special-font hero-heading absolute bottom-5 right-5 text-[#D7897D] text-xl sm:text-2xl md:text-3xl">
        <b>JOIN US</b>
      </h1>
    </div>
  );
};

export default Hero;
