export function AdminLoginIllustration() {
  return (
    <svg
      viewBox="0 0 400 520"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7b27a" />
          <stop offset="55%" stopColor="#e89a8a" />
          <stop offset="100%" stopColor="#a47bbe" />
        </linearGradient>
        <linearGradient id="mountainBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6bb8" />
          <stop offset="100%" stopColor="#5b3a8a" />
        </linearGradient>
        <linearGradient id="mountainMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b4a96" />
          <stop offset="100%" stopColor="#3d2670" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffe5c4" />
          <stop offset="100%" stopColor="#fcc89a" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="400" height="520" fill="url(#sky)" />

      <circle cx="305" cy="120" r="36" fill="url(#sun)" />

      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="70" cy="78" rx="38" ry="9" />
        <ellipse cx="100" cy="68" rx="22" ry="6" />
        <ellipse cx="345" cy="58" rx="28" ry="7" />
        <ellipse cx="200" cy="42" rx="32" ry="5" />
      </g>

      <path
        d="M0 270 L55 215 L115 250 L175 200 L240 240 L295 210 L360 235 L400 218 L400 320 L0 320 Z"
        fill="url(#mountainBack)"
        opacity="0.85"
      />

      <path
        d="M0 310 L60 270 L130 295 L200 255 L270 285 L335 265 L400 285 L400 360 L0 360 Z"
        fill="url(#mountainMid)"
      />

      <g stroke="#d8c4ec" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M-20 360 Q120 340 260 360 T440 358" opacity="0.9" />
        <path d="M-20 378 Q140 358 280 378 T440 376" opacity="0.85" />
      </g>
      <path
        d="M-20 360 Q120 340 260 360 T440 358 L440 380 Q280 360 140 380 T-20 378 Z"
        fill="#b89cd9"
        opacity="0.55"
      />

      <g stroke="#c7b1e0" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M-20 400 Q110 378 250 402 T440 396" opacity="0.9" />
        <path d="M-20 422 Q130 400 270 424 T440 418" opacity="0.85" />
      </g>
      <path
        d="M-20 400 Q110 378 250 402 T440 396 L440 426 Q270 404 130 428 T-20 422 Z"
        fill="#a48bc9"
        opacity="0.6"
      />

      <g stroke="#b89cd9" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M-20 450 Q100 425 240 452 T440 444" opacity="0.9" />
        <path d="M-20 476 Q120 450 260 478 T440 470" opacity="0.85" />
      </g>
      <path
        d="M-20 450 Q100 425 240 452 T440 444 L440 480 Q260 454 120 482 T-20 476 Z"
        fill="#8d70b6"
        opacity="0.7"
      />

      <g stroke="#a48bc9" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M-20 505 Q90 478 230 508 T440 498" opacity="0.95" />
      </g>
      <path
        d="M-20 505 Q90 478 230 508 T440 498 L440 520 L-20 520 Z"
        fill="#704f9c"
        opacity="0.85"
      />

      <g fill="#2e1d5a" opacity="0.9">
        <path d="M30 470 Q42 450 54 470 L54 520 L30 520 Z" />
        <path d="M345 455 Q358 432 372 455 L372 520 L345 520 Z" />
      </g>
    </svg>
  );
}
