"use client";

import clsx from "clsx";
import { Scene, SCENES, type SceneId } from "./render/Scene";

/** Renders either a built-in visualisation (`render:<scene>`) or an uploaded photo. */
export function Picture({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (src?.startsWith("render:")) {
    const id = src.slice(7) as SceneId;
    if ((SCENES as readonly string[]).includes(id)) return <Scene id={id} title={alt} className={clsx("block h-full w-full", className)} />;
  }
  if (!src) return <Scene id="a-dusk" title={alt} className={clsx("block h-full w-full", className)} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={clsx("block h-full w-full object-cover", className)} />;
}
