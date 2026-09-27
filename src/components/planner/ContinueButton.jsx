import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";

export function ContinueButton({ enabled }) {
  const className = buttonStyles({ className: "w-full sm:w-56" });

  if (!enabled) {
    return (
      <button type="button" disabled className={className}>
        Continue <ArrowRight className="size-4" />
      </button>
    );
  }

  return (
    <Link href="/adus/user-information" className={className}>
      Continue <ArrowRight className="size-4" />
    </Link>
  );
}
