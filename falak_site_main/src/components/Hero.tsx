"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "./Button";

gsap.registerPlugin(ScrollTrigger);

const Hero: React.FC = () => {
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

  const getVideoSrc = (): string => `/videos/bh.mp4`;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-transparent">
  <div
    id="video-frame"
    className="relative z-10 h-[100dvh] w-full overflow-hidden rounded-lg bg-blue-75"
    style={{ willChange: "transform", pointerEvents: "none"}}
  >

        <div>
          {!prefersReducedMotion ? (
            <video
              ref={mainVideoRef}
              src={getVideoSrc()}
              autoPlay
              loop
              muted
              preload="auto"
              playsInline
              poster="/window.svg"
              className="absolute left-0 top-0 w-full h-full object-cover object-center pointer-events-none"
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
              className="absolute left-0 top-0 object-cover object-center pointer-events-none"
            />
          )}
        </div>

        {/* Foreground Text */}
        <h1 className="vintage-font absolute bottom-5 right-5 z-40 text-[#DBAAA6] sm:text-2xl md:text-5xl pointer-events-none">
          <b>JOIN US</b>
        </h1>

        {/* Overlay Content */}
{/* Overlay Content */}
<div className="absolute top-20 left-2 sm:top-22 sm:left-10 z-[999] flex flex-col items-start space-y-4 pointer-events-auto">
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
