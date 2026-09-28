/**
 * Rasterises the procedural house scenes into WebP images:
 *   npx tsx scripts/render-scenes.tsx
 * Output: public/renders/<id>.webp (1920px) and <id>-sm.webp (960px).
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { Scene } from "../src/components/render/Scene";
import { SCENES } from "../src/components/render/scenes";

const out = path.join(process.cwd(), "public", "renders");
mkdirSync(out, { recursive: true });

async function main() {
  for (const id of SCENES) {
  const svg = renderToStaticMarkup(React.createElement(Scene, { id })).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200" ');
  const png = sharp(Buffer.from(svg), { density: 96 }).resize(1920, 1200);
  await png.clone().webp({ quality: 82 }).toFile(path.join(out, `${id}.webp`));
  await png.clone().resize(960, 600).webp({ quality: 80 }).toFile(path.join(out, `${id}-sm.webp`));
  console.log("rendered", id);
  }
}

main();
