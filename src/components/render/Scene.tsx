"use client";

import { motion, type MotionStyle } from "framer-motion";
import { useId, useMemo } from "react";
import { forest, hills, rng, sag, stars } from "./geometry";

/**
 * Procedural architectural visualisations used until real photos are uploaded.
 * Source for scripts/render-scenes.tsx only — the site shows the pre-rendered WebP files,
 * because live SVG with blur filters is far too heavy to scroll on phones.
 */
import { SCENES, type SceneId } from "./scenes";
export { SCENES, type SceneId };
type Mood = "dusk" | "night" | "winter";

interface Palette {
  sky: [string, string, string, string];
  glow: string;
  hill: string;
  far: string;
  mid: string;
  near: string;
  ground: [string, string];
  snow?: boolean;
}

const PALETTES: Record<Mood, Palette> = {
  dusk: {
    sky: ["#2b2d33", "#5a5450", "#a7896d", "#e8c9a0"],
    glow: "#f3d4a6",
    hill: "#6f655c",
    far: "#4f4842",
    mid: "#35302c",
    near: "#1c1a18",
    ground: ["#4a4038", "#221e1b"],
  },
  night: {
    sky: ["#0f1114", "#1b1d22", "#2c2b2d", "#4a423c"],
    glow: "#8a6f55",
    hill: "#2b2928",
    far: "#211f1e",
    mid: "#171615",
    near: "#0c0b0b",
    ground: ["#1e1b18", "#0d0c0b"],
  },
  winter: {
    sky: ["#55565b", "#8a8580", "#c3b09c", "#ecdcc6"],
    glow: "#f2dcbd",
    hill: "#9a928a",
    far: "#5f5a55",
    mid: "#403c38",
    near: "#23211e",
    ground: ["#ece7df", "#bdb5aa"],
    snow: true,
  },
};

const SCENE_DEF: Record<SceneId, { house: "a" | "b"; mood: Mood; kind: "exterior" | "tub" | "interior" }> = {
  "a-dusk": { house: "a", mood: "dusk", kind: "exterior" },
  "a-tub": { house: "a", mood: "dusk", kind: "tub" },
  "a-interior": { house: "a", mood: "dusk", kind: "interior" },
  "a-winter": { house: "a", mood: "winter", kind: "exterior" },
  "b-dusk": { house: "b", mood: "dusk", kind: "exterior" },
  "b-night": { house: "b", mood: "night", kind: "exterior" },
  "b-interior": { house: "b", mood: "night", kind: "interior" },
  "b-tub": { house: "b", mood: "night", kind: "tub" },
};

export interface SceneLayers {
  sky?: MotionStyle;
  far?: MotionStyle;
  mid?: MotionStyle;
  house?: MotionStyle;
  near?: MotionStyle;
}

export function Scene({ id, className, layers, title }: { id: SceneId; className?: string; layers?: SceneLayers; title?: string }) {
  const def = SCENE_DEF[id];
  const uidRaw = useId();
  const u = uidRaw.replace(/[^a-zA-Z0-9]/g, "");
  const pal = PALETTES[def.mood];
  return (
    <svg
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={title ?? "Архитектурная визуализация дома"}
    >
      <Defs u={u} pal={pal} />
      {def.kind === "interior" ? (
        <Interior u={u} pal={pal} variant={def.house} mood={def.mood} />
      ) : (
        <>
          <Backdrop u={u} pal={pal} mood={def.mood} layers={layers} tubScene={def.kind === "tub"} />
          {def.kind === "exterior" ? (
            <motion.g style={layers?.house}>
              {def.house === "a" ? <HouseA u={u} pal={pal} /> : <HouseB u={u} pal={pal} />}
            </motion.g>
          ) : (
            <TubCloseUp u={u} pal={pal} variant={def.house} />
          )}
          {def.kind === "exterior" && <NearTrees pal={pal} style={layers?.near} seed={def.house === "a" ? 7 : 19} />}
          {pal.snow && <Snowfall />}
        </>
      )}
      <rect width="1600" height="1000" fill={`url(#${u}-vig)`} pointerEvents="none" />
    </svg>
  );
}

