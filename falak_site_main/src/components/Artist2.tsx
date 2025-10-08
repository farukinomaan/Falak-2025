"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";

const Artist2 = () => {
  const ref = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: isMobile ? ["start end", "center start"] : ["start 0.01", "end 0.99"],
  });

  const textY = useTransform(
    scrollYProgress,
    isMobile ? [1, 0] : [0, 1],
    isMobile ? ["250%", "-250%"] : ["170%", "-170%"]
  );
  const springTextY = useSpring(textY, { stiffness: 200, damping: 90 });

  return (
    <section
      ref={ref}
      className="relative bg-transparent flex flex-col justify-center items-center"
    >
      <div className="sticky top-0 flex flex-col items-center justify-center gap-8 py-10 w-full">
        {/* Outer Box (DBAAA6) */}
        <div
  className="
    bg-[#DBAAA6] 
    border-[2px] border-[#32212C]          
    md:border-[15px] md:outline-[2px] md:outline-[#DBAAA6] 
    rounded-2xl shadow-xl
                p-6 md:p-8 flex flex-col md:flex-row items-center justify-center
                gap-6 md:gap-[6.75rem] w-[90%] md:w-[95%] max-w-[1100px] md:max-w-[1300px]
                md:h-[560px]">

          
          {/* Left: Image */}
          <div className="relative w-[82vw] md:w-[42%] h-[40vh] md:h-[54vh] flex justify-center items-center overflow-hidden rounded-2xl border-[3px] border-[#32212C]">
            <Image
              src="/images/pranav.webp"
              alt="Pranav Sharma"
              width={500} // slightly smaller
              height={600} 
              className="object-cover rounded-2xl shadow-lg w-full h-[50vh] md:h-[55vh] border-2px border-[#32212C]"
            />

            {/* <motion.h1
              style={{
                y: springTextY,
                WebkitTextStroke: "2px #32212C",
              }}
              className="absolute text-5xl md:text-7xl font-extrabold text-white tracking-tight pointer-events-none select-none leading-tight text-center"
            >
              PRANAV
              <br />
              SHARMA
            </motion.h1> */}
          </div>

          {/* Right: Description */}
          <div className="w-[85vw] md:w-[40%] flex justify-center items-center">
  <div className="text-[#32212C] text-center">
    <h2 className="text-3xl vintage-font font-bold mb-4">PRANAV SHARMA</h2>
    <p className="abhaya-font text-sm sm:text-base leading-relaxed">
      Pranav Sharma is a sharp-witted comedian whose humor blends quick
      observations, social commentary, and pure relatability. His
      performances mix intelligent satire with real-life absurdities,
      leaving audiences laughing and thinking in equal measure. With his
      signature charm and relatable stage presence, Pranav has quickly
      become one of India’s most engaging voices in the comedy scene.
    </p>
  </div>
</div>


        </div>
      </div>
    </section>
  );
};

export default Artist2;
