import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Watchlist Cinematic Aperture / Iris Logo
 * Modern, vibrant, and minimalist: 6 geometric aperture blades on a rich
 * indigo-to-violet gradient squircle with a crisp center focal point.
 */
export function LogoIcon({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Vibrant Brand Chassis Gradient */}
        <linearGradient id="lensRingGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        {/* Primary Crisp Blade */}
        <linearGradient id="favBladeA" x1="0" y1="-17" x2="14" y2="-2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.8" />
        </linearGradient>

        {/* Alternate Depth Blade */}
        <linearGradient id="favBladeB" x1="0" y1="-17" x2="14" y2="-2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.7" />
        </linearGradient>

        {/* Ambient Outer Glow */}
        <filter id="lensGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Vibrant Gradient App Icon Chassis */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="url(#lensRingGrad)"
        filter="url(#lensGlow)"
      />

      {/* Aperture 6 Blades Assembly */}
      <g transform="translate(24, 24)">
        {/* Blade 1 (0 deg) */}
        <path
          d="M 0 -17 A 17 17 0 0 1 14.72 -8.5 L 3.5 -2 Z"
          fill="url(#favBladeA)"
          stroke="#312e81"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {/* Blade 2 (60 deg) */}
        <g transform="rotate(60)">
          <path
            d="M 0 -17 A 17 17 0 0 1 14.72 -8.5 L 3.5 -2 Z"
            fill="url(#favBladeB)"
            stroke="#312e81"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </g>
        {/* Blade 3 (120 deg) */}
        <g transform="rotate(120)">
          <path
            d="M 0 -17 A 17 17 0 0 1 14.72 -8.5 L 3.5 -2 Z"
            fill="url(#favBladeA)"
            stroke="#312e81"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </g>
        {/* Blade 4 (180 deg) */}
        <g transform="rotate(180)">
          <path
            d="M 0 -17 A 17 17 0 0 1 14.72 -8.5 L 3.5 -2 Z"
            fill="url(#favBladeB)"
            stroke="#312e81"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </g>
        {/* Blade 5 (240 deg) */}
        <g transform="rotate(240)">
          <path
            d="M 0 -17 A 17 17 0 0 1 14.72 -8.5 L 3.5 -2 Z"
            fill="url(#favBladeA)"
            stroke="#312e81"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </g>
        {/* Blade 6 (300 deg) */}
        <g transform="rotate(300)">
          <path
            d="M 0 -17 A 17 17 0 0 1 14.72 -8.5 L 3.5 -2 Z"
            fill="url(#favBladeB)"
            stroke="#312e81"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </g>

        {/* Center Focal Opening & Crisp White Dot */}
        <circle cx="0" cy="0" r="4.2" fill="#1e1b4b" />
        <circle cx="0" cy="0" r="2.2" fill="#ffffff" />
      </g>
    </svg>
  );
}

export function Logo({ size = 36, showText = true, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative flex-shrink-0 transition-transform duration-300 hover:scale-105">
        <LogoIcon size={size} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-white text-lg leading-none">
              Watch<span className="text-indigo-400">list</span>
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 tracking-wide font-medium hidden sm:block mt-0.5">
            Personal Cinema & Series Tracker
          </p>
        </div>
      )}
    </div>
  );
}
