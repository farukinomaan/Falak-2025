// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { getUserByEmail } from "@/lib/actions/tables/users";
// import { createTicket } from "@/lib/actions/tables/tickets";
// import { ticketCategories } from "@/lib/validation/tickets";
// import GuestContactForm from "./GuestContactForm";
// import { redirect } from "next/navigation";

// // Server component renders the right view depending on user registration
// export default async function TicketsPage() {
//   const session = await getServerSession(authOptions);
//   const email = session?.user?.email ?? null;
//   const userRes = email ? await getUserByEmail(email) : { ok: true as const, data: null };
//   const registeredUser = userRes.ok ? userRes.data : null;

//   async function submit(formData: FormData) {
//     "use server";
//     if (!registeredUser) return;
//     const category = String(formData.get("category") || "other");
//     const issue = String(formData.get("issue") || "");
//     if (!issue || issue.trim().length < 5) return;
//     await createTicket({ userId: registeredUser.id!, category, issue });
//     redirect("/tickets?submitted=1");
//   }

//   return (
//     <div className="max-w-xl mx-auto p-6">
//       <h1 className="text-2xl font-semibold mb-4">Support Ticket</h1>
//       {!session || !email ? (
//         <GuestContactForm />
//       ) : !registeredUser ? (
//         <UnregisteredNotice />
//       ) : (
//         <RegisteredTicketForm action={submit} />
//       )}
//     </div>
//   );
// }

// function UnregisteredNotice() {
//   return (
//     <div className="space-y-4">
//       <p className="text-sm text-gray-700">
//         You are logged in but haven&apos;t completed registration. Please finish onboarding to raise a support ticket tied to your account.
//       </p>
//       <a href="/onboarding" className="inline-block px-4 py-2 rounded bg-black text-white">Complete Registration</a>
//       <div className="pt-4 border-t">
//         <GuestContactForm />
//       </div>
//     </div>
//   );
// }

// function RegisteredTicketForm({ action }: { action: (fd: FormData) => Promise<void> }) {
//   return (
//     <form action={action} className="space-y-4">
//       <div className="space-y-1">
//         <label className="block text-sm font-medium">Category</label>
//         <select name="category" className="w-full border rounded px-3 py-2">
//           {ticketCategories.map((c) => (
//             <option key={c} value={c}>
//               {c}
//             </option>
//           ))}
//         </select>
//       </div>
//       <div className="space-y-1">
//         <label className="block text-sm font-medium">Problem</label>
//         <textarea
//           name="issue"
//           required
//           rows={5}
//           className="w-full border rounded px-3 py-2"
//           placeholder="Describe the issue..."
//         />
//       </div>
//       <button type="submit" className="px-4 py-2 rounded bg-black text-white">Submit</button>
//     </form>
//   );
// }

 

'use client';

import { useState, useEffect } from 'react';

