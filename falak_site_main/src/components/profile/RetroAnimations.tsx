'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Cassette from './Cassette';

const RetroAnimations = () => {
  const cassetteRef = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    // Desktop and default animations
    if (cassetteRef.current) {
      gsap.set(cassetteRef.current, { 
        rotation: -45,
        scale: 1.5,
        x: '0%',
        y: '0%',
        top: '0',
        right: '0',
        position: 'absolute',
        visibility: 'visible'
      });

      const tapePath = cassetteRef.current.querySelector('#tape-path');
      if (tapePath) {
        tl.current = gsap.timeline({ paused: true });
        tl.current
          .to(tapePath, { attr: { d: 'M 80,105 C 40,205 120,225 80,305' }, ease: 'power1.inOut' })
          .to(tapePath, { attr: { d: 'M 80,105 C 120,305 40,325 80,405' }, ease: 'power1.inOut' })
          .to(tapePath, { attr: { d: 'M 80,105 C 40,405 120,425 80,505' }, ease: 'power1.inOut' })
          .to(tapePath, { attr: { d: 'M 80,105 C 120,505 40,525 80,605' }, ease: 'power1.inOut' })
          .to(tapePath, { attr: { d: 'M 80,105 C 40,605 120,625 80,705' }, ease: 'power1.inOut' })
          .to(tapePath, { attr: { d: 'M 80,105 C 120,705 40,725 80,805' }, ease: 'power1.inOut' });

        gsap.to(cassetteRef.current, {
          rotation: -50,
          repeat: -1,
          yoyo: true,
          duration: 2,
          ease: 'power1.inOut'
        });
      }
    }

    const handleScroll = () => {
      if (tl.current) {
        const scrollPosition = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollFraction = scrollPosition / maxScroll;
        tl.current.progress(scrollFraction);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      mm.revert();
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: 0, pointerEvents:'none'}}>
      <div ref={cassetteRef} style={{ visibility: 'hidden' }}>
        <Cassette />
      </div>
    </div>
  );
};

export default RetroAnimations;