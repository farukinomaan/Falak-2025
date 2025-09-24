"use client";

import React, { useEffect, useState } from "react";

const events = [
  { date: "2025-10-06", time: "09:00", name: "Opening Ceremony" },
  { date: "2025-10-06", time: "11:00", name: "Music Battle" },
  { date: "2025-10-06", time: "14:00", name: "Retro Gaming" },
  { date: "2025-10-06", time: "16:00", name: "Photography Contest" },
  { date: "2025-10-07", time: "10:00", name: "Dance Competition" },
  { date: "2025-10-07", time: "12:00", name: "Quiz Contest" },
  { date: "2025-10-07", time: "15:00", name: "Art Challenge" },
  { date: "2025-10-07", time: "17:00", name: "Film Screening" },
  { date: "2025-10-08", time: "09:30", name: "Drama Performance" },
  { date: "2025-10-08", time: "11:30", name: "Art Workshop" },
  { date: "2025-10-08", time: "14:00", name: "Cooking Demo" },
  { date: "2025-10-08", time: "16:00", name: "Music Jam" },
  { date: "2025-10-09", time: "10:00", name: "Tech Talk" },
  { date: "2025-10-09", time: "12:00", name: "Coding Challenge" },
  { date: "2025-10-09", time: "15:00", name: "Robotics Demo" },
  { date: "2025-10-09", time: "17:00", name: "Gaming Tournament" },
  { date: "2025-10-10", time: "09:00", name: "Singing Competition" },
  { date: "2025-10-10", time: "11:00", name: "Food Fest" },
  { date: "2025-10-10", time: "13:00", name: "Craft Workshop" },
  { date: "2025-10-10", time: "15:00", name: "Standup Comedy" },
  { date: "2025-10-11", time: "10:00", name: "Fashion Show" },
  { date: "2025-10-11", time: "12:00", name: "Treasure Hunt" },
  { date: "2025-10-11", time: "14:00", name: "Dance Battle" },
  { date: "2025-10-12", time: "10:00", name: "Prize Distribution" },
  { date: "2025-10-12", time: "12:00", name: "Closing Ceremony" },
  { date: "2025-10-12", time: "15:00", name: "Farewell Party" },
];

const startDate = new Date("2025-10-06T00:00");
const endDate = new Date("2025-10-12T23:59");

