'use client';

import React, { forwardRef } from 'react';
import Tape from './Tape';

const Cassette = forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg
      width="250"
      height="150"
      viewBox="0 0 250 150"
      xmlns="http://www.w3.org/2000/svg"
      className="cassette-tape"
    >
      <defs>
        <linearGradient id="cassette-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5F2E8" />
          <stop offset="100%" stopColor="#EAE5D9" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="240" height="140" rx="10" fill="url(#cassette-gradient)" stroke="#D4CBA6" strokeWidth="2" />
      <rect x="15" y="15" width="220" height="120" rx="5" fill="#EAE5D9" stroke="#D4CBA6" strokeWidth="1" />

      {/* Screws */}
      <circle cx="15" cy="15" r="3" fill="#C1B8A2" />
      <circle cx="235" cy="15" r="3" fill="#C1B8A2" />
      <circle cx="15" cy="135" r="3" fill="#C1B8A2" />
      <circle cx="235" cy="135" r="3" fill="#C1B8A2" />

      {/* Label Area */}
      <rect x="25" y="25" width="200" height="50" fill="#FDFBF5" stroke="#D4CBA6" strokeWidth="1" />
      <text
        x="125"
        y="55"
        textAnchor="middle"
        fill="#C74B2E"
        fontSize="20"
        fontFamily="'Zentry', sans-serif"
        style={{ textShadow: "1px 1px #8c3a2e" }}
      >
        FALAK '25
      </text>

      {/* Window */}
      <rect x="40" y="85" width="170" height="30" rx="5" fill="#000" opacity="0.1" />
      <rect x="45" y="90" width="160" height="20" rx="3" fill="#fff" stroke="#D4CBA6" strokeWidth="1" />

      {/* Spools */}
      <circle cx="80" cy="105" r="15" fill="#2E2925" />
      <circle cx="170" cy="105" r="15" fill="#2E2925" />
      <circle cx="80" cy="105" r="5" fill="#F5F2E8" />
      <circle cx="170" cy="105" r="5" fill="#F5F2E8" />
    </svg>
    <Tape />
  </div>
));

Cassette.displayName = 'Cassette';

export default Cassette;
