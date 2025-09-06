"use client";

import PassAddToCartButton from "@/components/cart/PassAddToCartButton";
import React, { useState, useCallback, useEffect } from "react";

interface CassettePassProps {
  pass: {
    id: string;
    pass_name: string;
    description?: string | null;
    cost?: number | string | null;
  };
}

export default function CassettePass({ pass }: CassettePassProps) {
  // Flip state
  const [flipped, setFlipped] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  // Entire cassette triggers flip on hover (desktop) or tap (mobile)
  const onEnter = useCallback(() => { if (introDone) setFlipped(true); }, [introDone]);
  const onLeave = useCallback(() => { if (introDone) setFlipped(false); }, [introDone]);
  const toggle = useCallback(() => { if (introDone) setFlipped(f => !f); }, [introDone]);
  const stop = useCallback((e: React.MouseEvent) => { e.stopPropagation(); }, []);

  // Initial whirl animation then settle front
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 1500); // match animation duration
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative mx-auto z-40 select-none w-screen sm:w-[900px] md:w-[900px] lg:w-[1053px] aspect-[1053/631]"
      style={{ perspective: '1000px' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={toggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && introDone) { e.preventDefault(); toggle(); } }}
      aria-label={flipped ? 'Show pass front' : 'Show pass back'}
    >
      {/* Rotating wrapper */}
      <div className={`relative w-full h-full ${introDone ? '' : 'animate-cassette-whirl'}`} style={{ transformStyle: 'preserve-3d', transition: 'transform 0.7s ease-in-out' }}>
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transform: `rotateY(${flipped ? 180 : 0}deg)`, transition: 'transform 0.7s ease-in-out' }}>
          {/* FRONT */}
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', pointerEvents: flipped ? 'none' : 'auto' }}>
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none" style={{ backgroundImage: "url('/cassette.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/cassette.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', filter: 'drop-shadow(0 0 10px #d4cba6) drop-shadow(0 0 20px #d4cba6)', borderRadius: '16px' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-10 sm:-mt-14 px-2 text-center">
              <h3 className="font-brasty font-bold text-center text-white leading-snug" style={{ textShadow: '0 0 8px rgba(255,255,255,0.3)', fontSize: 'clamp(1.1rem, 5vw, 2rem)' }}>{pass.pass_name}</h3>
            </div>
            {pass.cost && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-10 sm:mt-20 px-2">
                <p className="font-brasty font-bold text-center text-white" style={{ fontSize: 'clamp(1rem, 4.2vw, 1.75rem)' }}>₹{typeof pass.cost === 'number' ? pass.cost : pass.cost}</p>
              </div>
            )}
            <div className="absolute bottom-4 xs:bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-30" style={{ transform: 'translateZ(4px)' }} onClick={stop}>
              <PassAddToCartButton
                passId={pass.id}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-[#D7897D] text-white font-semibold shadow-lg hover:bg-[#c97b70] transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              />
            </div>
          </div>
          {/* BACK */}
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: flipped ? 'auto' : 'none' }}>
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none" style={{ backgroundImage: "url('/cassette.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/cassette.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', filter: 'drop-shadow(0 0 10px #8B5CF6) drop-shadow(0 0 20px #A855F7)', borderRadius: '16px' }} />
            <div className="absolute z-10" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '2px solid #d4cba6', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)', padding: '20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60%', height: '60%', top: '20%', left: '20%' }}>
              {pass.description ? (
                <div className="text-center">
                  <h4 className="text-purple-300 text-sm font-semibold mb-3 uppercase tracking-wider" style={{ fontFamily: "'Varela Round', 'Quicksand', sans-serif", textShadow: '0 0 4px #d4cba6' }}>Description</h4>
                  <p className="text-white text-base leading-relaxed" style={{ fontFamily: "'Varela Round', 'Quicksand', sans-serif", textShadow: '0 0 6px rgba(255,255,255,0.3)' }}>{pass.description}</p>
                </div>
              ) : (
                <div className="text-center">
                  <h4 className="text-purple-300 text-sm font-semibold mb-3 uppercase tracking-wider" style={{ fontFamily: "'Varela Round', 'Quicksand', sans-serif", textShadow: '0 0 4px #d4cba6' }}>Description</h4>
                  <p className="text-gray-300 text-base" style={{ fontFamily: "'Varela Round', 'Quicksand', sans-serif", textShadow: '0 0 4px rgba(255,255,255,0.2)' }}>No description available</p>
                </div>
              )}
            </div>
            <div className="absolute bottom-4 xs:bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-30" style={{ transform: 'translateZ(4px)' }} onClick={stop}>
              <PassAddToCartButton
                passId={pass.id}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-[#D7897D] text-white font-semibold shadow-lg hover:bg-[#c97b70] transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes cassette-whirl { 0% { transform: rotateY(0deg);} 65% { transform: rotateY(410deg);} 100% { transform: rotateY(240deg);} }
        .animate-cassette-whirl { animation: cassette-whirl 2s ease-in-out; will-change: transform; }
      `}</style>
    </div>
  );    
}
