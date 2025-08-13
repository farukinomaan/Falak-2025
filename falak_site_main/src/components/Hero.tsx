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

  const getVideoSrc = (index: number): string => `/videos/hero-${index}.mp4`;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative h-dvh w-screen overflow-x-hidden bg-white">
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
              preload="metadata"
              playsInline
              poster="/window.svg"
              className="absolute left-0 top-0 size-full object-cover object-center opacity-0 transition-opacity duration-500"
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
        <div className="absolute left-0 top-0 z-40 size-full">
          <div className="mt-24 px-5 sm:px-10">
            <h1 className="special-font hero-heading text-blue-100">Join us</h1>

            <p className="mb-5 max-w-64 font-robert-regular text-blue-100">
              Where Talent Meets Passion <br /> The Ultimate Fest Experience
            </p>

            <Link href="/passes">
              <Button id="watch-trailer" title="Get your passes now" containerClass="bg-yellow-300 flex-center gap-" />
            </Link>
          </div>
        </div>
      </div>

      {/* Background Text */}
      <h1 className="special-font hero-heading absolute bottom-5 right-5 text-black">
        F<b>A</b>LAK
      </h1>
    </div>
  );
};

export default Hero;
