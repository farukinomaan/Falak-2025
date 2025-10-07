"use client";

import PassAddToCartButton from "@/components/cart/PassAddToCartButton";
import Link from "next/link";
import React, { useState, useCallback, useEffect } from "react";

interface CassettePassProps {
  pass: {
    id: string;
    pass_name: string;
    description?: string | null;
    cost?: number | string | null;
    redirect?: string;
  };
  isMahe?: boolean;
}

export default function CassettePass({ pass, isMahe = false }: CassettePassProps) {
  // Flip state
  const [flipped, setFlipped] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  // Entire cassette triggers flip on hover (desktop) or tap (mobile)
  const onEnter = useCallback(() => { if (introDone) setFlipped(true); }, [introDone]);
  const onLeave = useCallback(() => { if (introDone) setFlipped(false); }, [introDone]);
  const toggle = useCallback(() => { if (introDone) setFlipped(f => !f); }, [introDone]);
  const stop = useCallback((e: React.MouseEvent) => { e.stopPropagation(); }, []);



  // Manual toggle: when true, disable Buy Now navigation for MAHE link
  const [bakchodi] = useState(false);




  // Initial whirl animation then settle front
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 1500); // match animation duration
    return () => clearTimeout(t);
  }, []);

  return (
    <div
    className="relative mx-auto z-40 select-none w-[100vw] sm:w-[700px] md:w-[900px] lg:w-[1053px] aspect-[1053/631]"
    style={{ perspective: "1000px" }}
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
          <div
  className="absolute inset-0"
  style={{ backfaceVisibility: "hidden", pointerEvents: flipped ? "none" : "auto" }}
>
{/* Base cassette */}
<div
  className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none cassette-img"
/>

  {/* Name */}
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[230%] px-2 text-center">
  <h3
    className="font-brasty font-bold text-center leading-snug mt-2"
    style={{
      color: "#DBAAA6",
      fontSize: "clamp(0.7rem, 3vw, 3rem)",
      WebkitTextStroke: "1px #32212c", // <-- white outline
      textShadow: "0 0 4px rgba(0,0,0,0.15)", // subtle glow to soften edges
    }}
  >
    {pass.pass_name}
  </h3>
</div>


  {/* Price */}
  {pass.cost && (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[60%] sm:translate-y-[50%] px-2 w-full flex justify-center"
      style={{ pointerEvents: 'none' }}
    >  
      <p
        className="font-brasty font-bold text-center text-[#32212C] max-w-[86%] break-words whitespace-normal"
        style={{ fontSize: "clamp(1rem, 4.2vw, 3rem)" }}
      >
        ₹{typeof pass.cost === "number" ? pass.cost : pass.cost}
        <span className="text-lg">{pass.pass_name == "Non-MAHE BLR" ? "+ 18% GST":""}</span>
      </p>
    </div>
  )}
</div>


          {/* BACK */}
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: flipped ? 'auto' : 'none' }}>
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none" style={{ backgroundImage: "url('/cassette.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
    <div className="absolute back-cassette-img inset-0 pointer-events-none" style={{ backgroundImage: "url('/cassette.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', filter: 'drop-shadow(0 0 6px #d4cba6)', borderRadius: '16px' }} />
    {/* Darker glass mask aligned with cassette; responsive dimensions via CSS */}
    <div className="absolute z-10 glass-mask" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRadius: '24px', border: '1.5px solid rgba(212,203,166,0.55)', boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pass.description ? (
                <div className="text-center">
      <h4 className="text-[#fee583] font-unlock font-semibold mb-3 uppercase tracking-wider text-base sm:text-xl md:text-2xl lg:text-3xl">
        Description
      </h4>
      <p className="text-white leading-relaxed font-unlock text-sm sm:text-base md:text-lg">{pass.description}</p>
                </div>
              ) : (
                <div className="text-center">
      <h4 className="text-[#fee583] font-unlock font-semibold mb-3 uppercase tracking-wider text-base sm:text-xl md:text-2xl lg:text-3xl">Description</h4>
      <p className="text-gray-200 font-unlock text-sm sm:text-base md:text-lg">No description available</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
      {/* Keep the Add to Cart button outside the rotating 3D plane so it never tilts */}
      {!flipped && (
        <div className="absolute bottom-4 xs:bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 buy-button-wrapper" onClick={stop}>
          {isMahe ? (
            bakchodi ? (
              <Link
                href=""
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white text-[#D7897D] font-semibold shadow-lg hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              >
                Buy Now
              </Link>
            ) : (
              <Link
                href={pass.redirect ? pass.redirect : "https://payment.manipal.edu/falak-Login"}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white text-[#D7897D] font-semibold shadow-lg hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              >
                Buy Now
              </Link>
            )
          ) : (
            <PassAddToCartButton
              passId={pass.id}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-[#D7897D] text-white font-semibold shadow-lg hover:bg-[#c97b70] transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
            />
          )}
        </div>
      )}
      {flipped && (
        <div className="absolute bottom-4 xs:bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50" onClick={stop}>
          {isMahe ? (
            bakchodi ? (
              <Link
                href=""
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white text-[#D7897D] font-semibold shadow-lg hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              >
                Buy Now
              </Link>
            ) : (
              <Link
                href="https://payment.manipal.edu/falak-Login"
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white text-[#D7897D] font-semibold shadow-lg hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              >
                Buy Now
              </Link>
            )
          ) : (
            <PassAddToCartButton
              passId={pass.id}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-[#D7897D] text-white font-semibold shadow-lg hover:bg-[#c97b70] transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
            />
          )}
        </div>
      )}
      <style jsx>{`
  @keyframes cassette-whirl {
    0% { transform: rotateY(0deg);}
    65% { transform: rotateY(410deg);}
    100% { transform: rotateY(240deg);}
  }

  .animate-cassette-whirl {
    animation: cassette-whirl 2s ease-in-out;
    will-change: transform;
  }

  /* Cassette scaling */
  .cassette-img {
    background-image: url('/cassette.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  @media (max-width: 768px) {
    .cassette-img {
      transform: scale(1.2);
    }
  }
  @media (max-width: 480px) {
    .cassette-img {
      transform: scale(1.35);
    }
  }

  /* Responsive mask sizing/positioning */
  .glass-mask {
    width: 60%;
    height: 60%;
    top: 20%;
    left: 20%;
    padding: 16px 20px;
  }
  @media (max-width: 640px) {
    .glass-mask { width: 60%; height: 62%; top: 19%; left: 20%; padding: 12px 14px; }
  }
  @media (min-width: 768px) {
    .glass-mask { width: 60%; height: 58%; top: 21%; left: 20%; padding: 18px 24px; }
  }
  @media (min-width: 1024px) {
    .glass-mask { width: 58%; height: 60%; top: 20%; left: 21%; padding: 22px 28px; }
  }

  @media (max-width: 480px) {
    .buy-button-wrapper {
      bottom: 0.7rem !important; /* push it down more on mobiles */
    }
  }
  /* Increase text size on small mobiles */
  @media (max-width: 480px) {
    /* Pass name */
    h3 {
      font-size: clamp(0.9rem, 4vw, 3.2rem) !important;
    }

    /* Price */
    p.font-brasty {
      font-size: clamp(1.2rem, 5vw, 4rem) !important;
    }

    /* Description */
    .glass-mask p {
      font-size: 1rem !important;
    }

    .glass-mask h4 {
      font-size: 1.5rem !important;
    }
  }
  @media (max-width: 480px) {
    /* Front PNG already scales */
    .cassette-img {
      transform: scale(1.35);
    }
  
    /* Back PNG: match the front scale */
    .back-cassette-img {
      transform: scale(1.35);
    }
  
    /* Back description overlay to match PNG */
    .glass-mask {
      width: 80%;
      height: 88%;
      top: 8%;
      left: 10%;
      padding: 0;
      border-radius: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  @media (max-width: 1024px) { /* tablets and below */
  /* Target back description heading */
  .glass-mask h4 {
    margin-bottom: 0.5rem; /* reduce spacing below heading */
    transform: translateY(-0.3rem); /* move heading slightly up */
  }
}

@media (max-width: 480px) { /* mobiles */
  .glass-mask h4 {
    margin-bottom: 0.1rem;
    transform: translateY(-1rem);
  }
}
@media (max-width: 1024px) { /* tablets and below */
  .glass-mask p {
    transform: translateY(-0.3rem); /* move description text up slightly */
  }
}

@media (max-width: 480px) { /* mobiles */
  .glass-mask p {
    transform: translateY(-1rem); 
  }
}


`}</style>


    </div>
  );    
}











export function CassettePass2({ pass, isMahe = false }: CassettePassProps) {
  // Flip state
  const [flipped, setFlipped] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  // Entire cassette triggers flip on hover (desktop) or tap (mobile)
  const onEnter = useCallback(() => { if (introDone) setFlipped(true); }, [introDone]);
  const onLeave = useCallback(() => { if (introDone) setFlipped(false); }, [introDone]);
  const toggle = useCallback(() => { if (introDone) setFlipped(f => !f); }, [introDone]);
  const stop = useCallback((e: React.MouseEvent) => { e.stopPropagation(); }, []);



  // Manual toggle: when true, disable Buy Now navigation for MAHE link
  const [bakchodi] = useState(false);




  // Initial whirl animation then settle front
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 1500); // match animation duration
    return () => clearTimeout(t);
  }, []);

  return (
    <div
    className="relative mx-auto z-40 select-none w-[100vw] sm:w-[700px] md:w-[900px] lg:w-[1053px] aspect-[1053/631]"
    style={{ perspective: "1000px" }}
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
          <div
  className="absolute inset-0"
  style={{ backfaceVisibility: "hidden", pointerEvents: flipped ? "none" : "auto" }}
>
{/* Base cassette */}
<div
  className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none cassette-img"
/>

  {/* Name */}
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[230%] px-2 text-center">
  <h3
    className="font-brasty font-bold text-center leading-snug mt-2"
    style={{
      color: "#DBAAA6",
      fontSize: "clamp(0.7rem, 3vw, 3rem)",
      WebkitTextStroke: "1px #32212c", // <-- white outline
      textShadow: "0 0 4px rgba(0,0,0,0.15)", // subtle glow to soften edges
    }}
  >
    {pass.pass_name}
  </h3>
</div>


  {/* Price */}
  {pass.cost && (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[60%] sm:translate-y-[50%] px-2 w-full flex justify-center"
      style={{ pointerEvents: 'none' }}
    >  
      <p
        className="font-brasty font-bold text-center text-[#32212C] max-w-[86%] break-words whitespace-normal mt-0 sm:mt-2"
        style={{ fontSize: "clamp(1rem, 4.8vw, 2.4rem)" }}
      >
        {pass.pass_name == "Non-MAHE BLR" ? "NOT AVAILABLE" : "Included in MAHE BLR"}
        <span className="text-lg"></span>
      </p>
    </div>
  )}
</div>



{pass.cost && (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[100%] sm:translate-y-[100%] px-2 w-full flex justify-center"
      style={{ pointerEvents: 'none' }}
    >  
      <p
        className="font-brasty font-bold text-center text-[#32212C] max-w-[86%] break-words whitespace-normal mt-0 sm:mt-2"
        style={{ fontSize: "clamp(1rem, 4.8vw, 2.4rem)" }}
      >
        
        <span className="text-sm sm:text-lg">{pass.pass_name == "Non-MAHE BLR" ? "NOT AVAILABLE" : "Limited Seats Available"}</span>
      </p>
    </div>
  )}



          {/* BACK */}
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: flipped ? 'auto' : 'none' }}>
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none" style={{ backgroundImage: "url('/cassette.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
    <div className="absolute back-cassette-img inset-0 pointer-events-none" style={{ backgroundImage: "url('/cassette.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', filter: 'drop-shadow(0 0 6px #d4cba6)', borderRadius: '16px' }} />
    {/* Darker glass mask aligned with cassette; responsive dimensions via CSS */}
    <div className="absolute z-10 glass-mask" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRadius: '24px', border: '1.5px solid rgba(212,203,166,0.55)', boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pass.description ? (
                <div className="text-center">
      <h4 className="text-[#fee583] font-unlock font-semibold mb-3 uppercase tracking-wider text-base sm:text-xl md:text-2xl lg:text-3xl">
        Description
      </h4>
      <p className="text-white leading-relaxed font-unlock text-sm sm:text-base md:text-lg">{pass.description}</p>
                </div>
              ) : (
                <div className="text-center">
      <h4 className="text-[#fee583] font-unlock font-semibold mb-3 uppercase tracking-wider text-base sm:text-xl md:text-2xl lg:text-3xl">Description</h4>
      <p className="text-gray-200 font-unlock text-sm sm:text-base md:text-lg">No description available</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
      {/* Keep the Add to Cart button outside the rotating 3D plane so it never tilts */}
      {!flipped && (
        <div className="absolute bottom-4 xs:bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 buy-button-wrapper" onClick={stop}>
          {isMahe ? (
            bakchodi ? (
              <Link
                href="https://falak.mitblr.org/cultural/Standup"
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white text-[#D7897D] font-semibold shadow-lg hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              >
                Register Now
              </Link>
            ) : (
              <Link
                href="https://falak.mitblr.org/cultural/Standup"
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white text-[#D7897D] font-semibold shadow-lg hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              >
                Register Now
              </Link>
            )
          ) : (
            <div>No Pass Available</div>
          )}
        </div>
      )}
      {flipped && (
        <div className="absolute bottom-4 xs:bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50" onClick={stop}>
          {isMahe ? (
            bakchodi ? (
              <Link
                href="https://falak.mitblr.org/cultural/Standup"
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white text-[#D7897D] font-semibold shadow-lg hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              >
                Register Now
              </Link>
            ) : (
              <Link
                href="https://falak.mitblr.org/cultural/Standup"
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white text-[#D7897D] font-semibold shadow-lg hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D7897D]"
              >
                Register Now
              </Link>
            )
          ) : (
            <div>NA</div>
          )}
        </div>
      )}
      <style jsx>{`
  @keyframes cassette-whirl {
    0% { transform: rotateY(0deg);}
    65% { transform: rotateY(410deg);}
    100% { transform: rotateY(240deg);}
  }

  .animate-cassette-whirl {
    animation: cassette-whirl 2s ease-in-out;
    will-change: transform;
  }

  /* Cassette scaling */
  .cassette-img {
    background-image: url('/cassette.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  @media (max-width: 768px) {
    .cassette-img {
      transform: scale(1.2);
    }
  }
  @media (max-width: 480px) {
    .cassette-img {
      transform: scale(1.35);
    }
  }

  /* Responsive mask sizing/positioning */
  .glass-mask {
    width: 60%;
    height: 60%;
    top: 20%;
    left: 20%;
    padding: 16px 20px;
  }
  @media (max-width: 640px) {
    .glass-mask { width: 60%; height: 62%; top: 19%; left: 20%; padding: 12px 14px; }
  }
  @media (min-width: 768px) {
    .glass-mask { width: 60%; height: 58%; top: 21%; left: 20%; padding: 18px 24px; }
  }
  @media (min-width: 1024px) {
    .glass-mask { width: 58%; height: 60%; top: 20%; left: 21%; padding: 22px 28px; }
  }

  @media (max-width: 480px) {
    .buy-button-wrapper {
      bottom: 0.7rem !important; /* push it down more on mobiles */
    }
  }
  /* Increase text size on small mobiles */
  @media (max-width: 480px) {
    /* Pass name */
    h3 {
      font-size: clamp(0.9rem, 4vw, 3.2rem) !important;
    }

    /* Price */
    p.font-brasty {
      font-size: clamp(1.2rem, 5vw, 4rem) !important;
    }

    /* Description */
    .glass-mask p {
      font-size: 1rem !important;
    }

    .glass-mask h4 {
      font-size: 1.5rem !important;
    }
  }
  @media (max-width: 480px) {
    /* Front PNG already scales */
    .cassette-img {
      transform: scale(1.35);
    }
  
    /* Back PNG: match the front scale */
    .back-cassette-img {
      transform: scale(1.35);
    }
  
    /* Back description overlay to match PNG */
    .glass-mask {
      width: 80%;
      height: 88%;
      top: 8%;
      left: 10%;
      padding: 0;
      border-radius: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  @media (max-width: 1024px) { /* tablets and below */
  /* Target back description heading */
  .glass-mask h4 {
    margin-bottom: 0.5rem; /* reduce spacing below heading */
    transform: translateY(-0.3rem); /* move heading slightly up */
  }
}

@media (max-width: 480px) { /* mobiles */
  .glass-mask h4 {
    margin-bottom: 0.1rem;
    transform: translateY(-1rem);
  }
}
@media (max-width: 1024px) { /* tablets and below */
  .glass-mask p {
    transform: translateY(-0.3rem); /* move description text up slightly */
  }
}

@media (max-width: 480px) { /* mobiles */
  .glass-mask p {
    transform: translateY(-1rem); 
  }
}


`}</style>


    </div>
  );    
}