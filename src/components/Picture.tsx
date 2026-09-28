import clsx from "clsx";
import { SCENES, sceneUrl, type SceneId } from "./render/scenes";

const isScene = (id: string): id is SceneId => (SCENES as readonly string[]).includes(id);

/**
 * Renders a built-in visualisation (`render:<scene>`, pre-rendered WebP) or an uploaded photo.
 * Plain <img> keeps scrolling cheap on phones: the browser decodes it once and moves it on the GPU.
 */
export function Picture({ src, alt, className, priority }: { src?: string; alt: string; className?: string; priority?: boolean }) {
  const scene = src?.startsWith("render:") ? src.slice(7) : !src ? "a-dusk" : null;
  const imgClass = clsx("block h-full w-full object-cover", className);
  if (scene !== null) {
    const id: SceneId = isScene(scene) ? scene : "a-dusk";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sceneUrl(id)}
        srcSet={`${sceneUrl(id, "sm")} 960w, ${sceneUrl(id)} 1920w`}
        sizes="(max-width: 768px) 100vw, 60vw"
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className={imgClass}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" draggable={false} className={imgClass} />;
}
