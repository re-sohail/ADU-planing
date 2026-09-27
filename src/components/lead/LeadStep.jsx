"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { usePlanner } from "@/context/PlannerContext";
import { useAduCatalog } from "@/hooks/useAduCatalog";
import { useStepGuard } from "@/hooks/useStepGuard";
import { PLACEMENT_STATUS } from "@/lib/geo/placement";
import { AduSummary } from "./AduSummary";
import { LeadForm } from "./LeadForm";

export function LeadStep() {
  const { location, aduId, placement, placementStatus, submitted } = usePlanner();
  const isAllowed = useStepGuard(Boolean(aduId && placement) && placementStatus === PLACEMENT_STATUS.OK && !submitted);
  const { adus, error } = useAduCatalog();
  const adu = adus?.find((item) => item.id === aduId);

  if (!isAllowed) return null;
  if (error) return <p className="text-sm text-danger">{error}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <LeadForm aduId={aduId} placement={placement} defaultAddress={location?.address} />
      {adu ? (
        <AduSummary adu={adu} address={location?.address} rotation={placement.rotation} />
      ) : (
        <Skeleton className="h-[480px] rounded-2xl" />
      )}
    </div>
  );
}
