"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { guestsLabel, plural } from "@/lib/dates";
import type { Property } from "@/lib/types";
import { Picture } from "../Picture";
import { Icon } from "../ui/Icon";
import { ImageReveal } from "./Reveal";

export const coverOf = (p: Property) => p.images.find((i) => i.isCover) ?? p.images[0];

export function PropertyCard({ property, index }: { property: Property; index: number }) {
  const cover = coverOf(property);
  const hasTub = property.amenityIds.includes("am-tub");
  const hasTerrace = property.amenityIds.includes("am-terrace");
  return (
    <motion.article whileHover="hover" className="group">
      <Link href={`/properties/${property.slug}`} className="block" aria-label={`${property.name} — подробнее`}>
        <div className="relative [perspective:1200px]">
          <motion.div
            variants={{ hover: { rotateX: 2, rotateY: index % 2 ? -2 : 2, y: -6 } }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="overflow-hidden rounded-[28px] shadow-soft transition-shadow duration-500 group-hover:shadow-lift"
          >
            <ImageReveal className="aspect-[4/5] sm:aspect-[5/4]" delay={index * 0.12}>
              <motion.div variants={{ hover: { scale: 1.04 } }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="h-full w-full">
                <Picture src={cover?.src} alt={cover?.alt ?? property.name} />
              </motion.div>
            </ImageReveal>
          </motion.div>
          <span className="absolute left-5 top-5 rounded-full bg-ivory/90 px-3 py-1 font-serif text-[15px]">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="mt-6 flex items-start justify-between gap-6">
          <div>
            <h3 className="font-serif text-[34px] leading-none">{property.name}</h3>
            <p className="mt-2 text-[14px] text-taupe">{property.tagline}</p>
          </div>
          <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-graphite/15 transition-all duration-500 group-hover:bg-graphite group-hover:text-ivory">
            <Icon name="arrow" className="h-4 w-4" />
          </span>
        </div>
        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-umber">
          <li className="flex items-center gap-1.5"><Icon name="users" className="h-4 w-4 text-taupe" />{guestsLabel(property.capacity)}</li>
          <li className="flex items-center gap-1.5"><Icon name="bed" className="h-4 w-4 text-taupe" />{property.bedrooms} {plural(property.bedrooms, "спальня", "спальни", "спален")}</li>
          {hasTub && <li className="flex items-center gap-1.5"><Icon name="tub" className="h-4 w-4 text-taupe" />Чан</li>}
          {hasTerrace && <li className="flex items-center gap-1.5"><Icon name="terrace" className="h-4 w-4 text-taupe" />Терраса</li>}
          <li className="flex items-center gap-1.5"><Icon name="area" className="h-4 w-4 text-taupe" />{property.area} м²</li>
        </ul>
        <p className="mt-4 line-clamp-2 max-w-lg text-[15px] leading-relaxed text-umber/80">{property.description}</p>
        <span className="mt-5 inline-block border-b border-graphite/30 pb-1 text-[13px] font-medium tracking-wide">Подробнее</span>
      </Link>
    </motion.article>
  );
}
