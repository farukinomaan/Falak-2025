'use client';

import React, { forwardRef } from 'react';

const Vinyl = forwardRef<SVGSVGElement>((props, ref) => (
  <svg
    ref={ref}
    width="100%"
    height="100%"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className="vinyl-record"
  >
    <defs>
      <radialGradient id="shine" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <filter id="bevan-undershadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="0" floodColor="#000000" floodOpacity="1" />
      </filter>
    </defs>
    <circle cx="100" cy="100" r="98" fill="#1A1A1A" />
    {
      Array.from({ length: 30 }).map((_, i) => (
        <circle
          key={i}
          cx="100"
          cy="100"
          r={35 + i * 2}
          fill="none"
          stroke="#2E2925"
          strokeWidth="0.5"
        />
      ))
    }
    <circle cx="100" cy="100" r="30" fill="#fa3741" />
    <circle cx="100" cy="100" r="28" fill="#e23b44" />
    <circle cx="100" cy="100" r="10" fill="#F5F2E8" />
    <text
      x="100"
      y="95"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="12"
      fontFamily="'Bevan', serif"
      fontWeight="700"
      filter="url(#bevan-undershadow)"
    >
      FALAK
    </text>
    <text
      x="100"
      y="110"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="10"
      fontFamily="'Bevan', serif"
      fontWeight="700"
      filter="url(#bevan-undershadow)"
    >
      2025
    </text>
    <circle cx="100" cy="100" r="98" fill="url(#shine)" />
  </svg>
));

Vinyl.displayName = 'Vinyl';

export default Vinyl;
