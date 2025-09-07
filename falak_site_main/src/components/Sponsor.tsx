"use client";

import Image from "next/image";
import React from "react";

const sponsors = [
  {
    name: "Unstop",
    logo: "/sponsors/unstop.png",
    url: "https://unstop.com/",
  },
  // add more later
];

const Sponsor: React.FC = () => {
  return (
    <section className="w-full bg-[#32212C]/90 py-16 overflow-hidden border-t-4 border-[#DBAAA6]">
      <div className="max-w-[1100px] mx-auto text-center mb-10 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-[#DBAAA6] vintage-font tracking-wide">
          Our Sponsors
        </h2>
      </div>

      {/* Marquee wrapper */}
      <div className="relative w-full overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee min-w-full">
          {Array(3) // duplicate to fill width
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
