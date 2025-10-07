"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";

const sponsors = [
  { name: "RealMe", partnership: "Pronite Sponsor", logo: "/sponsors/RealMe.png", url: "https://realme.com/" },
  { name: "LapCare", partnership: "Event Partner", logo: "/sponsors/Lapcare.png", url: "https://lapcare.com/" },
  { name: "Findoc", partnership: "Trading Partner", logo: "/sponsors/findoc.png", url: "https://findoc.com/" },
  { name: "Mahindra", partnership: "Mobility Partner", logo: "/sponsors/Mahindra.png", url: "https://www.mahindra.com/" },
  { name: "JioSaavn", partnership: "Music Streaming Partner", logo: "/sponsors/Jiosaavn.png", url: "https://www.jiosaavn.com/" },
  { name: "Spinner", partnership: "Beverage Partner", logo: "/sponsors/spinner.png", url: "https://www.instagram.com/spinnersportsdrink/?hl=en" },
  { name: "Finlatics", partnership: "Learning Partner", logo: "/sponsors/finlatics.png", url: "https://finlatics.com/" },
  { name: "Tradejini", partnership: "Investment Partner", logo: "/sponsors/Tradejini.png", url: "https://www.tradejini.com" },
  { name: "Plum Body Lovin'", partnership: "Bath & Body Partner", logo: "/sponsors/plum.png", url: "https://plumgoodness.com" },
  { name: "Ink Insights Thoughts", partnership: "Creative Gifting Partner", logo: "/sponsors/ink.png", url: "https://ink-insights-thoughts.in" },
  { name: "Interview Buddy", partnership: "Mock Interview Partner", logo: "/sponsors/inbuddy.png", url: "https://interviewbuddy.com/" },
  { name: "Manipal", partnership: "Health Partner", logo: "/sponsors/manipal.png", url: "https://www.manipalhospitals.com/bangalore/" },
  { name: "Unstop", partnership: "Opportunity Partner", logo: "/sponsors/unstop.png", url: "https://unstop.com/" },
  { name: "DS Group", partnership: "Taste Partner", logo: "/sponsors/ds.png", url: "https://www.dsgroup.com" },
  { name: "Bisleri", partnership: "Hydrating Partner", logo: "/sponsors/bisleri.png", url: "https://bisleri.com" },
];

const Sponsor: React.FC = () => {
  const [repeatCount, setRepeatCount] = useState(2); // for seamless loop

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
      className="flex flex-col items-center justify-center w-[150px] sm:w-[200px] md:w-[250px] mx-4 sm:mx-6 md:mx-8 hover:scale-105 transition duration-300"
    >
      <div className="w-full h-24 flex items-center justify-center mb-2">
        <Image
          src={sponsor.logo}
          alt={sponsor.name}
          width={200}
          height={100}
          className={`object-contain max-h-16 sm:max-h-20 md:max-h-24 ${
            sponsor.name === "JioSaavn" || sponsor.name === "Manipal"? "scale-150" : ""
          }`}
        />
      </div>
      <p className="text-base sm:text-lg md:text-lg text-[#32212C] font-[abhaya-font] text-center">
        {sponsor.partnership}
      </p>
    </a>
  ))}

        </div>
      </div>
    </section>
  );
};

export default Sponsor;
