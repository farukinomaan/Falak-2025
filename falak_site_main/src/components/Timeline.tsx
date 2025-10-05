"use client";

import React, { useEffect, useState } from "react";

const events = [
  // SPORTS EVENTS
  { name: "Cricket", date: "2025-10-05", time: "07:00", endTime: "17:00", venue: "Cricket Ground" },
  { name: "Football", date: "2025-10-05", time: "07:00", endTime: "17:00", venue: "Football Ground" },

  { name: "Football", date: "2025-10-06", time: "08:00", endTime: "17:00", venue: "Football Ground" },
  { name: "Cricket", date: "2025-10-06", time: "07:00", endTime: "17:00", venue: "Cricket Ground" },
  { name: "Volleyball", date: "2025-10-06", time: "08:00", endTime: "17:00", venue: "Volleyball Court" },
  { name: "Badminton", date: "2025-10-06", time: "09:00", endTime: "15:00", venue: "Badminton Courts (Marena)" },
  { name: "Athletics", date: "2025-10-06", time: "17:00", endTime: "19:00", venue: "Synthetic Track" },
  { name: "Inauguration", date: "2025-10-06", time: "12:00", endTime: "14:00", venue: "Main Ground" },

  { name: "Football", date: "2025-10-07", time: "08:00", endTime: "17:00", venue: "Football Ground" },
  { name: "Cricket", date: "2025-10-07", time: "07:00", endTime: "17:00", venue: "Cricket Ground" },
  { name: "Basketball", date: "2025-10-07", time: "08:00", endTime: "17:00", venue: "Basketball Court" },
  { name: "Volleyball", date: "2025-10-07", time: "08:00", endTime: "17:00", venue: "Volleyball Court" },
  { name: "Badminton", date: "2025-10-07", time: "09:00", endTime: "15:00", venue: "Badminton Courts (Marena)" },
  { name: "Table Tennis", date: "2025-10-07", time: "09:00", endTime: "15:00", venue: "Marena" },
  { name: "Chess", date: "2025-10-07", time: "09:00", endTime: "17:00", venue: "VIP Dining Area (Food Court)" },
  { name: "Athletics", date: "2025-10-07", time: "17:00", endTime: "19:00", venue: "Synthetic Track" },
  { name: "Lawn Tennis", date: "2025-10-07", time: "09:00", endTime: "17:00", venue: "Tennis Court" },

  { name: "Football", date: "2025-10-08", time: "08:00", endTime: "17:00", venue: "Football Ground" },
  { name: "Cricket", date: "2025-10-08", time: "07:00", endTime: "17:00", venue: "Cricket Ground" },
  { name: "Basketball", date: "2025-10-08", time: "08:00", endTime: "17:00", venue: "Basketball Court" },
  { name: "Volleyball", date: "2025-10-08", time: "08:00", endTime: "17:00", venue: "Volleyball Court" },
  { name: "Badminton", date: "2025-10-08", time: "09:00", endTime: "15:00", venue: "Badminton Courts (Marena)" },
  { name: "Table Tennis", date: "2025-10-08", time: "09:00", endTime: "15:00", venue: "Marena" },
  { name: "Athletics", date: "2025-10-08", time: "17:00", endTime: "19:00", venue: "Synthetic Track" },
  { name: "Lawn Tennis", date: "2025-10-08", time: "09:00", endTime: "17:00", venue: "Tennis Court" },
  { name: "Chess", date: "2025-10-08", time: "09:00", endTime: "17:00", venue: "VIP Dining Area (Food Court)" },

  { name: "Football (Semifinal)", date: "2025-10-09", time: "08:00", endTime: "17:00", venue: "Football Ground" },
  { name: "Cricket (Semifinal)", date: "2025-10-09", time: "07:00", endTime: "16:00", venue: "Cricket Ground" },
  { name: "Basketball (Semifinal)", date: "2025-10-09", time: "08:00", endTime: "17:00", venue: "Basketball Court" },
  { name: "Badminton (Semifinal)", date: "2025-10-09", time: "09:00", endTime: "15:00", venue: "Badminton Courts (Marena)" },
  { name: "Athletics (Semifinal)", date: "2025-10-09", time: "16:30", endTime: "19:00", venue: "Synthetic Track" },
  { name: "Table Tennis (Semifinal)", date: "2025-10-09", time: "09:00", endTime: "15:00", venue: "Marena" },
  { name: "Volleyball (Semifinal)", date: "2025-10-09", time: "08:00", endTime: "17:00", venue: "Volleyball Court" },
  { name: "Lawn Tennis (Semifinal)", date: "2025-10-09", time: "09:00", endTime: "17:00", venue: "Tennis Court" },

  { name: "Football (Semifinal)", date: "2025-10-10", time: "08:00", endTime: "15:00", venue: "Football Ground" },
  { name: "Cricket (Final)", date: "2025-10-10", time: "07:00", endTime: "12:00", venue: "Cricket Ground" },
  { name: "Basketball (Semifinal)", date: "2025-10-10", time: "08:00", endTime: "17:00", venue: "Basketball Court" },

  // CULTURAL EVENTS 
  { name: "Cultural Inauguration + Movie Screening", date: "2025-10-09", time: "16:00", endTime: "20:30", venue: "Mega Audi" },
  { name: "Ad Designing", date: "2025-10-10", time: "09:00", endTime: "17:00", venue: "Online" },
  { name: "Short Film Making", date: "2025-10-10", time: "09:00", endTime: "17:00", venue: "Online" },
  { name: "Photography", date: "2025-10-10", time: "09:00", endTime: "17:00", venue: "Online" },
  { name: "Treasure Hunt", date: "2025-10-10", time: "16:30", endTime: "19:30", venue: "All around campus" },
  { name: "Valorant", date: "2025-10-11", time: "10:30", endTime: "16:00", venue: "AB4 404, 405, 406" },
  { name: "CODM", date: "2025-10-11", time: "10:30", endTime: "16:00", venue: "AB4 203, 204" },
  { name: "BGMI", date: "2025-10-11", time: "10:30", endTime: "16:00", venue: "AB4 205, 206" },
  { name: "FIFA", date: "2025-10-11", time: "10:30", endTime: "16:00", venue: "In front of AB4 Audi" },
  { name: "Clash Royale", date: "2025-10-11", time: "10:30", endTime: "16:00", venue: "AB4 207, Seminar Hall (208)" },
  { name: "Solo Classical Dance", date: "2025-10-11", time: "13:30", endTime: "15:00", venue: "Mega Audi" },
  { name: "Solo Western Dance", date: "2025-10-11", time: "15:00", endTime: "16:30", venue: "Mega Audi" },
  { name: "Group Classical Dance", date: "2025-10-11", time: "16:30", endTime: "18:00", venue: "Mega Audi" },
  { name: "Group Western Dance", date: "2025-10-11", time: "18:00", endTime: "19:30", venue: "Mega Audi" },
  { name: "General Quiz", date: "2025-10-11", time: "16:30", endTime: "19:00", venue: "AB4 Seminar Hall (208)" },
  { name: "Solo Singing", date: "2025-10-12", time: "09:00", endTime: "11:00", venue: "AB4 Audi" },
  { name: "Battle of Bands", date: "2025-10-12", time: "09:00", endTime: "13:00", venue: "Mega Audi" },
  { name: "Drama", date: "2025-10-12", time: "09:30", endTime: "12:30", venue: "Mega Audi" },
  { name: "Debate", date: "2025-10-12", time: "09:30", endTime: "11:30", venue: "AB4 310" },
  { name: "Cricket Auction", date: "2025-10-12", time: "09:00", endTime: "15:00", venue: "AB5 Audi" },
  { name: "Shark Tank", date: "2025-10-12", time: "09:00", endTime: "15:30", venue: "AB4 Seminar Hall (208)" },
  { name: "Mock Trading", date: "2025-10-12", time: "10:00", endTime: "15:30", venue: "AB4 312" },
  { name: "Pop Culture", date: "2025-10-12", time: "10:30", endTime: "13:00", venue: "AB4 312, 313" },
  { name: "Solo Instrumental", date: "2025-10-12", time: "11:30", endTime: "13:30", venue: "AB4 Audi" },
  { name: "Nukkad Natak", date: "2025-10-12", time: "12:30", endTime: "13:30", venue: "In front of AB4" },
  { name: "Fashion Show", date: "2025-10-12", time: "13:00", endTime: "15:00", venue: "Mega Audi" },
  { name: "Melas Quiz", date: "2025-10-12", time: "14:00", endTime: "16:00", venue: "AB4 310, 311" },
  { name: "Mono Acting", date: "2025-10-12", time: "14:30", endTime: "17:30", venue: "AB4 Audi" }
];


