import type { DecisionResult } from "@/lib/calc/decision";
import { cn } from "@/lib/utils";

const TONE: Record<DecisionResult["status"], string> = {
  BUY: "border-emerald-200 bg-emerald-50 text-emerald-950",
  CAUTION: "border-amber-200 bg-amber-50 text-amber-950",
  PASS: "border-red-200 bg-red-50 text-red-950",
};

export function DecisionBanner({
  decision,
  compact,
}: {
  decision: DecisionResult;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border p-3", TONE[decision.status])}>
      <p className={cn("font-semibold tracking-wide", compact ? "text-lg" : "text-2xl")}>
        {decision.status}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {decision.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}
