"use client";
import React, { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string;
  className?: string;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, className }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    return {
      days: Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((difference / (1000 * 60 * 60)) % 24)),
      minutes: Math.max(0, Math.floor((difference / (1000 * 60)) % 60)),
      seconds: Math.max(0, Math.floor((difference / 1000) % 60)),
    };
  };

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const outerBox = `
    inline-flex 
    border border-[#DBAAA6]/60 bg-[#D7897D]/70
    rounded-md sm:rounded-lg
    overflow-hidden
    ${className ?? "text-white"}
  `;

  const segment = `
    flex flex-col items-center justify-center
    px-3 py-2 xs:px-4 xs:py-2.5 sm:px-6 sm:py-3
    min-w-[50px] sm:min-w-[70px]
  `;

  const numberClasses = `
    text-base xs:text-lg sm:text-2xl md:text-3xl font-bold
  `;

  const labelClasses = `
    text-[8px] xs:text-[10px] sm:text-xs md:text-sm uppercase text-white
  `;

  const renderSegment = (unit: string, value: number | string) => (
    <div key={unit} className={segment}>
      <span className={numberClasses}>{value}</span>
      <span className={labelClasses}>{unit}</span>
    </div>
  );

  const data = mounted
    ? [
        renderSegment("days", timeLeft.days),
        renderSegment("hours", timeLeft.hours),
        renderSegment("minutes", timeLeft.minutes),
        renderSegment("seconds", timeLeft.seconds),
      ]
    : [
        renderSegment("days", "--"),
        renderSegment("hours", "--"),
        renderSegment("minutes", "--"),
        renderSegment("seconds", "--"),
      ];

  return (
    <div className={outerBox}>
      {data.map((segmentEl, i) => (
        <React.Fragment key={i}>
          {segmentEl}
          {i < data.length - 1 && (
            <div className="w-px bg-[#DBAAA6]/40 self-stretch" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const Timer: React.FC = () => {
  return (
    <section
      className="
        w-full bg-[#32212C]/90
        py-4 xs:py-5 sm:py-8 md:py-12
        text-center
        space-y-6 xs:space-y-7 sm:space-y-10 md:space-y-16
        border-t border-[#DBAAA6]
      "
    >
      {/* First Timer */}
      <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 md:space-y-4">
        <h2
          className="
            text-sm xs:text-base sm:text-lg md:text-3xl
            font-semibold text-[#DBAAA6] text-outline
          "
        >
          Artist Reveal at 8:30 PM • 23rd September
        </h2>
        <Countdown targetDate="2025-09-23T21:30:00+05:30" />
      </div>

      {/* Second Timer
      <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 md:space-y-4">
        <h2
          className="
            text-sm xs:text-base sm:text-lg md:text-3xl
            font-semibold text-[#DBAAA6]
          "
        >
          Pass Prices Increase at 4:00 PM • 23rd September
        </h2>
        <p
          className="
            text-[#DBAAA6]
            text-[8px] xs:text-xs sm:text-sm md:text-base
            mx-auto
            whitespace-nowrap md:whitespace-normal
          "
        >
          This is your last chance to grab your passes at the lowest price!
        </p>
        <Countdown targetDate="2025-09-23T16:00:00+05:30" />
      </div> */}
    </section>
  );
};

export default Timer;
