'use client';

import React from 'react';

const Tape = () => (
  <svg
    width="500"
    height="1000" // Increased height
    viewBox="0 0 500 1000" // Increased viewBox height
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', transform: 'rotate(45deg)', transformOrigin: '80px 105px' }}
  >
    <defs>
      <linearGradient id="tape-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#444" />
        <stop offset="50%" stopColor="#666" />
        <stop offset="100%" stopColor="#444" />
      </linearGradient>
    </defs>
    <path
      id="tape-path"
      d="M 80,105 C 80,105 80,105 80,105"
      stroke="url(#tape-gradient)"
      strokeWidth="5"
      fill="none"
    />
  </svg>
);

export default Tape;
