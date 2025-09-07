"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Trailer: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null); // correct type
  const videoContainerRef = useRef<HTMLDivElement>(null); // for GSAP animation
  const descRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (sectionRef.current) {
      const ctx = gsap.context(() => {
        // Animate heading
        gsap.from(headingRef.current, {
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          y: 40,
          duration: 1,
          ease: "power3.out",
        });

        // Animate video container
        gsap.from(videoContainerRef.current, {
          scrollTrigger: {
            trigger: videoContainerRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          x: -80,
          duration: 1,
          ease: "power3.out",
        });

        // Animate description
        gsap.from(descRef.current, {
          scrollTrigger: {
            trigger: descRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          x: 80,
          duration: 1,
          ease: "power3.out",
        });
      }, sectionRef);

      return () => ctx.revert();
    }
  }, []);

  return (
    <section ref={sectionRef} className="w-full bg-transparent py-10 sm:py-16 px-4">
      <div className="max-w-[1100px] mx-auto">
        <h2
          ref={headingRef}
          className="vintage-font hero-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#DBAAA6] mb-8 sm:mb-12 tracking-wide text-center"
        >
          <b>FALAK 2025 Trailer</b>
        </h2>

        <div className="flex flex-col md:flex-row md:items-stretch md:space-x-6 lg:space-x-8 space-y-6 md:space-y-0">
          {/* Video with custom play button */}
          <div
            ref={videoContainerRef}
            className="w-full md:w-1/2 flex justify-center relative"
          >
            <video
              ref={videoRef}
              className="w-full h-auto rounded-lg shadow-lg border-4 border-[#DBAAA6]"
              src="/videos/trailervid.mp4"
              muted
              loop
              playsInline
              controls={isPlaying} // show controls only after play
            />

            {!isPlaying && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg"
              >
                <span className="w-16 h-16 bg-[#DBAAA6] text-[#32212C] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition">
                  ▶
                </span>
              </button>
            )}
          </div>

          {/* Description */}
          <div
            ref={descRef}
            className="w-full md:w-1/2 bg-[#32212C] p-4 sm:p-6 rounded-lg border-4 border-[#DBAAA6] shadow-lg text-[#DBAAA6] font-serif text-base sm:text-lg flex items-center"
          >
            <p>
              Falak, the annual sports and cultural fest of{" "}
              <span className="font-bold">MIT Bengaluru</span>, is a grand celebration of creativity and talent. 
              It showcases vibrant performances in dance, music, and drama, filling the campus with energy and enthusiasm. 
              Along with various competitions, it offers students a platform to express themselves, interact with peers, and create cherished memories, 
              making it one of the most awaited events of the year.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Trailer;
