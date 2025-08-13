"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { TiLocationArrow } from "react-icons/ti";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Button from "./Button";
import VideoPreview from "./VideoPreview";

gsap.registerPlugin(ScrollTrigger);

const totalVideos = 4;

const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(1);
  const [hasClicked, setHasClicked] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadedVideos, setLoadedVideos] = useState<number>(0);

  // Separate refs for current and next videos
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);
  const nextVideoRef = useRef<HTMLVideoElement | null>(null);

  // ✅ Hide loader as soon as the first video loads
  const handleVideoLoad = (index: number) => {
    if (index === currentIndex) {
      setLoading(false); // first visible video loaded → show Hero
    }
    setLoadedVideos((prev) => prev + 1);
  };

  const handleMiniVdClick = () => {
    setHasClicked(true);
    setCurrentIndex((prevIndex) => (prevIndex % totalVideos) + 1);
  };

  useEffect(() => {
    if (hasClicked) {
      gsap.set("#next-video", { visibility: "visible" });
      gsap.to("#next-video", {
        transformOrigin: "center center",
        scale: 1,
        width: "100%",
        height: "100%",
        duration: 1,
        ease: "power1.inOut",
        onStart: () => {
          nextVideoRef.current?.play();
        },
      });
      gsap.from("#current-video", {
        transformOrigin: "center center",
        scale: 0,
        duration: 1.5,
        ease: "power1.inOut",
      });
    }
  }, [currentIndex, hasClicked]);

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
  useEffect(() => {
    for (let i = 1; i <= totalVideos; i++) {
      const vid = document.createElement("video");
      vid.src = getVideoSrc(i);
      vid.preload = "auto";
      vid.muted = true;
      vid.playsInline = true;
  
      // Force decoding by starting playback silently
      vid.play().catch(() => {});
    }
  }, []);
  

  // Safety fallback: hide loader after 3s max
  useEffect(() => {
    const fallback = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(fallback);
  }, []);

  const getVideoSrc = (index: number): string => `/videos/hero-${index}.mp4`;

  return (
    <div className="relative h-dvh w-screen overflow-x-hidden bg-white">
      {loading && (
        <div className="flex-center absolute z-[100] h-dvh w-screen overflow-hidden bg-violet-50">
          {/* Loader animation */}
          <div className="three-body">
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
          </div>
        </div>
      )}

      <div
        id="video-frame"
        className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75"
      >
        <div>

          {/* Small Next Video */}
          <video
            ref={currentVideoRef}
            src={getVideoSrc(currentIndex)}
            loop
            muted
            id="next-video"
            className="absolute-center invisible absolute z-20 size-64 object-cover object-center"
            onLoadedData={() => handleVideoLoad(currentIndex)}
          />

          {/* Main Background Video */}
          <video
            src={getVideoSrc(
              currentIndex === totalVideos - 1 ? 1 : currentIndex
            )}
            autoPlay
            loop
            muted
            preload="auto"
            className="absolute left-0 top-0 size-full object-cover object-center"
            onLoadedData={() =>
              handleVideoLoad(
                currentIndex === totalVideos - 1 ? 1 : currentIndex
              )
            }
          />
        </div>

        {/* Foreground Text */}
        <h1 className="special-font hero-heading absolute bottom-5 right-5 z-40 text-white">
          F<b>A</b>LAK
        </h1>

        {/* Overlay Content */}
        <div className="absolute left-0 top-0 z-40 size-full">
          <div className="mt-24 px-5 sm:px-10">
            <h1 className="special-font hero-heading text-blue-100">
            Join us
            </h1>

            <p className="mb-5 max-w-64 font-robert-regular text-blue-100">
            Where Talent Meets Passion <br /> The Ultimate Fest Experience
            </p>

            <Link href="/passes">
            <Button
              id="watch-trailer"
              title="Get your passes now"
              containerClass="bg-yellow-300 flex-center gap-"
              />
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
