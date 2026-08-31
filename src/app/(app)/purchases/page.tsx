"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/lib/data/use-app-state";
import { money, pct, vehicleTitle } from "@/lib/format";
import { PURCHASE_STATUSES } from "@/lib/types";
import { calculateAcquisition } from "@/lib/calc/acquisition";

export default function PurchasesPage() {
  const state = useAppState();
  if (state.purchases.length === 0) {
    return (
      <EmptyState
        title="No purchases yet"
        description="Mark a live bid as won to convert the worksheet into a purchase record."
        action={<Button asChild><Link href="/live-bid">Open Live Bid</Link></Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Purchases</h1>
        <p className="text-sm text-muted-foreground">Post-auction tracking from won through sold.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Vehicle", "Status", "Actual cost", "Listed", "Sold", "Actual profit", "Actual ROI", "Vs projected", ""].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.purchases.map((purchase) => {
              const sheet = state.worksheets.find((item) => item.id === purchase.worksheetId);
              const projected = sheet ? calculateAcquisition(sheet.costs, sheet.profitTargets).projectedProfit : 0;
              const actualProfit =
                purchase.actuals.soldPrice > 0 ? purchase.actuals.soldPrice - purchase.actuals.totalCost : 0;
              const actualRoi =
                purchase.actuals.totalCost > 0 && purchase.actuals.soldPrice > 0
                  ? (actualProfit / purchase.actuals.totalCost) * 100
                  : 0;
              return (
                <tr key={purchase.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{sheet ? vehicleTitle(sheet.vehicle) : purchase.worksheetId}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className="capitalize">
                      {purchase.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="tabular px-3 py-2">{money(purchase.actuals.totalCost)}</td>
                  <td className="tabular px-3 py-2">{money(purchase.actuals.listedPrice)}</td>
                  <td className="tabular px-3 py-2">{purchase.actuals.soldPrice ? money(purchase.actuals.soldPrice) : "—"}</td>
                  <td className="tabular px-3 py-2">{purchase.actuals.soldPrice ? money(actualProfit) : "—"}</td>
                  <td className="tabular px-3 py-2">{purchase.actuals.soldPrice ? pct(actualRoi) : "—"}</td>
                  <td className="tabular px-3 py-2">{money(actualProfit - projected)}</td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/purchases/${purchase.id}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Pipeline: {PURCHASE_STATUSES.map((item) => item.replaceAll("_", " ")).join(" → ")}
      </p>
    </div>
  );
}
