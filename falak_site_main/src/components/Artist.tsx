"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/all";
import React from "react";

const Artist: React.FC = () => {
  useGSAP(() => {
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

    const revealTl = gsap.timeline({
      delay: 1,
      scrollTrigger: {
        trigger: ".msg-text-scroll",
        start: "top 60%",
      },
    });
    revealTl.to(".msg-text-scroll", {
      duration: 1,
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      ease: "circ.inOut",
    });

    gsap.from(".message-content-box", {
      yPercent: 20,
      opacity: 0,
      scale: 0.95,
      ease: "cubic-bezier(0.05, 0.2, 0.1, 0.9)",
      scrollTrigger: {
        trigger: ".message-content-box",
        start: "top 80%",
        end: "top 50%",
        scrub: true,
      },
    });
  });

  return (
    <section className="message-content relative w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-no-repeat bg-center z-0"
        style={{ backgroundImage: "url('/images/brown2.png')" }}
      ></div>
  
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />
  
      {/* Content */}
      <div
        className="container mx-auto flex flex-col items-center py-28 relative z-20"
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        <div className="msg-wrapper text-center space-y-8">
  <img
    src="/images/art.png"
    alt="Meet the Artist"
    className="mx-auto w-auto max-w-full h-16 md:h-24 object-contain rounded-lg"
  />
</div>

  
        {/* Image & Content Box */}
        <div className="mt-16 flex justify-center w-full">
          <div className="message-content-box max-w-2xl w-full bg-gray-200 rounded-xl shadow-lg overflow-hidden border-4 border-white">
            
            {/* Image */}
            <img
              src="/images/artist.png"
              alt="Artist"
              className="w-full h-auto object-cover"
            />
            
            {/* Text Content */}
            <div className="p-6 text-center bg-[#3d2922] text-white">
              <h2 className="text-2xl font-bold mb-4">Char Diwari</h2>
              <p className="leading-relaxed">
                Step into the sonic universe of Chaar Diwaari—where jazz, hip-hop,
                and rock collide to create pure magic! The musical alter ego of Garv
                Taneja, he’s the mastermind behind hits like <em>Jhaag</em> and <em>Roshni</em>,
                blending raw emotions with experimental beats. Brace yourself for an
                unforgettable night as he sets Solstice on fire with his electrifying vibe!
              </p>
            </div>
  
          </div>
        </div>
      </div>
    </section>
  );
  
};

export default Artist;
