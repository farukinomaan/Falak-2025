'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Vinyl from './profile/Vinyl';

const CulturalAnimations = () => {
  const vinylRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      // Desktop vinyl animation
      if (vinylRef.current) {
        gsap.to(vinylRef.current, {
          rotation: 360,
          repeat: -1,
          duration: 10,
          ease: 'none',
          transformOrigin: 'center center'
        });
      }
    });

    mm.add("(max-width: 767px)", () => {
      // Mobile vinyl animation
      if (vinylRef.current) {
        gsap.set(vinylRef.current, { scale: 1.1 });
        gsap.to(vinylRef.current, {
          rotation: 360,
          repeat: -1,
          duration: 10,
          ease: 'none',
          transformOrigin: 'center center'
        });
      }
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: 3 }}>
      <div style={{ position: 'absolute', bottom: '-10vmin', right: '-40vmin', width: '120vmin', height: '120vmin' }}>
        <Vinyl ref={vinylRef} />
      </div>
    </div>
  );
};

export default CulturalAnimations;
