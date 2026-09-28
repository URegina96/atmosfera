import type { Amenity } from "@/lib/types";
import { Icon } from "../ui/Icon";

export function AmenityItem({ amenity }: { amenity: Amenity }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-graphite/10 bg-white/50 px-4 py-3.5 text-[14px]">
      <Icon name={amenity.icon} className="h-5 w-5 text-clay" />
      {amenity.name}
    </li>
  );
}
