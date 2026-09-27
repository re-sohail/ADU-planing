"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlanner } from "@/context/PlannerContext";

export function useStepGuard(isAllowed) {
  const router = useRouter();
  const { hydrated } = usePlanner();

  useEffect(() => {
    if (hydrated && !isAllowed) router.replace("/adus");
  }, [hydrated, isAllowed, router]);

  return hydrated && isAllowed;
}