function Defs({ u, pal }: { u: string; pal: Palette }) {
  return (
    <defs>
      <linearGradient id={`${u}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={pal.sky[0]} />
        <stop offset="0.38" stopColor={pal.sky[1]} />
        <stop offset="0.62" stopColor={pal.sky[2]} />
        <stop offset="0.74" stopColor={pal.sky[3]} />
      </linearGradient>
      <radialGradient id={`${u}-sun`} cx="0.68" cy="0.7" r="0.45">
        <stop offset="0" stopColor={pal.glow} stopOpacity="0.85" />
        <stop offset="1" stopColor={pal.glow} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${u}-haze`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={pal.sky[3]} stopOpacity="0" />
        <stop offset="0.6" stopColor={pal.sky[3]} stopOpacity="0.35" />
        <stop offset="1" stopColor={pal.sky[3]} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${u}-ground`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={pal.ground[0]} />
        <stop offset="1" stopColor={pal.ground[1]} />
      </linearGradient>
      <linearGradient id={`${u}-glass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9a468" />
        <stop offset="0.45" stopColor="#f5d7a4" />
        <stop offset="1" stopColor="#b7773f" />
      </linearGradient>
      <radialGradient id={`${u}-lamp`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff1d2" stopOpacity="0.95" />
        <stop offset="0.35" stopColor="#f7cf8e" stopOpacity="0.45" />
        <stop offset="1" stopColor="#f7cf8e" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${u}-spill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3c98b" stopOpacity="0.55" />
        <stop offset="1" stopColor="#f3c98b" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${u}-wood`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3f2b1f" />
        <stop offset="0.35" stopColor="#7c5a41" />
        <stop offset="0.6" stopColor="#8e6a4e" />
        <stop offset="1" stopColor="#3a281d" />
      </linearGradient>
      <radialGradient id={`${u}-water`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#f6dcab" />
        <stop offset="0.55" stopColor="#b98c5e" />
        <stop offset="1" stopColor="#4f3f33" />
      </radialGradient>
      <radialGradient id={`${u}-vig`} cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.38" />
      </radialGradient>
      <filter id={`${u}-blur`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter id={`${u}-soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>
  );
}

function Backdrop({ u, pal, mood, layers, tubScene }: { u: string; pal: Palette; mood: Mood; layers?: SceneLayers; tubScene?: boolean }) {
  const paths = useMemo(
    () => ({
      hill: hills(3, 690, 70),
      far: forest({ seed: 11, x0: -20, x1: 1640, base: 718, hMin: 50, hMax: 125, step: 16, jitter: 14 }),
      mid: forest({ seed: 23, x0: -40, x1: 1660, base: 770, hMin: 120, hMax: 280, step: 46, jitter: 20 }),
      stars: mood === "night" ? stars(5, 140, 520) : [],
    }),
    [mood],
  );
  const groundTop = tubScene ? 800 : 752;
  return (
    <g>
      <motion.g style={layers?.sky}>
        <rect width="1600" height="1000" fill={`url(#${u}-sky)`} />
        <rect width="1600" height="1000" fill={`url(#${u}-sun)`} />
        {paths.stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f4ead8" opacity={s.o} />
        ))}
        {mood === "night" && (
          <g>
            <circle cx="1240" cy="170" r="70" fill="#f1e6d0" opacity="0.12" filter={`url(#${u}-blur)`} />
            <circle cx="1240" cy="170" r="30" fill="#efe4cf" />
            <circle cx="1252" cy="162" r="28" fill={pal.sky[0]} opacity="0.9" />
          </g>
        )}
      </motion.g>
      <motion.g style={layers?.far}>
        <path d={paths.hill} fill={pal.hill} opacity="0.75" />
        <rect y="560" width="1600" height="200" fill={`url(#${u}-haze)`} />
        <path d={paths.far} fill={pal.far} />
        <rect y="640" width="1600" height="140" fill={`url(#${u}-haze)`} opacity="0.7" />
      </motion.g>
      <motion.g style={layers?.mid}>
        <path d={paths.mid} fill={pal.mid} />
        {pal.snow && <path d={paths.mid} fill="none" stroke="#e9e3da" strokeWidth="2" strokeDasharray="6 14" opacity="0.55" />}
        <path d={`M0,${groundTop} Q400,${groundTop - 18} 800,${groundTop - 6} T1600,${groundTop - 10} L1600,1000 L0,1000 Z`} fill={`url(#${u}-ground)`} />
      </motion.g>
    </g>
  );
}

function NearTrees({ pal, style, seed }: { pal: Palette; style?: MotionStyle; seed: number }) {
  const d = useMemo(() => {
    const r = rng(seed);
    const left = forest({ seed: seed + 1, x0: -160, x1: 60, base: 1010, hMin: 600, hMax: 860, step: 110 });
    const right = forest({ seed: seed + 2, x0: 1530 + r() * 30, x1: 1760, base: 1010, hMin: 600, hMax: 860, step: 110 });
    return `${left} ${right}`;
  }, [seed]);
  return (
    <motion.g style={style}>
      <path d={d} fill={pal.near} />
      {pal.snow && <path d={d} fill="none" stroke="#efe9e0" strokeWidth="3" strokeDasharray="10 22" opacity="0.6" />}
    </motion.g>
  );
}

