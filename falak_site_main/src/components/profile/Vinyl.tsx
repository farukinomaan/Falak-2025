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
      fill="#FDFBF5"
      fontSize="12"
      fontFamily="'Zentry', sans-serif"
      style={{ textShadow: "1px 1px #5a5242" }}
    >
      FALAK
    </text>
    <text
      x="100"
      y="110"
      textAnchor="middle"
      fill="#FDFBF5"
      fontSize="10"
      fontFamily="'General', sans-serif"
      style={{ textShadow: "1px 1px #5a5242" }}
    >
      2025
    </text>
    <circle cx="100" cy="100" r="98" fill="url(#shine)" />
  </svg>
));

Vinyl.displayName = 'Vinyl';

export default Vinyl;
