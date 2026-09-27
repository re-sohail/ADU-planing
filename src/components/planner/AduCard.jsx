import Image from "next/image";
import clsx from "clsx";
import { Check } from "lucide-react";
import { formatBedsBaths, getAduArea } from "@/data/aduCatalog";

export function AduCard({ adu, selected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(adu.id)}
      className={clsx(
        "group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        selected ? "border-brand ring-2 ring-brand" : "border-line hover:border-slate-300 hover:shadow-md"
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-surface">
        <Image
          src={adu.photo}
          alt={adu.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        {selected && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white">
            <Check className="size-3.5" /> Selected
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-base font-semibold text-ink">{adu.name}</h3>
        <p className="text-sm text-muted">{formatBedsBaths(adu)}</p>
        <p className="text-sm text-muted">
          {adu.widthFt} × {adu.depthFt} ft · {getAduArea(adu)} sq ft
        </p>
      </div>
    </button>
  );
}
