"use client";

import { useEffect, useState } from "react";
import { PropertyDetail } from "@/components/site/PropertyDetail";
import { SiteShell } from "@/components/site/SiteShell";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  const [slug, setSlug] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    // Static hosting: a house created in the admin panel has no pre-built page, so resolve it here.
    const m = window.location.pathname.match(/\/properties\/([^/]+)\/?$/);
    setSlug(m ? decodeURIComponent(m[1]) : null);
  }, []);
  if (slug === undefined) return null;
  if (slug) return <PropertyDetail slug={slug} />;
  return (
    <SiteShell>
      <div className="container-x py-32 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-serif text-5xl">Страница не найдена</h1>
        <ButtonLink href="/" className="mt-8">На главную</ButtonLink>
      </div>
    </SiteShell>
  );
}
