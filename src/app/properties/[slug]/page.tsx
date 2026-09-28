import type { Metadata } from "next";
import { PropertyDetail } from "@/components/site/PropertyDetail";
import { createSeed } from "@/lib/seed";

/** Pre-rendered for the static build; houses added later in the admin panel are served via not-found.tsx. */
export function generateStaticParams() {
  return createSeed().properties.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = createSeed().properties.find((x) => x.slug === slug);
  return {
    title: p ? `${p.name} — ${p.tagline}` : "Дом",
    description: p?.description.slice(0, 160),
    openGraph: { title: p ? `${p.name} · «Атмосфера»` : "«Атмосфера»", description: p?.tagline },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PropertyDetail slug={slug} />;
}