const RetroDancingAnimation = () => {
  const [mouseDirection, setMouseDirection] = useState('center');
  const [lastMouseX, setLastMouseX] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; }) => {
      const currentX = e.clientX;
      const windowCenter = window.innerWidth / 2;
      
      // Determine direction based on mouse position relative to center
      if (currentX < windowCenter - 100) {
        setMouseDirection('left');
      } else if (currentX > windowCenter + 100) {
        setMouseDirection('right');
      } else {
        setMouseDirection('center');
      }
      
      setLastMouseX(currentX);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Dynamic eye positions based on mouse direction
  const getEyePositions = () => {
    switch(mouseDirection) {
      case 'left':
        return { leftEye: 'top-7 left-5', rightEye: 'top-7 right-9' };
      case 'right':
        return { leftEye: 'top-7 left-9', rightEye: 'top-7 right-5' };
      default:
        return { leftEye: 'top-7 left-7', rightEye: 'top-7 right-7' };
    }
  };

  const eyePositions = getEyePositions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-12 h-12 bg-yellow-400 rotate-45 animate-bounce opacity-60"></div>
        <div className="absolute top-40 right-16 w-8 h-8 bg-pink-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute bottom-32 left-20 w-6 h-16 bg-green-400 animate-pulse opacity-50"></div>
        <div className="absolute bottom-20 right-10 w-10 h-10 bg-orange-400 rotate-12 animate-spin opacity-60"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 h-full">
            {Array.from({length: 64}).map((_, i) => (
              <div key={i} className="border border-white/20"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center z-10">
        {/* Large FLOW text */}
        <div className="relative mb-8">
          <h1 className="text-9xl md:text-[12rem] font-black text-white/90 tracking-tight select-none">
            FLOW
          </h1>
          
          {/* Dancing Disco Ball Character */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="relative">
              {/* Main disco ball body */}
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 
                            shadow-2xl transform transition-all duration-300
                            hover:scale-110 cursor-pointer disco-ball-dance
                            ${mouseDirection === 'left' ? 'disco-look-left' : 
                              mouseDirection === 'right' ? 'disco-look-right' : ''}`}>
                
                {/* Disco ball squares pattern */}
                <div className="absolute inset-2 rounded-full overflow-hidden">
                  <div className="grid grid-cols-6 h-full opacity-60">
                    {Array.from({length: 36}).map((_, i) => (
                      <div key={i} 
                           className="border border-white/30 bg-white/20 sparkle-square"
                           style={{
                             animationDelay: `${(i % 6) * 0.1}s`
                           }}></div>
                    ))}
                  </div>
                </div>

                {/* Big Happy Eyes that follow mouse */}
                <div className={`absolute ${eyePositions.leftEye} transition-all duration-300 ease-out`}>
                  <div className="w-6 h-6 bg-black rounded-full relative">
                    {/* Eye shine/sparkle */}
                    <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className={`absolute ${eyePositions.rightEye} transition-all duration-300 ease-out`}>
                  <div className="w-6 h-6 bg-black rounded-full relative">
                    {/* Eye shine/sparkle */}
                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Sparkles around the ball */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-300 rounded-full animate-ping opacity-80"></div>
                <div className="absolute -top-4 right-4 w-3 h-3 bg-pink-300 rounded-full animate-ping opacity-70 sparkle-1"></div>
                <div className="absolute bottom-2 -right-3 w-5 h-5 bg-cyan-300 rounded-full animate-ping opacity-60 sparkle-2"></div>
                <div className="absolute -bottom-3 left-6 w-2 h-2 bg-green-300 rounded-full animate-ping opacity-90 sparkle-3"></div>
              </div>

              {/* Dancing Arms with Hands */}
              {/* Left Arm */}
              <div className={`absolute top-1/2 -left-12 transform -translate-y-1/2 transition-all duration-300
                             ${mouseDirection === 'left' ? 'scale-110' : 'scale-100'}`}>
                {/* Upper arm */}
                <div className="relative">
                  <div className="w-8 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full 
                                arm-dance-left origin-right shadow-lg"></div>
                  {/* Forearm */}
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                    <div className="w-6 h-2 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full 
                                  forearm-dance-left origin-left shadow-md"></div>
                    {/* Hand */}
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full 
                                    hand-dance-left shadow-lg border-2 border-white/30">
                        {/* Fingers */}
                        <div className="absolute -top-1 left-1 w-1 h-2 bg-orange-300 rounded-full finger-dance"></div>
                        <div className="absolute -top-1 left-2 w-1 h-2 bg-orange-300 rounded-full finger-dance" style={{animationDelay: '0.1s'}}></div>
                        <div className="absolute -right-1 top-1 w-2 h-1 bg-orange-300 rounded-full finger-dance" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Arm */}
              <div className={`absolute top-1/2 -right-12 transform -translate-y-1/2 transition-all duration-300
                             ${mouseDirection === 'right' ? 'scale-110' : 'scale-100'}`}>
                {/* Upper arm */}
                <div className="relative">
                  <div className="w-8 h-3 bg-gradient-to-l from-purple-400 to-pink-400 rounded-full 
                                arm-dance-right origin-left shadow-lg"></div>
                  {/* Forearm */}
                  <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                    <div className="w-6 h-2 bg-gradient-to-l from-pink-400 to-yellow-400 rounded-full 
                                  forearm-dance-right origin-right shadow-md"></div>
                    {/* Hand */}
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 bg-gradient-to-bl from-yellow-300 to-orange-400 rounded-full 
                                    hand-dance-right shadow-lg border-2 border-white/30">
                        {/* Fingers */}
                        <div className="absolute -top-1 right-1 w-1 h-2 bg-orange-300 rounded-full finger-dance"></div>
                        <div className="absolute -top-1 right-2 w-1 h-2 bg-orange-300 rounded-full finger-dance" style={{animationDelay: '0.1s'}}></div>
                        <div className="absolute -left-1 top-1 w-2 h-1 bg-orange-300 rounded-full finger-dance" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div className="flex items-center justify-center gap-4 text-white/80">
          <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent w-20"></div>
          <p className="text-lg font-light tracking-widest uppercase">
            THE RETRO PARTY IS A <span className="italic font-normal">vibe</span>, INCLUSIVE, AND FUN
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent w-20"></div>
        </div>
        
        <p className="text-white/70 mt-2 text-lg tracking-wide">
          SPACE FOR <span className="font-bold">DEVELOPERS</span> AND <span className="italic">dancers</span>.
        </p>

        {/* Pulsating badge */}
        <div className="mt-8 inline-block">
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 px-8 py-3 rounded-full 
                        animate-pulse shadow-lg border-2 border-white/20">
            <span className="text-white font-bold text-sm tracking-wider">GROOVE MODE</span>
          </div>
        </div>
      </div>

      {/* Additional dancing elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4">
        {Array.from({length: 5}).map((_, i) => (
          <div key={i} 
               className="w-3 h-8 bg-gradient-to-t from-pink-400 to-yellow-400 rounded-full music-bar"
               style={{
                 animationDelay: `${i * 0.1}s`
               }}></div>
        ))}
      </div>

      {/* Mouse direction indicator (optional - you can remove this) */}
      <div className="absolute top-4 left-4 text-white/50 text-sm">
        Looking: {mouseDirection}
      </div>

      <style>{`
        .disco-ball-dance {
          animation: dance 1.5s infinite ease-in-out, colorShift 3s infinite ease-in-out;
        }
        
        .disco-look-left {
          transform: translateY(0) rotate(-3deg) scale(1.02) !important;
        }
        
        .disco-look-right {
          transform: translateY(0) rotate(3deg) scale(1.02) !important;
        }
        
        .sparkle-square {
          animation: sparkle 1s infinite alternate;
        }
        
        .sparkle-1 {
          animation-delay: 0.5s;
        }
        
        .sparkle-2 {
          animation-delay: 1s;
        }
        
        .sparkle-3 {
          animation-delay: 1.5s;
        }
        
        .arm-dance-left {
          animation: armDanceLeft 1.2s infinite ease-in-out;
        }
        
        .arm-dance-right {
          animation: armDanceRight 1.2s infinite ease-in-out;
        }
        
        .forearm-dance-left {
          animation: forearmDanceLeft 0.8s infinite ease-in-out;
        }
        
        .forearm-dance-right {
          animation: forearmDanceRight 0.8s infinite ease-in-out;
        }
        
        .hand-dance-left {
          animation: handDanceLeft 0.6s infinite ease-in-out;
        }
        
        .hand-dance-right {
          animation: handDanceRight 0.6s infinite ease-in-out;
        }
        
        .smile-dance {
          animation: smileDance 1.5s infinite ease-in-out;
        }
        
        .music-bar {
          animation: musicBar 0.8s infinite ease-in-out alternate;
        }
        
        @keyframes dance {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-10px) rotate(-5deg) scale(1.05); }
          50% { transform: translateY(0) rotate(5deg) scale(0.95); }
          75% { transform: translateY(-5px) rotate(-3deg) scale(1.02); }
        }
        
        @keyframes colorShift {
          0% { filter: hue-rotate(0deg) brightness(1); }
          33% { filter: hue-rotate(120deg) brightness(1.2); }
          66% { filter: hue-rotate(240deg) brightness(1.1); }
          100% { filter: hue-rotate(360deg) brightness(1); }
        }
        
        @keyframes sparkle {
          0% { opacity: 0.2; transform: scale(0.8); }
          100% { opacity: 0.8; transform: scale(1.2); }
        }
        
        @keyframes armDanceLeft {
          0%, 100% { transform: rotate(-20deg) translateY(0); }
          25% { transform: rotate(-45deg) translateY(-5px); }
          50% { transform: rotate(-10deg) translateY(5px); }
          75% { transform: rotate(-30deg) translateY(-3px); }
        }
        
        @keyframes armDanceRight {
          0%, 100% { transform: rotate(20deg) translateY(0); }
          25% { transform: rotate(45deg) translateY(-5px); }
          50% { transform: rotate(10deg) translateY(5px); }
          75% { transform: rotate(30deg) translateY(-3px); }
        }
        
        @keyframes forearmDanceLeft {
          0%, 100% { transform: rotate(15deg); }
          50% { transform: rotate(-25deg); }
        }
        
        @keyframes forearmDanceRight {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(25deg); }
        }
        
        @keyframes handDanceLeft {
          0%, 100% { transform: rotate(10deg) scale(1); }
          50% { transform: rotate(-15deg) scale(1.1); }
        }
        
        @keyframes handDanceRight {
          0%, 100% { transform: rotate(-10deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.1); }
        }
        
        @keyframes fingerDance {
          0% { transform: scale(0.8) rotate(0deg); }
          100% { transform: scale(1.2) rotate(10deg); }
        }
        
        @keyframes armDance {
          0%, 100% { transform: translateY(-50%) rotate(12deg) scaleX(1); }
          50% { transform: translateY(-60%) rotate(25deg) scaleX(1.2); }
        }
        
        @keyframes musicBar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default RetroDancingAnimation;