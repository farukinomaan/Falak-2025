'use client';

import React, { forwardRef } from 'react';
import Tape from './Tape';

const Cassette = forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref} style={{ position: 'relative' }}>
    <svg
      width="250"
      height="150"
      viewBox="0 0 250 150"
      xmlns="http://www.w3.org/2000/svg"
      className="cassette-tape"
    >
      <defs>
        <linearGradient id="cassette-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2D2D2D" />
          <stop offset="100%" stopColor="#3D3D3D" />
        </linearGradient>
        <filter id="bevan-undershadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="0" floodColor="#58907D" floodOpacity="1" />
        </filter>
      </defs>
      <rect x="5" y="5" width="240" height="140" rx="10" fill="url(#cassette-gradient)" stroke="#1A1A1A" strokeWidth="2" />
      <rect x="15" y="15" width="220" height="120" rx="5" fill="#1F1F1F" stroke="#111" strokeWidth="1" />

      {/* Screws */}
      <circle cx="15" cy="15" r="3" fill="#4A4A4A" />
      <circle cx="235" cy="15" r="3" fill="#4A4A4A" />
      <circle cx="15" cy="135" r="3" fill="#4A4A4A" />
      <circle cx="235" cy="135" r="3" fill="#4A4A4A" />

      {/* Label Area */}
      <rect x="25" y="25" width="200" height="16.67" fill="#5c937b" />
      <rect x="25" y="41.67" width="200" height="16.67" fill="#f5e083" />
      <rect x="25" y="58.34" width="200" height="16.66" fill="#f4a259" />
      <text
        x="125"
        y="55"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="20"
        fontFamily="'Bevan', serif"
        fontWeight="700"
        filter="url(#bevan-undershadow)"
      >
        FALAK '25
      </text>

      {/* Window */}
      <rect x="40" y="85" width="170" height="30" rx="5" fill="rgba(0,0,0,0.3)" />
      <rect x="45" y="90" width="160" height="20" rx="3" fill="#222" stroke="#111" strokeWidth="1" />

      {/* Spools */}
      <circle cx="80" cy="105" r="15" fill="#1C1C1C" />
      <circle cx="170" cy="105" r="15" fill="#1C1C1C" />
      <circle cx="80" cy="105" r="5" fill="#333" />
      <circle cx="170" cy="105" r="5" fill="#333" />
    </svg>
    <Tape />
  </div>
));

Cassette.displayName = 'Cassette';

export default Cassette;
