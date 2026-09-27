import Image from "next/image";
import { Check } from "lucide-react";
import { formatBedsBaths, getAduArea } from "@/data/aduCatalog";

export function AduSummary({ adu, address, rotation }) {
  return (
    <aside className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="relative aspect-[4/3] w-full bg-surface">
        <Image src={adu.photo} alt={adu.name} fill sizes="(min-width: 1024px) 360px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-ink">{adu.name}</h2>
          <p className="text-sm text-muted">
            {formatBedsBaths(adu)} · {adu.widthFt} × {adu.depthFt} ft · {getAduArea(adu)} sq ft
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {adu.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-ink">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="rounded-xl bg-surface p-3 text-sm">
          <p className="font-medium text-ink">Placement</p>
          <p className="text-muted">
            Fits inside the lot at {address}, rotated {rotation}°.
          </p>
        </div>
      </div>
    </aside>
  );
}
