/** Deterministic helpers for the procedural architectural renders. */

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Layered spruce silhouette with a short trunk. */
export function pine(x: number, y: number, h: number, w: number, tiers = 6) {
  const right: string[] = [];
  const left: string[] = [];
  for (let i = 1; i <= tiers; i++) {
    const ty = y - h + h * 0.86 * (i / tiers);
    const hw = (w / 2) * (0.2 + 0.8 * (i / tiers));
    right.push(`${(x + hw).toFixed(1)},${ty.toFixed(1)}`);
    if (i < tiers) right.push(`${(x + hw * 0.4).toFixed(1)},${(ty - h * 0.018).toFixed(1)}`);
    left.unshift(`${(x - hw).toFixed(1)},${ty.toFixed(1)}`);
    if (i < tiers) left.unshift(`${(x - hw * 0.4).toFixed(1)},${(ty - h * 0.018).toFixed(1)}`);
  }
  const tw = Math.max(1.5, w * 0.035);
  const tt = y - h * 0.14;
  return `M${x},${y - h} L${right.join(" L")} L${x + tw},${tt} L${x + tw},${y} L${x - tw},${y} L${x - tw},${tt} L${left.join(" L")} Z`;
}

/** A row of pines along a baseline; returns one combined path. */
export function forest(opts: { seed: number; x0: number; x1: number; base: number; hMin: number; hMax: number; step: number; jitter?: number }) {
  const r = rng(opts.seed);
  const parts: string[] = [];
  for (let x = opts.x0; x < opts.x1; x += opts.step * (0.55 + r() * 0.8)) {
    const h = opts.hMin + r() * (opts.hMax - opts.hMin);
    const y = opts.base + (r() - 0.5) * (opts.jitter ?? 10);
    parts.push(pine(x, y, h, h * (0.3 + r() * 0.12)));
  }
  return parts.join(" ");
}

/** Soft rolling hill line closed to the bottom of the canvas. */
export function hills(seed: number, base: number, amp: number, width = 1600, height = 1000) {
  const r = rng(seed);
  let d = `M0,${height} L0,${base}`;
  const n = 7;
  for (let i = 1; i <= n; i++) {
    const x = (width / n) * i;
    const y = base - r() * amp;
    const cx = x - width / n / 2;
    d += ` Q${cx},${y - amp * 0.6} ${x},${y}`;
  }
  return `${d} L${width},${height} Z`;
}

export function stars(seed: number, count: number, maxY: number) {
  const r = rng(seed);
  return Array.from({ length: count }, () => ({ x: r() * 1600, y: r() * maxY, r: 0.6 + r() * 1.4, o: 0.35 + r() * 0.6 }));
}

/** Points on a quadratic sag between two anchors, for string lights. */
export function sag(x1: number, y1: number, x2: number, y2: number, drop: number, n: number) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + drop;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    pts.push({ x, y });
  }
  return { d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, pts };
}
