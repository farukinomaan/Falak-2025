"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";

const sponsors = [
  {
    name: "Unstop",
    logo: "/sponsors/unstop.png",
    url: "https://unstop.com/",
  },
  {
    name: "Findoc",
    logo: "/sponsors/findoc.png",
    url: "https://findoc.com/",
  },
  {
    name: "InterviewBuddy",
    logo: "/sponsors/inbuddy.png",
    url: "https://interviewbuddy.com/",
  },
  {
    name: "Finlatics",
    logo: "/sponsors/finlatics.png",
    url: "https://finlatics.com/",
  },
  {
    name: "Lapcare",
    logo: "/sponsors/Lapcare.png",
    url: "https://lapcare.com/",
  },
  {
    name: "RealMe",
    logo: "/sponsors/RealMe.png",
    url: "https://realme.com/",
  },
];

const Sponsor: React.FC = () => {
  const [repeatCount, setRepeatCount] = useState(2); // at least 2 for seamless loop

  useEffect(() => {
    const handleResize = () => {
      setRepeatCount(window.innerWidth < 768 ? 2 : 4); 
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section className="w-full bg-[#DBAAA6] py-16 overflow-hidden border-t-4 border-[#D7897D]">
      <div className="max-w-[1100px] mx-auto text-center mb-10 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-[#32212C] vintage-font tracking-wide">
          Our Sponsors
        </h2>
      </div>

      {/* Marquee wrapper */}
      <div className="relative w-full overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {Array(repeatCount)
            .fill(null)
            .flatMap(() => sponsors)
            .map((sponsor, index) => (
              <a
                key={index}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-[150px] sm:w-[200px] md:w-[250px] mx-4 sm:mx-6 md:mx-8 hover:scale-105 transition duration-300"
              >
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  width={200}
                  height={100}
                  className="object-contain max-h-12 sm:max-h-16 md:max-h-20"
                />
              </a>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Sponsor;
