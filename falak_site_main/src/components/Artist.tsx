"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/all";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, SplitText);

const Artist: React.FC = () => {
  useEffect(() => {
    const firstMsgSplit = SplitText.create(".first-message", { type: "words" });
    const secMsgSplit = SplitText.create(".second-message", { type: "words" });

    gsap.to(firstMsgSplit.words, {
      color: "#faeade",
      ease: "power1.in",
      stagger: 1,
      scrollTrigger: {
        trigger: ".message-content",
        start: "top center",
        end: "30% center",
        scrub: true,
      },
    });

    gsap.to(secMsgSplit.words, {
      color: "#faeade",
      ease: "power1.in",
      stagger: 1,
      scrollTrigger: {
        trigger: ".second-message",
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
    });

    // TV reveal animation
    gsap.fromTo(
      ".artist-overlay",
      {
        clipPath: "inset(0% 0% 0% 0%)", 
      },
      {
        clipPath: "inset(50% 0% 50% 0%)", 
        duration: 2,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: ".message-content",
          start: "top center",
          toggleActions: "play none none none",
          once: true,
        },
      }
    );
    
  }, []);

  return (
    <section
      className="message-content relative w-full min-h-screen overflow-hidden"
      style={{ backgroundColor: "#f2eae1" }}
    >
      {/* Left Film Reel */}
      <img
        src="/images/s22.png"
        alt="Film Reel Left"
        className="hidden md:block absolute inset-y-0 left-310 h-full object-cover z-0"
      />

      {/* Right Film Reel */}
      <img
        src="/images/s11.png"
        alt="Film Reel Right"
        className="hidden md:block absolute inset-y-0 right-310 h-full object-cover z-0"
      />

      <div
        className="container mx-auto flex flex-col items-center py-0 relative z-10"
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        {/* Title */}
        <div className="msg-wrapper text-center space-y-8">
          <img
            src="/images/art.png"
            alt="Meet the Artist"
            className="mx-auto w-auto max-w-full h-16 md:h-24 object-contain"
          />
        </div>

        {/* Frame + Artist */}
        <div className="relative flex justify-center items-center w-full mt-6">
          <div className="message-content-box relative max-w-3xl w-full shadow-lg z-10">
            {/* Frame */}
            <img
              src="/images/frame.png"
              alt="TV Frame"
              className="w-full h-auto object-contain relative z-20"
            />

            {/* Artist inside frame */}
            <div className="absolute inset-0 flex justify-center items-center z-10 overflow-hidden">
              <div className="relative w-[85%] h-auto flex justify-center items-center">
                <img
                  src="/images/artist.png"
                  alt="Artist"
                  className="tv-screen w-full h-auto object-contain"
                />
                {/* Overlay that reveals */}
                <div className="artist-overlay absolute inset-0 bg-black z-30"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Paper Torn Description */}
        <div className="mt-0 max-w-2xl w-full text-center">
          <img
            src="/images/des.png"
            alt="Artist Description"
            className="mx-auto w-full h-[250px] object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default Artist;
