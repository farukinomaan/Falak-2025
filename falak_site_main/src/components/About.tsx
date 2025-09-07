"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const lines = ["own it.", "play it.", "win it."];
  const animatedLetters = [
    ["w", "i", "t"],      // Line 1
    ["p", "e", "a", "t"], // Line 2
    ["w", "i", "t"],      // Line 3
  ];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
  
    // Clear container before building
    container.innerHTML = "";
  
    // Build letters
    lines.forEach((line, lineIndex) => {
      const lineWrapper = document.createElement("div");
      lineWrapper.className =
        "flex justify-center gap-1 font-extrabold text-[clamp(2rem,5vw,3.5rem)] sm:text-[clamp(2.5rem,6vw,4rem)] md:text-[clamp(3rem,7vw,4.5rem)]";
  
      line.split("").forEach((char) => {
        const outer = document.createElement("span");
        outer.className = "inline-block relative overflow-hidden leading-none min-w-[0.25ch]";
        outer.style.height = "1.25em";
        outer.style.lineHeight = "1.25em";
        outer.style.clipPath = "inset(0 0 0 0)";
        outer.style.verticalAlign = "middle";
  
        const inner = document.createElement("span");
        inner.className = "block will-change-transform";
  
        const shouldAnimate = animatedLetters[lineIndex].includes(char.toLowerCase());
        if (shouldAnimate && char.trim() !== "") {
          const frames = 3 + Math.floor(Math.random() * 3);
          for (let i = 0; i < frames; i++) {
            const s = document.createElement("span");
            s.className = "block";
            s.textContent = char;
            inner.appendChild(s);
          }
        }
  
        const target = document.createElement("span");
        target.className = "block";
        target.textContent = char;
        inner.appendChild(target);
  
        outer.appendChild(inner);
        lineWrapper.appendChild(outer);
      });
  
      container.appendChild(lineWrapper);
    });
  
    // GSAP animation
    const reels = Array.from(container.querySelectorAll<HTMLSpanElement>("span > span"));
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        toggleActions: "restart none none none",
      },
    });
  
    reels.forEach((inner) => {
      const outer = inner.parentElement as HTMLElement;
      const frameH = outer.offsetHeight || 0;
      const totalFrames = inner.childElementCount;
      const distance = -frameH * (totalFrames - 1);
  
      if (totalFrames > 1) {
        timeline.to(
          inner,
          {
            y: distance,
            duration: 0.6 + Math.random() * 0.4,
            ease: "back.out(1.4)",
          },
          Math.random() * 0.3
        );
      }
    });
  
    gsap.from([subtitleRef.current, textRef.current], {
      y: 50,
      opacity: 0,
      scale: 0.95,
      duration: 1.6,
      ease: "power4.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 75%",
        once: true,
      },
    });
  }, []);
  
  

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-16 sm:py-20 text-center text-[#DBAAA6] border-t border-b border-[#DBAAA6]"
    >
      <div className="absolute inset-0 bg-transparent"></div>
      <div className="absolute inset-0 bg-[#32212C] opacity-90 backdrop-blur-sm"></div>

      <div className="relative z-10 flex flex-col items-center justify-center max-w-5xl w-full">
        <div ref={containerRef} id="title" className="space-y-2 mb-6 sm:mb-8 md:mb-10"></div>

        <p
          ref={subtitleRef}
          className="vintage-font text-base sm:text-lg md:text-xl font-light text-[#D7897D] mb-6 sm:mb-8 md:mb-10"
        >
          <span className="font-bold">FALAK'25</span> - The Ultimate Sports & Cultural Fest of Our College
        </p>

        <div
          ref={textRef}
          className="abhaya-font max-w-4xl text-[#DBAAA6] leading-relaxed text-lg sm:text-xl md:text-2xl"
        >
          <p>
            Falak 2025 is where passion meets performance! Join us for a thrilling
            celebration of talent, sportsmanship, and creativity. From heart-pounding
            competitions to breathtaking cultural showcases, Falak is more than a
            fest – it’s a movement. 
          </p>
          <p className="mt-4">
            Get ready to witness electrifying events, jaw-dropping performances, and
            unforgettable memories. This is your stage, your moment, your Falak!
          </p>
        </div>
      </div>
    </section>
  );
}