function Snowfall() {
  const flakes = useMemo(() => stars(41, 160, 1000), []);
  return (
    <g opacity="0.85">
      {flakes.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={f.r * 1.3} fill="#fbf8f3" opacity={f.o * 0.8} />
      ))}
    </g>
  );
}

function Steam({ u, x, y, scale = 1 }: { u: string; x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} filter={`url(#${u}-blur)`} opacity="0.55">
      <path className="steam steam-1" d="M-30,0 C-50,-40 -10,-70 -30,-120 S-10,-190 -35,-240" stroke="#f8efe2" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.35" />
      <path className="steam steam-2" d="M10,0 C30,-50 -10,-80 15,-130 S40,-200 10,-260" stroke="#f8efe2" strokeWidth="20" fill="none" strokeLinecap="round" opacity="0.3" />
      <path className="steam steam-3" d="M40,-10 C60,-50 30,-90 50,-130 S70,-170 55,-210" stroke="#f8efe2" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.28" />
    </g>
  );
}

/** Wooden hot tub (чан) with warm underwater light and a wood-fired stove pipe. */
function Tub({ u, cx, cy, rx, h, steam = true }: { u: string; cx: number; cy: number; rx: number; h: number; steam?: boolean }) {
  const ry = rx * 0.26;
  const bx = rx * 0.94;
  const staves = Array.from({ length: 13 }, (_, i) => cx - bx + ((2 * bx) / 12) * i);
  return (
    <g>
      <ellipse cx={cx} cy={cy + h + 4} rx={rx * 1.25} ry={ry * 0.8} fill="#000" opacity="0.35" filter={`url(#${u}-soft)`} />
      <ellipse cx={cx} cy={cy + h + 4} rx={rx * 2.2} ry={ry * 1.4} fill="#f3c98b" opacity="0.08" />
      {/* stove pipe */}
      <rect x={cx + rx + rx * 0.08} y={cy - h * 1.3} width={rx * 0.1} height={h * 2.3} fill="#1b1918" />
      <rect x={cx + rx - rx * 0.02} y={cy + h * 0.35} width={rx * 0.3} height={h * 0.62} rx="3" fill="#201d1b" />
      <rect x={cx + rx + rx * 0.04} y={cy + h * 0.55} width={rx * 0.18} height={h * 0.2} rx="2" fill="#d98c4a" opacity="0.9" />
      <path
        d={`M${cx - rx},${cy} L${cx - bx},${cy + h} A${bx},${ry * 0.9} 0 0 0 ${cx + bx},${cy + h} L${cx + rx},${cy} Z`}
        fill={`url(#${u}-wood)`}
      />
      {staves.map((x, i) => (
        <line key={i} x1={x + (x - cx) * 0.06} y1={cy + ry * 0.6} x2={x} y2={cy + h + ry * 0.5 * Math.cos(((x - cx) / bx) * 1.4)} stroke="#2e2019" strokeWidth="1.2" opacity="0.55" />
      ))}
      {[0.28, 0.78].map((t) => (
        <path
          key={t}
          d={`M${cx - (rx - (rx - bx) * t)},${cy + h * t} A${rx - (rx - bx) * t},${ry * 0.95} 0 0 0 ${cx + (rx - (rx - bx) * t)},${cy + h * t}`}
          stroke="#1f1b18"
          strokeWidth={Math.max(2, rx * 0.035)}
          fill="none"
        />
      ))}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#6e4d37" stroke="#3a2a20" strokeWidth="2" />
      <ellipse cx={cx} cy={cy + ry * 0.08} rx={rx * 0.9} ry={ry * 0.74} fill={`url(#${u}-water)`} />
      <ellipse cx={cx - rx * 0.2} cy={cy - ry * 0.05} rx={rx * 0.35} ry={ry * 0.18} fill="#fff3da" opacity="0.35" filter={`url(#${u}-soft)`} />
      {steam && <Steam u={u} x={cx} y={cy - ry * 0.3} scale={rx / 90} />}
    </g>
  );
}

function StringLights({ u, x1, y1, x2, y2, drop, n }: { u: string; x1: number; y1: number; x2: number; y2: number; drop: number; n: number }) {
  const { d, pts } = sag(x1, y1, x2, y2, drop, n);
  return (
    <g>
      <path d={d} stroke="#1a1817" strokeWidth="1.5" fill="none" />
      {pts.slice(1, -1).map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y + 5} r="9" fill="#ffd89c" opacity="0.28" filter={`url(#${u}-soft)`} />
          <circle cx={p.x} cy={p.y + 5} r="2.6" fill="#fff0cf" />
        </g>
      ))}
    </g>
  );
}

