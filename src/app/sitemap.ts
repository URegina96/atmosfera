export const dynamic = "force-static";

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return ["", "/properties", "/properties/dom-1", "/properties/dom-2", "/booking", "/rules", "/contacts"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}
