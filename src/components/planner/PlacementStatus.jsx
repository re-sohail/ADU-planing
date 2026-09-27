import clsx from "clsx";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { PLACEMENT_STATUS, SETBACK_FT } from "@/lib/geo/placement";

const CONTENT = {
  [PLACEMENT_STATUS.OK]: {
    icon: CircleCheck,
    title: "Fits your lot",
    tone: "text-success",
    detail: (distance) => `${distance} ft from the nearest lot line.`,
  },
  [PLACEMENT_STATUS.SETBACK]: {
    icon: TriangleAlert,
    title: "Too close to the lot line",
    tone: "text-warning",
    detail: (distance) => `Keep at least ${SETBACK_FT} ft from side and rear lot lines. Currently ${distance} ft.`,
  },
  [PLACEMENT_STATUS.OUTSIDE]: {
    icon: CircleX,
    title: "Outside your lot",
    tone: "text-danger",
    detail: () => "Move the ADU fully inside the white lot line.",
  },
};

export function PlacementStatus({ result, rotation }) {
  const content = CONTENT[result.status];
  const Icon = content.icon;
  const distance = result.distanceFt === null ? null : result.distanceFt.toFixed(1);

  return (
    <div
      aria-live="polite"
      className="absolute right-3 bottom-3 left-3 z-[1000] flex items-start gap-3 rounded-xl border border-line bg-white/95 p-3 shadow-md backdrop-blur sm:right-auto sm:max-w-sm"
    >
      <Icon className={clsx("mt-0.5 size-5 shrink-0", content.tone)} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{content.title}</p>
        <p className="text-xs text-muted">{content.detail(distance)}</p>
        <p className="mt-1 text-xs text-muted">Rotation {rotation}°</p>
      </div>
    </div>
  );
}