function Lantern({ u, x, y, s = 1 }: { u: string; x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-26" r="34" fill="#f5cf93" opacity="0.18" filter={`url(#${u}-blur)`} />
      <rect x="-2" y="-22" width="4" height="22" fill="#1a1817" />
      <rect x="-6" y="-34" width="12" height="13" rx="2" fill="#ffe2ad" />
      <rect x="-7" y="-36" width="14" height="3" fill="#1a1817" />
    </g>
  );
}

/* ------------------------------ House A: barnhouse ------------------------------ */

function HouseA({ u, pal }: { u: string; pal: Palette }) {
  const clip = `${u}-a-glass`;
  const lerp = (x: number, a: number, b: number) => a + ((x - 300) / 260) * (b - a);
  const boards = Array.from({ length: 22 }, (_, i) => 306 + i * 11.8);
  const snow = pal.snow;
  return (
    <g transform="translate(610 800) scale(1.28)">
      {/* ground shadow + warm pool */}
      <ellipse cx="220" cy="46" rx="420" ry="40" fill="#000" opacity="0.28" filter={`url(#${u}-blur)`} />
      {/* side wall */}
      <polygon points="300,0 560,-36 560,-180 300,-190" fill="#2d2622" />
      {boards.map((x) => (
        <line key={x} x1={x} y1={lerp(x, 0, -36)} x2={x} y2={lerp(x, -190, -180)} stroke="#1c1815" strokeWidth="1.3" opacity="0.8" />
      ))}
      <polygon points="300,0 560,-36 560,-180 300,-190" fill={pal.glow} opacity="0.07" />
      {/* side window */}
      <polygon points={`370,${lerp(370, -52, -88)} 505,${lerp(505, -52, -88)} 505,${lerp(505, -118, -150)} 370,${lerp(370, -122, -152)}`} fill={`url(#${u}-glass)`} opacity="0.92" />
      <line x1="437" y1={lerp(437, -54, -90)} x2="437" y2={lerp(437, -120, -152)} stroke="#1c1815" strokeWidth="3" />
      {/* roof side plane */}
      <polygon points="150,-342 414,-310 580,-174 316,-188" fill={snow ? "#e9e4dc" : "#201e1d"} />
      <polygon points="150,-342 414,-310 580,-174 316,-188" fill="none" stroke="#141312" strokeWidth="2" />
      {!snow && [0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={150 + 166 * t} y1={-342 + 154 * t} x2={414 + 166 * t} y2={-310 + 136 * t} stroke="#2c2927" strokeWidth="1" />
      ))}
      {/* gable frame */}
      <polygon points="0,0 0,-190 150,-330 300,-190 300,0" fill="#2a2420" />
      <clipPath id={clip}>
        <polygon points="14,0 14,-184 150,-312 286,-184 286,0" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="-340" width="300" height="340" fill={`url(#${u}-glass)`} />
        <circle cx="150" cy="-110" r="170" fill={`url(#${u}-lamp)`} opacity="0.7" />
        {/* interior: mezzanine, stairs, sofa, pendant, shelves */}
        <rect x="0" y="-192" width="300" height="10" fill="#6d4a31" opacity="0.85" />
        <line x1="150" y1="-200" x2="286" y2="-200" stroke="#5b3d29" strokeWidth="2" opacity="0.7" />
        <polygon points="200,0 286,-182 286,-172 212,0" fill="#6a4630" opacity="0.8" />
        <rect x="40" y="-48" width="120" height="30" rx="6" fill="#8e6a53" />
        <rect x="40" y="-62" width="120" height="18" rx="6" fill="#a47e62" />
        <rect x="170" y="-34" width="40" height="16" rx="3" fill="#5b3d29" />
        <line x1="112" y1="-182" x2="112" y2="-128" stroke="#3d2a1d" strokeWidth="1.5" />
        <path d="M98,-128 L126,-128 L120,-116 L104,-116 Z" fill="#3d2a1d" />
        <circle cx="112" cy="-112" r="26" fill={`url(#${u}-lamp)`} />
        <rect x="24" y="-150" width="40" height="3" fill="#5b3d29" opacity="0.7" />
        <rect x="24" y="-120" width="40" height="3" fill="#5b3d29" opacity="0.7" />
        <rect x="0" y="-16" width="300" height="16" fill="#7d5539" opacity="0.8" />
        {/* reflection */}
        <polygon points="40,-330 90,-330 10,0 -40,0" fill="#fff" opacity="0.08" />
      </g>
      {/* mullions */}
      <g clipPath={`url(#${clip})`} stroke="#1b1714" strokeWidth="5">
        <line x1="82" y1="0" x2="82" y2="-340" />
        <line x1="150" y1="0" x2="150" y2="-340" />
        <line x1="218" y1="0" x2="218" y2="-340" />
        <line x1="0" y1="-186" x2="300" y2="-186" />
      </g>
      {/* gable roof edge */}
      <polyline points="-16,-176 150,-344 318,-188" fill="none" stroke={snow ? "#f1ece4" : "#151312"} strokeWidth="14" strokeLinejoin="miter" />
      {snow && <polyline points="-16,-184 150,-352 318,-196" fill="none" stroke="#fbf8f3" strokeWidth="6" />}
      <polygon points="-2,0 562,-36 562,-30 -2,8" fill="#171514" />
      {/* terrace */}
      <polygon points="-120,6 360,6 400,46 -160,46" fill={snow ? "#d8d0c4" : "#6c5443"} />
      {Array.from({ length: 5 }, (_, i) => 12 + i * 7.5).map((y) => (
        <line key={y} x1={-120 - (y - 6)} y1={y} x2={360 + (y - 6)} y2={y} stroke="#4c3a2e" strokeWidth="1" opacity="0.6" />
      ))}
      <polygon points="-160,46 400,46 400,56 -160,56" fill="#2e241d" />
      <polygon points="14,6 286,6 340,46 -40,46" fill={`url(#${u}-spill)`} />
      <polygon points="110,56 200,56 204,66 106,66" fill="#3a2e25" />
      {/* tub + lights */}
      <Tub u={u} cx={-230} cy={20} rx={62} h={48} />
      <line x1="-330" y1="-150" x2="-330" y2="60" stroke="#151312" strokeWidth="4" />
      <StringLights u={u} x1={-330} y1={-150} x2={-10} y2={-172} drop={46} n={12} />
      <Lantern u={u} x={-80} y={120} s={1.2} />
      <Lantern u={u} x={430} y={110} s={1.1} />
      <Lantern u={u} x={120} y={170} s={1.4} />
    </g>
  );
}

