import type { DecisionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<DecisionStatus, string> = {
  BUY: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CAUTION: "bg-amber-100 text-amber-800 border-amber-200",
  PASS: "bg-red-100 text-red-800 border-red-200",
};

export function StatusBadge({
  status,
  className,
}: {
  status: DecisionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide",
        STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
