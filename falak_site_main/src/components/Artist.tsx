"use client";

import React, { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Artist: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    setWindowWidth(window.innerWidth);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = document.querySelector(".artist-section") as HTMLElement;
      const overlay = document.querySelector(".full-overlay") as HTMLElement;
  
      if (!section || !overlay) return;
  
      if (isMobile) {
        // Pin for just the height of overlay content + small buffer
        const pinHeight = overlay.scrollHeight + 40; // 40px bottom padding
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `${pinHeight}px top`,
            scrub: true,
            pin: true,
          },
        });
  
        tl.fromTo(
          ".tv-wrapper",
          { scale: 0.6, rotateY: 40, rotateX: 10 },
          { scale: 1, rotateY: 0, rotateX: 0, ease: "power2.inOut" }
        );
  
        tl.fromTo(
          ".full-overlay",
          { scale: 0.6, opacity: 1 },
          { scale: 1, opacity: 1, ease: "power2.inOut" },
          0
        );
  
        tl.fromTo(
          ".artist-description",
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.3"
        );
      } else {
        // Desktop: keep original pinned layout
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "120% top",
            scrub: true,
            pin: true,
          },
        });
  
        tl.fromTo(
          ".tv-wrapper",
          {
            scale: 0.6,
            rotateY: 40,
            rotateX: 10,
            xPercent: -50,
            yPercent: -50,
            top: "50%",
            left: "50%",
            position: "absolute",
            zIndex: 30,
          },
          {
            scale: 1,
            rotateY: 0,
            rotateX: 0,
            xPercent: -120,
            yPercent: -50,
            top: "50%",
            left: "50%",
            ease: "power2.inOut",
          }
        );
  
        tl.fromTo(
          ".full-overlay",
          { scale: 0.6, opacity: 1 },
          { scale: 1, opacity: 1, ease: "power2.inOut" },
          0
        );
  
        tl.fromTo(
          ".artist-description",
          { autoAlpha: 0, x: 100 },
          { autoAlpha: 1, x: 0, duration: 0.8, ease: "power2.out" },
          "-=0.3"
        );
      }
    });
  
    return () => ctx.revert();
  }, [isMobile]);
  


  return (
    <section
    className={`artist-section relative w-full bg-transparent ${
      isMobile
        ? "flex flex-col items-center justify-start pt-6" // remove min-h-screen
        : "min-h-screen flex flex-col items-center justify-center md:block"
    }`}
    style={{ perspective: "1500px" }}
  >
    <div
      className={`full-overlay z-20 pointer-events-none rounded-2xl border border-[#DBAAA6] flex flex-col items-center justify-start p-4 sm:p-6
        ${isMobile ? "relative top-auto bottom-auto pb-6 w-full max-w-[90vw] mx-auto" : "absolute top-[13%] left-[6%] right-[6%] bottom-[10%]"}`
      }
    >
  {/* Heading (only on mobile) */}
  {isMobile && (
    <h2 className="vintage-font text-center text-3xl sm:text-4xl text-[#DBAAA6] mb-6">
      MEET THE ARTISTS
    </h2>
  )}

  {/* TV + Description Container inside overlay for proper mobile spacing */}
  {isMobile && (
    <div className="flex flex-col items-center justify-start w-full gap-6 mt-4">
      {/* TV */}
      <div className="tv-wrapper border-4 border-[#D7897D] rounded-2xl bg-[#32212C] shadow-lg z-30">
  <img
    src="/images/mohit.webp"
    alt="Artist Mohit"
    className="block max-w-full h-auto object-contain rounded-xl"
  />
</div>



      {/* Description */}
      <div className="artist-description z-40 bg-[#DBAAA6] border-2 border-[#32212C] rounded-xl flex flex-col justify-center items-center p-4 sm:p-6 text-center w-[85vw] max-w-[500px]">
        <h3 className="vintage-font text-xl sm:text-2xl font-semibold text-[#32212C] mb-2 sm:mb-4">
        MOHIT CHAUHAN
        </h3>
        <p className="abhaya-font text-sm sm:text-base leading-relaxed text-[#32212C]">
        Prepare to be swept away by the timeless voice of <strong>Mohit Chauhan</strong>—where soulful melodies meet poetic lyricism, creating a sound that resonates deep within. 
  Known for his iconic tracks like <strong>Masakali</strong> and <strong>Tum Se Hi</strong>, Mohit has captivated hearts across generations with his gentle yet powerful vocals. 
  Whether it&rsquo;s his subtle ballads or his unforgettable anthems, Mohit&rsquo;s music transcends boundaries and connects with the very soul. 
  Get ready for an evening of emotion, melody, and magic as he brings FALAK&#39;25  alive with his signature style!
        </p>
      </div>
    </div>
  )}
</div>


  {/* Heading (desktop/tablet stays outside) */}
  {!isMobile && (
    <h2
      className="vintage-font text-center px-4 text-3xl sm:text-4xl md:text-5xl text-[#DBAAA6] z-50"
      style={{
        marginTop:
          windowWidth >= 768 && windowWidth < 1024
            ? "2.5rem"
            : windowWidth < 768
            ? "2rem"
            : "4rem",
      }}
    >
      MEET THE ARTISTS
    </h2>
  )}

  {/* TV + Description Container (desktop) */}
  {!isMobile && (
    <div className="flex w-full max-w-[600px] mx-auto gap-6 flex-col items-center md:block mt-8">
      {/* TV */}
      <div className="tv-wrapper border-4 border-[#D7897D] rounded-2xl bg-[#32212C] shadow-lg z-30 mx-auto md:relative md:right-[10%] mb-3 md:mb-0 w-[45%] max-w-[500px] h-[55vh] flex justify-center items-center overflow-hidden">
  <img
    src="/images/mohit.webp"
    alt="Artist Mohit"
    className="block w-full h-full object-cover rounded-xl"
  />
</div>


      {/* Description */}
      <div className="artist-description z-40 bg-[#DBAAA6] border-2 border-[#32212C] rounded-xl flex flex-col justify-center items-center p-4 sm:p-6 text-center opacity-0 absolute md:top-1/2 md:right-[12%] md:-translate-y-1/2 w-[40%] max-w-[500px] h-[55vh]">
        <h3 className="vintage-font text-xl sm:text-2xl md:text-3xl font-semibold text-[#32212C] mb-2 sm:mb-4">
        MOHIT CHAUHAN
        </h3>
        <p className="abhaya-font text-sm sm:text-base md:text-lg leading-relaxed text-[#32212C]"> 
  Prepare to be swept away by the timeless voice of <strong>Mohit Chauhan</strong>—where soulful melodies meet poetic lyricism, creating a sound that resonates deep within. 
  Known for his iconic tracks like <strong>Masakali</strong> and <strong>Tum Se Hi</strong>, Mohit has captivated hearts across generations with his gentle yet powerful vocals. 
  Whether it&rsquo;s his subtle ballads or his unforgettable anthems, Mohit&rsquo;s music transcends boundaries and connects with the very soul. 
  Get ready for an evening of emotion, melody, and magic as he brings FALAK&#39;25 alive with his signature style!
</p>

      </div>
    </div>
  )}
</section>


  );
};

export default Artist;