/* ------------------------------ House B: modern flat roof ------------------------------ */

function HouseB({ u, pal }: { u: string; pal: Palette }) {
  const clip = `${u}-b-glass`;
  const snow = pal.snow;
  return (
    <g transform="translate(470 800) scale(1.12)">
      <ellipse cx="320" cy="46" rx="520" ry="42" fill="#000" opacity="0.3" filter={`url(#${u}-blur)`} />
      {/* left side face */}
      <polygon points="0,0 -120,-26 -120,-170 0,-174" fill="#29241f" />
      {[-30, -60, -90].map((x) => (
        <line key={x} x1={x} y1={(x / 120) * 26} x2={x} y2={-174 + (x / -120) * 4} stroke="#1a1714" strokeWidth="1.2" />
      ))}
      {/* slats */}
      <rect x="0" y="-174" width="180" height="174" fill="#6d5039" />
      {Array.from({ length: 22 }, (_, i) => 4 + i * 8).map((x) => (
        <rect key={x} x={x} y="-174" width="3" height="174" fill="#3f2c1f" opacity="0.7" />
      ))}
      <rect x="0" y="-174" width="180" height="174" fill={pal.glow} opacity="0.08" />
      {/* glazing */}
      <clipPath id={clip}>
        <rect x="180" y="-172" width="320" height="172" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x="180" y="-180" width="320" height="180" fill={`url(#${u}-glass)`} />
        <circle cx="330" cy="-90" r="190" fill={`url(#${u}-lamp)`} opacity="0.6" />
        <rect x="180" y="-18" width="320" height="18" fill="#7a5238" opacity="0.8" />
        <rect x="200" y="-56" width="130" height="34" rx="7" fill="#8f6d56" />
        <rect x="200" y="-70" width="130" height="20" rx="7" fill="#a88468" />
        <rect x="380" y="-58" width="96" height="6" fill="#4f3624" />
        <rect x="388" y="-52" width="4" height="34" fill="#4f3624" />
        <rect x="464" y="-52" width="4" height="34" fill="#4f3624" />
        {[270, 300, 425].map((x) => (
          <g key={x}>
            <line x1={x} y1="-172" x2={x} y2="-118" stroke="#3d2a1d" strokeWidth="1.3" />
            <circle cx={x} cy="-112" r="7" fill="#fff0cc" />
            <circle cx={x} cy="-112" r="22" fill={`url(#${u}-lamp)`} />
          </g>
        ))}
        <path d="M486,-18 C476,-60 500,-80 488,-110 C506,-86 500,-50 494,-18 Z" fill="#4c5a45" opacity="0.8" />
        <polygon points="230,-172 270,-172 220,0 180,0" fill="#fff" opacity="0.08" />
      </g>
      <g stroke="#1b1714" strokeWidth="5">
        <line x1="260" y1="-172" x2="260" y2="0" />
        <line x1="340" y1="-172" x2="340" y2="0" />
        <line x1="420" y1="-172" x2="420" y2="0" />
        <rect x="180" y="-172" width="320" height="172" fill="none" strokeWidth="6" />
      </g>
      {/* charcoal panel */}
      <rect x="500" y="-174" width="130" height="174" fill="#2a2623" />
      <rect x="548" y="-150" width="32" height="118" fill={`url(#${u}-glass)`} />
      {/* roof slab */}
      <polygon points="-40,-196 -160,-190 -160,-176 -40,-174" fill={snow ? "#dcd6cd" : "#1b1917"} />
      <rect x="-40" y="-198" width="720" height="24" fill="#191715" />
      {snow && <rect x="-44" y="-206" width="728" height="10" rx="4" fill="#f6f2ec" />}
      {Array.from({ length: 9 }, (_, i) => 10 + i * 80).map((x) => (
        <circle key={x} cx={x} cy="-171" r="2.4" fill="#fff0cc" opacity="0.9" />
      ))}
      <rect x="-40" y="-174" width="720" height="3" fill="#c38c55" opacity="0.5" />
      {/* deck */}
      <polygon points="-70,4 700,4 744,46 -114,46" fill={snow ? "#d6cdc0" : "#6a5242"} />
      {Array.from({ length: 5 }, (_, i) => 10 + i * 7.5).map((y) => (
        <line key={y} x1={-70 - (y - 4)} y1={y} x2={700 + (y - 4)} y2={y} stroke="#4a392d" strokeWidth="1" opacity="0.6" />
      ))}
      <polygon points="-114,46 744,46 744,56 -114,56" fill="#2c231c" />
      <polygon points="180,4 500,4 560,46 130,46" fill={`url(#${u}-spill)`} />
      {/* lounge chairs */}
      {[20, 100].map((x) => (
        <g key={x} fill="#1e1a17">
          <path d={`M${x},30 L${x + 58},30 L${x + 62},20 L${x + 10},20 L${x - 6},-8 L${x - 12},-6 Z`} />
          <rect x={x + 2} y="30" width="3" height="10" />
          <rect x={x + 52} y="30" width="3" height="10" />
        </g>
      ))}
      <Tub u={u} cx={770} cy={24} rx={60} h={48} />
      <line x1="880" y1="-120" x2="880" y2="64" stroke="#151312" strokeWidth="4" />
      <StringLights u={u} x1={680} y1={-186} x2={880} y2={-120} drop={46} n={10} />
      <Lantern u={u} x={-60} y={120} s={1.2} />
      <Lantern u={u} x={560} y={140} s={1.3} />
    </g>
  );
}

