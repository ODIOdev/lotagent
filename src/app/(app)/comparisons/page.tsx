"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { worksheetMetrics } from "@/lib/data/metrics";
import { useAppState } from "@/lib/data/use-app-state";
import { miles, money, pct, vehicleTitle } from "@/lib/format";
import { cn } from "@/lib/utils";

const METRICS = [
  { key: "currentBid", label: "Current bid", format: money },
  { key: "maxBid", label: "Max safe bid", format: money },
  { key: "landed", label: "Landed cost", format: money },
  { key: "wholesale", label: "Wholesale", format: money },
  { key: "retail", label: "Retail", format: money },
  { key: "profit", label: "Projected profit", format: money },
  { key: "roi", label: "ROI", format: pct },
  { key: "mileage", label: "Mileage", format: miles },
  { key: "condition", label: "Condition", format: (n: number) => `${n}/10` },
  { key: "risk", label: "Risk", format: (n: number) => String(n) },
  { key: "transport", label: "Transportation", format: money },
  { key: "days", label: "Days to sell", format: (n: number) => `${n}d` },
  { key: "score", label: "Opportunity score", format: (n: number) => n.toFixed(1) },
] as const;

export default function ComparisonsPage() {
  const state = useAppState();
  const items = useMemo(() => {
    const ids = state.comparisons[0]?.worksheetIds ?? [];
    return ids
      .map((id) => state.worksheets.find((item) => item.id === id))
      .filter(Boolean)
      .map((sheet) => {
        const metrics = worksheetMetrics(sheet!, state);
        return {
          sheet: sheet!,
          decision: metrics.decision,
          values: {
            currentBid: sheet!.costs.currentBid,
            maxBid: metrics.result.maxSafeBid,
            landed: metrics.result.landedCost,
            wholesale: sheet!.values.wholesale,
            retail: sheet!.values.retail,
            profit: metrics.result.projectedProfit,
            roi: metrics.result.roiPercent,
            mileage: sheet!.vehicle.mileage,
            condition: sheet!.vehicle.conditionScore,
            risk: metrics.decision.riskScore,
            transport: sheet!.costs.transportation,
            days: sheet!.profitTargets.estimatedDaysToSell,
            score: metrics.opportunity.total,
          },
          explanation: metrics.opportunity.explanation,
        };
      });
  }, [state]);

  if (items.length < 2) {
    return (
      <EmptyState
        title="Select 2–4 vehicles to compare"
        description="Use the checkboxes on Watchlist, then click Compare selected."
        action={<Button asChild><Link href="/watchlist">Open watchlist</Link></Button>}
      />
    );
  }

  function best(key: keyof (typeof items)[number]["values"]) {
    const invert = key === "risk" || key === "mileage" || key === "days" || key === "currentBid" || key === "landed" || key === "transport";
    const numbers = items.map((item) => item.values[key]);
    return invert ? Math.min(...numbers) : Math.max(...numbers);
  }

  const winner = items.reduce((lead, item) => (item.values.score > lead.values.score ? item : lead));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Vehicle comparison</h1>
        <p className="text-sm text-muted-foreground">{items[0]?.explanation}</p>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left">Metric</th>
              {items.map((item) => (
                <th key={item.sheet.id} className="px-3 py-2 text-left">
                  <Link href={`/acquisitions/${item.sheet.id}`} className="hover:underline">
                    {vehicleTitle(item.sheet.vehicle)}
                  </Link>
                  <div className="mt-1"><StatusBadge status={item.decision.status} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => {
              const top = best(metric.key);
              return (
                <tr key={metric.key} className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">{metric.label}</td>
                  {items.map((item) => {
                    const value = item.values[metric.key];
                    const isBest = value === top;
                    return (
                      <td
                        key={item.sheet.id}
                        className={cn("tabular px-3 py-2", isBest && "bg-emerald-50 font-semibold")}
                      >
                        {metric.format(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        Highest opportunity score: <strong>{vehicleTitle(winner.sheet.vehicle)}</strong> at {winner.values.score.toFixed(1)}.
        That ranking is not based on retail price alone.
      </p>
    </div>
  );
}
