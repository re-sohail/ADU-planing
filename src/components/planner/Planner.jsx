"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { Loader2, MapPinned } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePlanner } from "@/context/PlannerContext";
import { useAduCatalog } from "@/hooks/useAduCatalog";
import { useParcel } from "@/hooks/useParcel";
import { createInitialPlacement, evaluatePlacement } from "@/lib/geo/placement";
import { PLACEMENT_STATUS } from "@/lib/geo/placement";
import { AduPicker } from "./AduPicker";
import { ContinueButton } from "./ContinueButton";

const PlannerMap = dynamic(() => import("./PlannerMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

function MapMessage({ icon: Icon, spin = false, children }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface p-6 text-center">
      <Icon className={clsx("size-8 text-muted", spin && "animate-spin")} aria-hidden="true" />
      <p className="max-w-sm text-sm text-muted">{children}</p>
    </div>
  );
}

export function Planner() {
  const { location, aduId, placement, placementStatus, selectAdu, updatePlacement } = usePlanner();
  const { adus, error: catalogError } = useAduCatalog();
  const { parcel, loading, error: parcelError } = useParcel(location);
  const mapSection = useRef(null);
  const selectedAdu = adus?.find((adu) => adu.id === aduId) ?? null;

  useEffect(() => {
    if (!parcel || !selectedAdu || placement) return;
    const initial = createInitialPlacement(parcel.geometry);
    updatePlacement(initial, evaluatePlacement(initial, selectedAdu, parcel.geometry).status);
  }, [parcel, selectedAdu, placement, updatePlacement]);

  function handleSelectAdu(id) {
    selectAdu(id);
    mapSection.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderMap() {
    if (!location) {
      return <MapMessage icon={MapPinned}>Search your property address above to see your lot.</MapMessage>;
    }
    if (loading) {
      return <MapMessage icon={Loader2} spin>Finding your lot…</MapMessage>;
    }
    if (parcelError) {
      return <MapMessage icon={MapPinned}>{parcelError}. Try another address.</MapMessage>;
    }
    return (
      <PlannerMap
        key={`${location.lat},${location.lng}`}
        parcel={parcel}
        adu={selectedAdu}
        placement={placement}
        onCommit={updatePlacement}
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Find the perfect spot for your ADU</h1>
          <p className="text-sm text-muted">
            Drag the home to where you picture it, turn it with the round handle, and keep it inside the yellow
            dashed line so there&apos;s room between you and your neighbors.
          </p>
        </div>

        <div
          ref={mapSection}
          className="h-[60vh] min-h-[420px] overflow-hidden rounded-2xl border border-line bg-white shadow-sm lg:h-[640px]"
        >
          {renderMap()}
        </div>
      </section>

      <AduPicker adus={adus} error={catalogError} selectedId={aduId} onSelect={handleSelectAdu} />

      <div className="flex justify-end border-t border-line pt-6">
        <ContinueButton enabled={Boolean(selectedAdu) && placementStatus === PLACEMENT_STATUS.OK} />
      </div>
    </div>
  );
}