const formatTime = (time24: string) => {
  const [hourStr, min] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${min} ${ampm}`;
};

const Timeline: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [progress, setProgress] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDate(now);

      const totalTime = endDate.getTime() - startDate.getTime();
      const elapsed = Math.min(Math.max(now.getTime() - startDate.getTime(), 0), totalTime);
      setProgress((elapsed / totalTime) * 100);

      const index = events.findIndex((e, i) => {
        const eventTime = new Date(`${e.date}T${e.time}`);
        const nextEventTime =
          i < events.length - 1 ? new Date(`${events[i + 1].date}T${events[i + 1].time}`) : endDate;
        return now >= eventTime && now < nextEventTime;
      });

      if (index >= 0) {
        setCurrentEventIndex(index);
      } else if (now < new Date(`${events[0].date}T${events[0].time}`)) {
        setCurrentEventIndex(0);
      } else {
        setCurrentEventIndex(events.length - 1);
      }
    }, 1000 * 60);

    return () => clearInterval(interval);
  }, []);

  const previousEvent = events[currentEventIndex - 1] || null;
  const currentEvent = events[currentEventIndex] || null;
  const upcomingEvent = events[currentEventIndex + 1] || null;

  return (
    <div className="w-full bg-transparent py-10 sm:py-16 flex justify-center px-4">
      {/* Retro arcade box */}
      <div className="relative w-full max-w-[900px] mx-auto px-4 sm:px-8 py-8 sm:py-10 bg-[#32212C] text-[#DBAAA6] border-4 sm:border-8 rounded-lg">
        {/* Outer glow layers */}
        <div className="absolute -inset-1 sm:-inset-2 border-2 sm:border-4 border-[#32212C] rounded-lg pointer-events-none"></div>
        <div className="absolute -inset-2 sm:-inset-4 border-2 sm:border-4 border-[#D7897D] rounded-lg pointer-events-none opacity-50"></div>

        {/* CRT scanline effect */}
        <div
          className="full-overlay absolute inset-0 z-20 pointer-events-none rounded-2xl"
          style={{
            boxShadow: "0 0 4px 1px rgba(255, 182, 193, 0.1)",
            border: "2px solid rgba(255, 182, 193, 0.2)",
          }}
        ></div>

        <div className="relative z-10">
          <h2 className="vintage-font text-2xl sm:text-3xl md:text-4xl text-center mb-6 sm:mb-10">
            FALAK &#39;25 TIMELINE
          </h2>

          {/* Progress Bar */}
          <div className="relative w-full mb-6 sm:mb-10">
            <div className="absolute left-0 -top-5 sm:-top-6 text-[#DBAAA6] font-mono text-xs sm:text-sm animate-pulse">
              ▶ Fest Progress...
            </div>

            <div className="relative h-5 sm:h-6 w-full bg-[#1f1a2e]/80 rounded-sm overflow-hidden border-2 border-[#DBAAA6] shadow-inner">
              <div
                className="absolute h-5 sm:h-6 bg-gradient-to-r from-[#a855f7] via-[#d946ef] to-[#a855f7] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-0 w-2.5 sm:w-3 h-5 sm:h-6 bg-[#DBAAA6] animate-bounce"
                style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
              />
            </div>

            <div className="absolute right-0 -top-5 sm:-top-6 text-[#DBAAA6] font-mono text-[10px] sm:text-xs tracking-wider">
              {Math.round(progress)}% Complete
            </div>
          </div>

          {/* Events */}
          <div className="space-y-3 sm:space-y-4 text-center">
            {currentDate < new Date(`${events[0].date}T${events[0].time}`) ? (
              <>
                {/* Before fest starts */}
                <p className="font-mono text-base sm:text-lg border-2 border-dashed border-[#DBAAA6] rounded p-1 sm:p-2 bg-[#1f1a2e]/80">
                  Previous: Countdown to the Artist Reveal
                </p>
                <p className="text-[#32212C] font-mono text-lg sm:text-xl border-2 border-[#2e1a47] rounded p-2 sm:p-3 bg-[#DBAAA6] font-bold">
                  ► Current: Waiting for FALAK&#39;25...
                </p>
                
              </>
            ) : currentDate > endDate ? (
              <>
                {/* After fest ends */}
                <p className="text-[#32212C] font-mono text-lg sm:text-xl border-2 border-[#2e1a47] rounded p-2 sm:p-3 bg-[#DBAAA6] font-bold">
                  ► Current: FALAK&#39;25 has ended. Thanks for joining!
                </p>
              </>
            ) : (
              <>
                {/* During fest */}
                {previousEvent && (
                  <p className="font-mono text-base sm:text-lg border-2 border-dashed border-[#DBAAA6] rounded p-1 sm:p-2 bg-[#1f1a2e]/80">
                    Previous: {previousEvent.name} at {formatTime(previousEvent.time)}
                  </p>
                )}
                {currentEvent && (
                  <p className="text-[#32212C] font-mono text-lg sm:text-xl border-2 border-[#2e1a47] rounded p-2 sm:p-3 bg-[#DBAAA6] font-bold">
                    ► Current: {currentEvent.name} at {formatTime(currentEvent.time)}
                  </p>
                )}
                {upcomingEvent && (
                  <p className="font-mono text-base sm:text-lg border-2 border-dashed border-[#DBAAA6] rounded p-1 sm:p-2 bg-[#1f1a2e]/80">
                    Upcoming: {upcomingEvent.name} at {formatTime(upcomingEvent.time)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