/* ------------------------------ Tub close-up ------------------------------ */

function TubCloseUp({ u, pal, variant }: { u: string; pal: Palette; variant: "a" | "b" }) {
  const boards = Array.from({ length: 16 }, (_, i) => i);
  return (
    <g>
      {/* house corner with window */}
      <polygon points={variant === "a" ? "0,120 420,300 420,860 0,900" : "0,230 470,250 470,860 0,900"} fill="#2a2420" />
      {variant === "a"
        ? Array.from({ length: 18 }, (_, i) => 20 + i * 22).map((x) => (
            <line key={x} x1={x} y1={120 + (x / 420) * 180} x2={x} y2={900 - (x / 420) * 40} stroke="#1c1815" strokeWidth="2" opacity="0.8" />
          ))
        : Array.from({ length: 30 }, (_, i) => 4 + i * 8).map((x) => <rect key={x} x={x} y={240} width="3" height="620" fill="#3f2c1f" opacity="0.4" />)}
      <polygon points={variant === "a" ? "70,380 360,420 360,840 70,870" : "250,330 440,334 440,850 250,856"} fill={`url(#${u}-glass)`} />
      <polygon points={variant === "a" ? "70,380 360,420 360,840 70,870" : "250,330 440,334 440,850 250,856"} fill={`url(#${u}-lamp)`} opacity="0.5" />
      <line x1={variant === "a" ? 215 : 345} y1={variant === "a" ? 400 : 332} x2={variant === "a" ? 215 : 345} y2={variant === "a" ? 856 : 853} stroke="#1b1714" strokeWidth="7" />
      <polygon points={variant === "a" ? "-20,90 460,300 460,330 -20,130" : "-20,210 520,232 520,256 -20,240"} fill="#141211" />
      <polygon points="470,860 900,860 1100,1000 0,1000 0,900" fill={`url(#${u}-spill)`} opacity="0.5" />
      {/* deck in perspective */}
      <polygon points="0,840 1600,800 1600,1000 0,1000" fill={pal.snow ? "#d8d0c4" : "#5d4739"} />
      {boards.map((i) => (
        <line key={i} x1={-400 + i * 150} y1="1000" x2={300 + i * 90} y2={840 - i * 2.5} stroke="#3c2e24" strokeWidth="2" opacity="0.55" />
      ))}
      <polygon points="0,840 1600,800 1600,812 0,852" fill="#2c231c" opacity="0.6" />
      <Tub u={u} cx={1010} cy={640} rx={270} h={240} />
      {/* towel & bucket */}
      <path d="M770,676 C800,664 850,664 880,672 L876,748 C850,738 806,738 776,750 Z" fill="#e5dccd" />
      <path d="M770,676 C800,664 850,664 880,672" stroke="#cfc3b0" strokeWidth="3" fill="none" />
      <path d="M560,820 L640,820 L632,900 L568,900 Z" fill="#7c5a41" />
      <ellipse cx="600" cy="820" rx="40" ry="10" fill="#5a3f2e" />
      <path d="M572,818 Q600,760 628,818" stroke="#1d1a17" strokeWidth="3" fill="none" />
      <StringLights u={u} x1={-20} y1={80} x2={1620} y2={60} drop={150} n={22} />
      <Lantern u={u} x={1420} y={900} s={2.2} />
    </g>
  );
}

