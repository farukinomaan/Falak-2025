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
    <div className="w-full bg-[#f2eae1] py-16 flex justify-center">
      {/* Retro arcade box */}
      <div className="relative max-w-[900px] w-full mx-auto px-8 py-10 bg-[#7a1f1f] text-[#f2eae1] border-8 border-[#7a1f1f] shadow-[0_0_25px_#7a1f1f] rounded-lg">
        {/* Outer glow layers */}
        <div className="absolute -inset-2 border-4 border-[#f2eae1] rounded-lg pointer-events-none"></div>
        <div className="absolute -inset-4 border-4 border-[#7a1f1f] rounded-lg pointer-events-none opacity-50"></div>

        {/* CRT scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none mix-blend-overlay"></div>

        <div className="relative z-10">
          <h2 className="retro-heading text-3xl md:text-4xl text-center mb-10 text-[#f2eae1]">
            FALAK '25 TIMELINE
          </h2>

          {/* Progress Bar */}
          <div className="relative w-full mb-10">
            <div className="absolute left-0 -top-6 text-[#f2eae1] font-mono text-sm animate-pulse">
              ▶ Fest Progress...
            </div>

            <div className="relative h-6 w-full bg-[#2a2a2a] rounded-sm overflow-hidden border-2 border-[#f2eae1] shadow-inner">
              <div
                className="absolute h-6 bg-gradient-to-r from-[#7a1f1f] via-[#a83232] to-[#7a1f1f] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-0 w-3 h-6 bg-[#f2eae1] animate-bounce"
                style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
              />
            </div>

            <div className="absolute right-0 -top-6 text-[#f2eae1] font-mono text-xs tracking-wider">
              {Math.round(progress)}% Complete
            </div>
          </div>

          {/* Events */}
          <div className="space-y-4 text-center">
            {previousEvent && (
              <p className="font-mono text-[#d9b08c] text-lg border-2 border-dashed border-[#f2eae1] rounded p-2 bg-[#2a2a2a]">
                Previous: {previousEvent.name} at {formatTime(previousEvent.time)}
              </p>
            )}
            {currentEvent && (
              <p className="font-mono text-[#1a1a1a] text-xl border-2 border-[#1a1a1a] rounded p-3 bg-[#f2eae1] font-bold">
                ► Current: {currentEvent.name} at {formatTime(currentEvent.time)}
              </p>
            )}
            {upcomingEvent && (
              <p className="font-mono text-[#d9b08c] text-lg border-2 border-dashed border-[#f2eae1] rounded p-2 bg-[#2a2a2a]">
                Upcoming: {upcomingEvent.name} at {formatTime(upcomingEvent.time)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
