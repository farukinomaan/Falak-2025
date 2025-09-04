"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Trailer: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      const ctx = gsap.context(() => {
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
  
        gsap.from(videoRef.current, {
          scrollTrigger: {
            trigger: videoRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          x: -80,
          duration: 1,
          ease: "power3.out",
        });
  
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
    <section ref={sectionRef} className="w-full bg-[#f2eae1] py-16 px-4">
      <div className="max-w-[1100px] mx-auto">
        <h2
          ref={headingRef}
          className="text-4xl font-bold text-[#8b3e2f] mb-12 font-serif tracking-wide text-center"
        >
          FALAK 2025 Trailer
        </h2>

        {/* Side-by-side flex */}
        <div className="flex flex-col md:flex-row md:items-stretch md:space-x-8">
  {/* Video */}
  <div
    ref={videoRef}
    className="w-full md:w-1/2 flex items-stretch"
  >
    <iframe
      className="w-full h-full rounded-lg shadow-lg border-4 border-[#8b3e2f]"
      src="https://www.youtube.com/embed/IYjSzDsYhgA"
      title="FALAK 2025 Trailer"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  </div>

  {/* Description */}
  <div
    ref={descRef}
    className="w-full md:w-1/2 bg-[#f2d9b3] p-6 rounded-lg border-4 border-[#8b3e2f] shadow-lg text-[#3e2f2f] font-serif text-lg flex items-center"
  >
    <p>
      Tech Solstice is the annual technical fest of{" "}
      <span className="font-bold">Manipal Institute of Technology, Bangalore</span>, 
      uniting innovation, creativity, and cutting-edge technology. Featuring an 
      exciting lineup of hackathons, competitions, robotics challenges, workshops, 
      and speaker sessions, it provides a dynamic platform for students to showcase 
      their skills, collaborate, and explore emerging tech trends. Get ready for an 
      immersive experience of learning, competing, and networking at Tech Solstice!
    </p>
  </div>
</div>
      </div>
    </section>
  );
};

export default Trailer;