// const TEST_MODE = true;
// const TEST_NOW = new Date("2025-10-06T16:30:00+05:30");

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
  const [currentEvents, setCurrentEvents] = useState<typeof events>([]);

  useEffect(() => {
    const updateTimeline = () => {
      const now = new Date();
      setCurrentDate(now);
    
      const totalTime = endDate.getTime() - startDate.getTime();
      const elapsed = Math.min(Math.max(now.getTime() - startDate.getTime(), 0), totalTime);
      setProgress((elapsed / totalTime) * 100);
    
      const ongoing = events.filter((e) => {
        const start = new Date(`${e.date}T${e.time}`);
        const end = new Date(`${e.date}T${e.endTime}`);
        return now >= start && now <= end;
      });
    
      setCurrentEvents(ongoing);
    };    

    updateTimeline();
    const interval = setInterval(updateTimeline, 60000);
    return () => clearInterval(interval);
  }, []);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
  );

  const now = currentDate;
  const pastEvents = sortedEvents.filter((e) => new Date(`${e.date}T${e.endTime}`) < now);
  const futureEvents = sortedEvents.filter((e) => new Date(`${e.date}T${e.time}`) > now);

  const previousEvent = pastEvents[pastEvents.length - 1] || null;
  const upcomingEvent = futureEvents[0] || null;

  return (
    <div className="w-full bg-transparent py-10 sm:py-16 flex justify-center px-4">
      <div className="relative w-full max-w-[900px] mx-auto px-4 sm:px-8 py-8 sm:py-10 bg-[#32212C] text-[#DBAAA6] border-4 sm:border-8 rounded-lg">
        <div className="absolute -inset-2 sm:-inset-4 border-2 sm:border-4 border-[#D7897D] rounded-lg pointer-events-none opacity-50"></div>

        <div
          className="full-overlay absolute inset-0 z-20 pointer-events-none rounded-2xl"
          style={{
            boxShadow: "0 0 4px 1px rgba(255, 182, 193, 0.1)",
            border: "2px solid rgba(255, 182, 193, 0.2)",
          }}
        ></div>

        <div className="relative z-10">
          <h2 className="vintage-font text-2xl sm:text-3xl md:text-4xl text-left mb-6 sm:mb-10">
            FALAK &#39;25 TIMELINE
          </h2>

          {/* Progress Bar */}
          <div className="relative w-full mb-8">
            <div className="absolute left-0 -top-5 text-[#DBAAA6] font-mono text-xs sm:text-sm animate-pulse">
              ▶ Fest Progress...
            </div>
            <div className="relative h-5 sm:h-6 w-full bg-[#1f1a2e]/80 rounded-sm overflow-hidden border-2 border-[#DBAAA6] shadow-inner">
            <div
  className="absolute h-full transition-all duration-500"
  style={{ width: `${progress}%`, backgroundColor: "#e0808a" }}
/>

              <div
                className="absolute top-0 w-3 h-full bg-[#DBAAA6] animate-bounce"
                style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
              />
            </div>
            <div className="absolute right-0 -top-5 text-[#DBAAA6] font-mono text-[10px] sm:text-xs tracking-wider">
              {Math.round(progress)}% Complete
            </div>
          </div>

          {/* Event Info */}
          <div className="space-y-4 text-left">
            {now < new Date(`${events[0].date}T${events[0].time}`) ? (
              <>
                <p className="font-mono text-lg border-2 border-dashed border-[#DBAAA6] rounded p-2 bg-[#1f1a2e]/80">
                  Countdown to FALAK&#39;25
                </p>
                <p className="text-[#32212C] font-mono text-xl border-2 border-[#2e1a47] rounded p-3 bg-[#DBAAA6] font-bold">
                  ► Current: Waiting for Fest Start...
                </p>
              </>
            ) : now > endDate ? (
              <p className="text-[#32212C] font-mono text-xl border-2 border-[#2e1a47] rounded p-3 bg-[#DBAAA6] font-bold">
                ► Current: FALAK&#39;25 has ended. Thanks for joining!
              </p>
            ) : (
              <>
                {previousEvent && (
                  <p className="font-mono text-lg border-2 border-dashed border-[#DBAAA6] rounded p-2 bg-[#1f1a2e]/80">
                    Previous: {previousEvent.name} ({formatTime(previousEvent.time)}–{formatTime(previousEvent.endTime)}) —{" "}
                    <span className="text-[#D7897D]">{previousEvent.venue}</span>
                  </p>
                )}

                {currentEvents.length > 0 ? (
                  <div className="space-y-2">
                    {currentEvents.map((e, i) => (
                      <p
                        key={i}
                        className="text-[#32212C] font-mono text-lg border-2 border-[#2e1a47] rounded p-3 bg-[#DBAAA6] font-bold"
                      >
                        ► Current: {e.name} ({formatTime(e.time)}–{formatTime(e.endTime)}) —{" "}
                        <span className="text-[#8b3e5e]">{e.venue}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-lg border border-dashed border-[#DBAAA6] rounded p-2 bg-[#1f1a2e]/60">
                    No live event right now
                  </p>
                )}

                {upcomingEvent && (
                  <p className="font-mono text-lg border-2 border-dashed border-[#DBAAA6] rounded p-2 bg-[#1f1a2e]/80">
                    Upcoming: {upcomingEvent.name} ({formatTime(upcomingEvent.time)}–{formatTime(upcomingEvent.endTime)}) —{" "}
                    <span className="text-[#D7897D]">{upcomingEvent.venue}</span>
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
