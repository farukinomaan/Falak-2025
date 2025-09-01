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

  // Video ref
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

  const getVideoSrc = (index: number): string => `/videos/newafter.mp4`;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative h-dvh w-screen overflow-x-hidden bg-[#f2eae1]">
      <div
        id="video-frame"
        className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75"
        style={{ willChange: "transform" }}
      >
        <div>
          {/* Main Background Video */}
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
              className="absolute left-0 top-0 size-full object-cover object-center"
              onLoadedData={(e) => {
                (e.currentTarget as HTMLVideoElement).classList.remove("opacity-0");
              }}
            />
          ) : (
            // Reduced motion fallback image
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
        <h1 className="special-font hero-heading absolute bottom-5 right-5 z-40 text-white">
          F<b>A</b>LAK
        </h1>

        {/* Overlay Content */}
        <div className="absolute left-0 -top-5 z-40 size-full">
          <div className="mt-24 px-5 sm:px-10">
            <h1 className="special-font hero-heading text-white"><b>Join us</b></h1>

            {/* <p className="mb-5 max-w-64 font-robert-regular text-blue-100">
              Where Talent Meets Passion <br /> The Ultimate Fest Experience
            </p> */}

<Link href="/passes">
  <Button
    id=""
    title="Get your passes now"
    containerClass="
      bg-[#ebded1]   /* deep burnt orange */
      text-[#1A0E07] /* almost black espresso */
      font-extrabold uppercase tracking-wide
      px-6 py-3 rounded-md
      border-2 border-[#1A0E07]
      shadow-[4px_4px_0px_0px_rgba(26,14,7,1)]
      hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none
      transition-all duration-150
    "
  />
</Link>

          </div>
        </div>
      </div>

      {/* Background Text */}
      <h1 className="special-font hero-heading absolute bottom-5 right-5 text-[#7a1f1f]">
        F<b>A</b>LAK
      </h1>
    </div>
  );
};

export default Hero;

