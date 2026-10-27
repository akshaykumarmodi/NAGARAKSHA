import React from 'react'

export function NagarakshakLogo({ size = 28, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="NAGARAKSHAK Emblem"
    >
      <defs>
        <linearGradient id="nagarakshaGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="nagarakshaBuilding" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Outer Shield Outline */}
      <path 
        d="M 50 16 
           C 40 18, 29 20, 24 25 
           C 23 38, 23 52, 27 63 
           C 33 76, 43 85, 50 90 
           C 57 85, 67 76, 73 63 
           C 77 52, 77 38, 76 25 
           C 71 20, 60 18, 50 16 Z" 
        stroke="url(#nagarakshaGold)" 
        strokeWidth="4.5" 
        strokeLinejoin="round" 
        strokeLinecap="round"
        fill="rgba(15, 23, 42, 0.08)"
      />

      {/* Center Skyline Antenna / Spire */}
      <line 
        x1="50" 
        y1="19" 
        x2="50" 
        y2="28" 
        stroke="url(#nagarakshaGold)" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />

      {/* Leftmost Building 1 */}
      <path 
        d="M 33 67 L 33 46 L 37 42 L 37 67 Z" 
        fill="url(#nagarakshaBuilding)" 
      />

      {/* Building 2 (Mid-Left, faceted top) */}
      <path 
        d="M 39 67 L 39 37 L 45 32 L 45 67 Z" 
        fill="url(#nagarakshaBuilding)" 
      />

      {/* Building 3 (Center Tall Tower) */}
      <path 
        d="M 47 67 L 47 28 L 53 28 L 53 67 Z" 
        fill="url(#nagarakshaBuilding)" 
      />

      {/* Building 4 (Right Tower) */}
      <path 
        d="M 55 64 L 55 41 L 60 37 L 60 60 Z" 
        fill="url(#nagarakshaBuilding)" 
      />

      {/* Curved Highway / Base Road */}
      <path 
        d="M 27 65 
           C 36 61, 52 57, 65 59 
           C 55 64, 42 70, 35 74 
           C 30 71, 28 68, 27 65 Z" 
        fill="url(#nagarakshaGold)" 
      />

      {/* Green Tree / Leaf on Right */}
      <path 
        d="M 64 56 
           C 60 52, 60 44, 64 41 
           C 68 44, 68 52, 64 56 Z" 
        fill="#15803d" 
      />
      <line 
        x1="64" 
        y1="54" 
        x2="64" 
        y2="61" 
        stroke="#15803d" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
    </svg>
  )
}
