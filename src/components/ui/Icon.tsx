const PATHS: Record<string, React.ReactNode> = {
  tub: (
    <>
      <path d="M4 11h16l-1.2 7.2A2 2 0 0 1 16.8 20H7.2a2 2 0 0 1-2-1.8L4 11Z" />
      <path d="M3 11h18M8 11v9M12 11v9M16 11v9" />
      <path d="M9 7c0-1 1-1.5 1-2.5M13 7c0-1 1-1.5 1-2.5" />
    </>
  ),
  terrace: (
    <>
      <path d="M3 20h18M5 20v-6h14v6M3 14h18M7 14V8l5-4 5 4v6" />
    </>
  ),
  grill: (
    <>
      <path d="M5 9h14a7 7 0 0 1-14 0Z" />
      <path d="M8 16l-2 5M16 16l2 5M12 16v5M9 5c0-1 1-1 1-2M14 5c0-1 1-1 1-2" />
    </>
  ),
  parking: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" />
    </>
  ),
  wifi: (
    <>
      <path d="M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9 16.5a4 4 0 0 1 6 0" />
      <circle cx="12" cy="19.5" r=".8" fill="currentColor" />
    </>
  ),
  kitchen: (
    <>
      <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1-3 4-3 7h3" />
    </>
  ),
  linen: (
    <>
      <path d="M3 18V8M21 18v-5H3M3 13h18M6 13v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
    </>
  ),
  towels: (
    <>
      <path d="M6 4h12v16H6zM6 8h12M9 4v4" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  ac: (
    <>
      <rect x="3" y="5" width="18" height="8" rx="2" />
      <path d="M7 10h10M8 16l-1 3M12 16v3M16 16l1 3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 0 1 0 6M18 14c2 .6 3 2.8 3 6" />
    </>
  ),
  bed: (
    <>
      <path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-8v6" />
      <circle cx="6.5" cy="11" r="1.8" />
    </>
  ),
  bath: (
    <>
      <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2" />
    </>
  ),
  area: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M4 9h5V4M15 20v-5h5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  telegram: <path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15ZM9 13l9-6-7 8" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  home: <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4h8l10 10-8 8L3 12Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2ZM10 21h4" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 5 5 9-10" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  building: <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m3 18 6-5 4 3 3-2 5 4" />
    </>
  ),
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  star: <path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9L12 3Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />,
  tree: <path d="M12 3 6 11h3l-4 6h14l-4-6h3l-6-8ZM12 17v4" />,
};

export function Icon({ name, className = "h-5 w-5", strokeWidth = 1.4 }: { name: string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name] ?? PATHS.star}
    </svg>
  );
}

export const AMENITY_ICONS = ["tub", "terrace", "grill", "parking", "wifi", "kitchen", "linen", "towels", "tv", "ac", "tree", "moon", "star", "bath"];
