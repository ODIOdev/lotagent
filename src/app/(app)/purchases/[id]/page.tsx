"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { MoneyInput } from "@/components/money-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { advancePurchaseStatus, nextPurchaseStatus, updatePurchase } from "@/lib/data/demo-store";
import { useAppState } from "@/lib/data/use-app-state";
import { calculateAcquisition } from "@/lib/calc/acquisition";
import { formatDate, money, pct, vehicleTitle } from "@/lib/format";
import { PURCHASE_STATUSES } from "@/lib/types";

export default function PurchaseDetailPage() {
  const params = useParams<{ id: string }>();
  const state = useAppState();
  const purchase = state.purchases.find((item) => item.id === params.id);
  const sheet = purchase ? state.worksheets.find((item) => item.id === purchase.worksheetId) : null;
  const history = state.purchaseHistory.filter((item) => item.purchaseId === params.id);

  if (!purchase || !sheet) {
    return <EmptyState title="Purchase not found" description="Return to the purchases list." action={<Button asChild><Link href="/purchases">Purchases</Link></Button>} />;
  }

  const projected = calculateAcquisition(sheet.costs, sheet.profitTargets);
  const actualProfit = purchase.actuals.soldPrice - purchase.actuals.totalCost;
  const actualRoi = purchase.actuals.totalCost > 0 && purchase.actuals.soldPrice > 0 ? (actualProfit / purchase.actuals.totalCost) * 100 : 0;
  const next = nextPurchaseStatus(purchase.status);

  const total =
    purchase.actuals.winningBid +
    purchase.actuals.auctionFees +
    purchase.actuals.transportation +
    purchase.actuals.repairs +
    purchase.actuals.reconditioning;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{vehicleTitle(sheet.vehicle)}</h1>
          <p className="text-sm capitalize text-muted-foreground">{purchase.status.replaceAll("_", " ")}</p>
        </div>
        {next ? (
          <Button
            onClick={() => {
              advancePurchaseStatus(purchase.id, next, `Moved to ${next.replaceAll("_", " ")}`);
              toast.success(`Status: ${next.replaceAll("_", " ")}`);
            }}
          >
            Advance to {next.replaceAll("_", " ")}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1">
        {PURCHASE_STATUSES.map((status) => (
          <span
            key={status}
            className={`rounded-md px-2 py-1 text-[11px] capitalize ${status === purchase.status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {status.replaceAll("_", " ")}
          </span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Actual costs</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <MoneyInput id="awb" label="Winning bid" value={purchase.actuals.winningBid} onChange={(winningBid) => updatePurchase({ ...purchase, actuals: { ...purchase.actuals, winningBid, totalCost: total - purchase.actuals.winningBid + winningBid } })} />
            <MoneyInput id="afees" label="Auction fees" value={purchase.actuals.auctionFees} onChange={(auctionFees) => updatePurchase({ ...purchase, actuals: { ...purchase.actuals, auctionFees } })} />
            <MoneyInput id="atr" label="Transportation" value={purchase.actuals.transportation} onChange={(transportation) => updatePurchase({ ...purchase, actuals: { ...purchase.actuals, transportation } })} />
            <MoneyInput id="arep" label="Repairs" value={purchase.actuals.repairs} onChange={(repairs) => updatePurchase({ ...purchase, actuals: { ...purchase.actuals, repairs } })} />
            <MoneyInput id="arec" label="Reconditioning" value={purchase.actuals.reconditioning} onChange={(reconditioning) => updatePurchase({ ...purchase, actuals: { ...purchase.actuals, reconditioning } })} />
            <MoneyInput id="list" label="Listed price" value={purchase.actuals.listedPrice} onChange={(listedPrice) => updatePurchase({ ...purchase, actuals: { ...purchase.actuals, listedPrice } })} />
            <MoneyInput id="sold" label="Sold price" value={purchase.actuals.soldPrice} onChange={(soldPrice) => updatePurchase({ ...purchase, actuals: { ...purchase.actuals, soldPrice } })} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Projected vs actual</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Projected landed" value={money(projected.landedCost)} />
            <Row label="Actual total cost" value={money(purchase.actuals.totalCost)} />
            <Row label="Projected profit" value={money(projected.projectedProfit)} />
            <Row label="Actual profit" value={purchase.actuals.soldPrice ? money(actualProfit) : "—"} />
            <Row label="Projected ROI" value={pct(projected.roiPercent)} />
            <Row label="Actual ROI" value={purchase.actuals.soldPrice ? pct(actualRoi) : "—"} />
            <Row label="Sale date" value={formatDate(purchase.actuals.saleDate)} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Status history</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {history.map((event) => (
            <p key={event.id}>
              <span className="capitalize font-medium">{event.status.replaceAll("_", " ")}</span>
              <span className="text-muted-foreground"> · {formatDate(event.at)} · {event.note}</span>
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-medium">{value}</span>
    </div>
  );
}