/* ------------------------------ Interior ------------------------------ */

function Interior({ u, pal, variant, mood }: { u: string; pal: Palette; variant: "a" | "b"; mood: Mood }) {
  const outside: "a-dusk" | "b-night" = variant === "a" ? "a-dusk" : "b-night";
  void mood;
  const winX = variant === "a" ? 400 : 330;
  const winW = variant === "a" ? 800 : 940;
  return (
    <g>
      <rect width="1600" height="1000" fill={variant === "a" ? "#5b4536" : "#3f352e"} />
      {/* ceiling */}
      {variant === "a" ? (
        <>
          <polygon points="0,0 800,0 800,110 0,420" fill="#7a5b43" />
          <polygon points="800,0 1600,0 1600,420 800,110" fill="#6b4f3a" />
          {Array.from({ length: 9 }, (_, i) => i).map((i) => (
            <line key={i} x1={i * 100} y1={420 - i * 38.7} x2={800} y2={110} stroke="#4d3829" strokeWidth="2" opacity="0.5" />
          ))}
          {Array.from({ length: 9 }, (_, i) => i).map((i) => (
            <line key={`r${i}`} x1={1600 - i * 100} y1={420 - i * 38.7} x2={800} y2={110} stroke="#4d3829" strokeWidth="2" opacity="0.5" />
          ))}
        </>
      ) : (
        <>
          <polygon points="0,0 1600,0 1400,150 200,150" fill="#d9cfc1" />
          <rect x="560" y="120" width="480" height="6" rx="3" fill="#fff4dc" />
          <rect x="520" y="110" width="560" height="30" fill={`url(#${u}-lamp)`} opacity="0.6" />
        </>
      )}
      {/* back wall + window */}
      <rect x="0" y={variant === "a" ? 110 : 150} width="1600" height="600" fill="none" />
      <svg x={winX} y={variant === "a" ? 230 : 210} width={winW} height={variant === "a" ? 480 : 500} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <Scene id={outside} />
      </svg>
      <rect x={winX} y={variant === "a" ? 230 : 210} width={winW} height={variant === "a" ? 480 : 500} fill="#1a1612" opacity="0.15" />
      <g stroke="#1b1714" strokeWidth="10" fill="none">
        <rect x={winX} y={variant === "a" ? 230 : 210} width={winW} height={variant === "a" ? 480 : 500} />
        {(variant === "a" ? [1, 2, 3] : [1, 2, 3, 4]).map((i, _, arr) => (
          <line key={i} x1={winX + (winW / (arr.length + 1)) * i} y1={variant === "a" ? 230 : 210} x2={winX + (winW / (arr.length + 1)) * i} y2={variant === "a" ? 710 : 710} />
        ))}
      </g>
      {/* floor */}
      <polygon points="0,700 1600,700 1600,1000 0,1000" fill={variant === "a" ? "#8b6a4f" : "#7a634f"} />
      {Array.from({ length: 22 }, (_, i) => i).map((i) => (
        <line key={i} x1={800 + (i - 11) * 40} y1="700" x2={800 + (i - 11) * 170} y2="1000" stroke="#5f4735" strokeWidth="1.5" opacity="0.5" />
      ))}
      <rect y="700" width="1600" height="300" fill={`url(#${u}-spill)`} opacity="0.35" />
      {/* rug */}
      <polygon points="430,800 1170,800 1320,960 280,960" fill="#d6c8b3" />
      <polygon points="430,800 1170,800 1320,960 280,960" fill="none" stroke="#bfae95" strokeWidth="3" />
      {/* stove or shelf */}
      {variant === "a" ? (
        <g>
          <rect x="175" y="0" width="22" height="560" fill="#1c1a19" />
          <rect x="130" y="560" width="112" height="190" rx="10" fill="#1f1d1c" />
          <rect x="150" y="610" width="72" height="70" rx="6" fill="#e39a55" />
          <rect x="150" y="610" width="72" height="70" rx="6" fill={`url(#${u}-lamp)`} />
          <circle cx="186" cy="660" r="140" fill="#f0a35e" opacity="0.12" filter={`url(#${u}-blur)`} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={40 + (i % 2) * 20} y={720 + i * 14} width="70" height="12" rx="6" fill="#6f4f38" />
          ))}
        </g>
      ) : (
        <g>
          <rect x="60" y="260" width="200" height="490" fill="#2a2420" />
          {[330, 440, 550, 660].map((y) => (
            <rect key={y} x="60" y={y} width="200" height="8" fill="#6b4c36" />
          ))}
          {[[80, 440, 70], [104, 440, 62], [124, 440, 78], [190, 440, 55], [90, 550, 66], [150, 550, 80], [172, 550, 60], [110, 660, 72], [210, 660, 64], [84, 330, 50]].map(([x, shelf, h], i) => (
            <rect key={i} x={x} y={shelf - h} width={i % 3 === 0 ? 22 : 16} height={h} fill={["#b39c80", "#7c6552", "#d6c6ae", "#8d735d"][i % 4]} />
          ))}
          <line x1="1400" y1="760" x2="1400" y2="420" stroke="#1e1b18" strokeWidth="5" />
          <path d="M1360,420 L1440,420 L1425,380 L1375,380 Z" fill="#e9dcc6" />
          <circle cx="1400" cy="420" r="120" fill={`url(#${u}-lamp)`} />
        </g>
      )}
      {/* pendant */}
      <line x1="800" y1={variant === "a" ? 110 : 140} x2="800" y2="440" stroke="#1b1714" strokeWidth="2" />
      <path d="M760,440 L840,440 L826,470 L774,470 Z" fill="#1f1b18" />
      <circle cx="800" cy="480" r="160" fill={`url(#${u}-lamp)`} opacity="0.8" />
      {/* sofa */}
      <g>
        <rect x="360" y="760" width="880" height="120" rx="26" fill="#b7a58c" />
        <rect x="380" y="820" width="840" height="90" rx="22" fill="#cdbca4" />
        <rect x="330" y="790" width="80" height="140" rx="24" fill="#a8957b" />
        <rect x="1190" y="790" width="80" height="140" rx="24" fill="#a8957b" />
        <rect x="430" y="778" width="140" height="70" rx="18" fill="#8d7560" />
        <rect x="1030" y="778" width="140" height="70" rx="18" fill="#e6dbc9" />
        <rect x="360" y="930" width="880" height="12" fill="#2d241d" opacity="0.4" />
      </g>
      {/* table */}
      <ellipse cx="800" cy="962" rx="170" ry="30" fill="#3a2a1f" />
      <ellipse cx="800" cy="955" rx="170" ry="28" fill="#5a3f2e" />
      <rect x="760" y="930" width="30" height="20" rx="4" fill="#efe6d6" />
      {/* plant */}
      <g>
        <path d="M1440,1000 L1460,860 L1540,860 L1560,1000 Z" fill="#cbbba4" />
        {[[-40, -170], [-10, -220], [30, -190], [50, -140], [-60, -120]].map(([dx, dy], i) => (
          <path key={i} d={`M1500,860 Q${1500 + dx * 0.5},${860 + dy * 0.6} ${1500 + dx},${860 + dy} Q${1500 + dx * 0.2},${860 + dy * 0.4} 1500,860`} fill={i % 2 ? "#4f5b47" : "#5f6b55"} />
        ))}
      </g>
      <rect width="1600" height="1000" fill={pal.glow} opacity="0.06" />
    </g>
  );
}
