/** Built-in visualisations, pre-rendered to /public/renders/<id>.webp by `npm run render:scenes`. */
export const SCENES = ["a-dusk", "a-tub", "a-interior", "a-winter", "b-dusk", "b-night", "b-interior", "b-tub"] as const;
export type SceneId = (typeof SCENES)[number];

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const sceneUrl = (id: SceneId, size: "lg" | "sm" = "lg") => `${base}/renders/${id}${size === "sm" ? "-sm" : ""}.webp`;
