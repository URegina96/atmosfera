/**
 * Stylised map: shows the approximate location (Ufa + ~20 km) without revealing the exact address.
 * When the owner enables `showExactAddress`, an embedded map widget can replace it.
 */
export function LocationMap() {
  return (
    <svg viewBox="0 0 800 560" className="h-full w-full" role="img" aria-label="Схема: Уфа и дом «Атмосфера» примерно в 20 км от города">
      <rect width="800" height="560" fill="#EFE8DC" />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M${-50 + i * 70},560 C${i * 70 + 40},${380 - (i % 3) * 30} ${i * 70 - 20},${200 + (i % 4) * 20} ${i * 70 + 60},0`} stroke="#E3D7C4" strokeWidth="1" fill="none" />
      ))}
      <path d="M-20,120 C120,160 180,90 300,150 S470,300 560,260 S720,210 820,280" stroke="#CDBBA1" strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M-20,120 C120,160 180,90 300,150 S470,300 560,260 S720,210 820,280" stroke="#DCCDB6" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M0,420 L260,300 L420,330 L800,190" stroke="#fff" strokeWidth="6" fill="none" opacity="0.9" />
      <path d="M180,0 L230,250 L200,560" stroke="#fff" strokeWidth="4" fill="none" opacity="0.8" />
      <g>
        <ellipse cx="250" cy="300" rx="120" ry="80" fill="#D9CAB3" opacity="0.8" />
        {Array.from({ length: 30 }, (_, i) => (
          <rect key={i} x={170 + (i % 6) * 26} y={250 + Math.floor(i / 6) * 20} width="16" height="10" rx="2" fill="#C9B79C" opacity="0.7" />
        ))}
        <text x="250" y="400" textAnchor="middle" fontFamily="var(--font-serif)" fontSize="30" fill="#5A4636">Уфа</text>
      </g>
      <path d="M340,300 C420,300 470,260 590,210" stroke="#7A624C" strokeWidth="2.5" strokeDasharray="6 8" fill="none" />
      <text x="455" y="238" fontFamily="var(--font-sans)" fontSize="15" fill="#7A624C" transform="rotate(-18 455 238)">≈ 20 км</text>
      {[[610, 120], [650, 150], [700, 110], [560, 140], [740, 160], [620, 300], [680, 330], [720, 290]].map(([x, y], i) => (
        <path key={i} d={`M${x},${y - 18} L${x + 9},${y} L${x - 9},${y} Z`} fill="#9A8B78" opacity="0.6" />
      ))}
      <circle cx="600" cy="205" r="42" fill="#7A624C" opacity="0.12" />
      <circle cx="600" cy="205" r="22" fill="#7A624C" opacity="0.2" />
      <circle cx="600" cy="205" r="9" fill="#2B2926" />
      <text x="620" y="190" fontFamily="var(--font-sans)" fontSize="14" letterSpacing="3" fill="#2B2926">АТМОСФЕРА</text>
    </svg>
  );
}
