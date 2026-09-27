"use client";

import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { usePlanner } from "@/context/PlannerContext";
import { useStepGuard } from "@/hooks/useStepGuard";

export function SuccessStep() {
  const { submitted, reset } = usePlanner();
  const isAllowed = useStepGuard(submitted);

  if (!isAllowed) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
      <span className="flex size-14 items-center justify-center rounded-full bg-success/10">
        <CalendarCheck className="size-7 text-success" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold text-ink">Your consultation is booked</h1>
      <p className="text-sm text-muted">
        Thanks for reaching out. Our team will contact you before the appointment to review your lot and ADU
        placement.
      </p>
      <Link href="/adus" onClick={reset} className={buttonStyles({ variant: "secondary", className: "mt-2" })}>
        Plan another property
      </Link>
    </div>
  );
}
