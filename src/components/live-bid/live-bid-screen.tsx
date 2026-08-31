"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DecisionBanner } from "@/components/decision-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markWon, setWorksheetStatus, upsertWorksheet } from "@/lib/data/demo-store";
import { worksheetMetrics } from "@/lib/data/metrics";
import { useAppState } from "@/lib/data/use-app-state";
import { money, miles, pct, vehicleTitle } from "@/lib/format";
import { moneyNum } from "@/lib/calc/money";
import { cn } from "@/lib/utils";

const INCREMENTS = [100, 250, 500, 1000];

export function LiveBidScreen({ id }: { id?: string }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const state = useAppState();
  const worksheetId = id ?? params.id;
  const sheet = state.worksheets.find((item) => item.id === worksheetId) ?? state.worksheets.find((item) => item.status === "live") ?? state.worksheets[0];
  const [fullscreen, setFullscreen] = useState(false);
  const [custom, setCustom] = useState(750);

  useEffect(() => {
    if (!worksheetId && sheet) router.replace(`/live-bid/${sheet.id}`);
  }, [worksheetId, sheet, router]);

  if (!sheet) {
    return <p className="text-sm text-muted-foreground">No worksheets yet. Create an acquisition first.</p>;
  }

  const { result, decision } = worksheetMetrics(sheet, state);

  function bump(amount: number) {
    upsertWorksheet({
      ...sheet,
      costs: {
        ...sheet.costs,
        currentBid: moneyNum(sheet.costs.currentBid) + amount,
        expectedWinningBid: moneyNum(sheet.costs.currentBid) + amount,
      },
      status: "live",
    });
  }

  function setBid(value: number) {
    upsertWorksheet({
      ...sheet,
      costs: { ...sheet.costs, currentBid: moneyNum(value), expectedWinningBid: moneyNum(value) },
      status: "live",
    });
  }

  const tone =
    decision.status === "BUY"
      ? "bg-emerald-600"
      : decision.status === "CAUTION"
        ? "bg-amber-500"
        : "bg-red-600";

  return (
    <div className={cn("mx-auto max-w-5xl space-y-4", fullscreen && "fixed inset-0 z-50 overflow-y-auto bg-background p-4")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">LIVE BID</p>
          <h1 className="text-xl font-semibold">{vehicleTitle(sheet.vehicle)}</h1>
          <p className="text-sm text-muted-foreground">
            {miles(sheet.vehicle.mileage)} · {sheet.vehicle.auctionName} · Lot {sheet.vehicle.stockNumber}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setFullscreen((value) => !value)}>
            {fullscreen ? "Exit full screen" : "Full screen"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/acquisitions/${sheet.id}`}>Worksheet</Link>
          </Button>
        </div>
      </div>

      <div className="sticky top-0 z-20 grid gap-2 rounded-xl border bg-card p-3 shadow-sm sm:grid-cols-3">
        <BigStat label="Current bid" value={money(sheet.costs.currentBid)} />
        <BigStat label="Max safe bid" value={money(result.maxSafeBid)} />
        <div className={cn("flex flex-col justify-center rounded-lg px-3 py-2 text-white", tone)}>
          <p className="text-xs uppercase tracking-wide text-white/80">Decision</p>
          <p className="text-3xl font-semibold">{decision.status}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Remaining room" value={money(result.remainingBidRoom)} />
        <Mini label="Wholesale" value={money(sheet.values.wholesale)} />
        <Mini label="Retail" value={money(sheet.values.retail)} />
        <Mini label="Landed cost" value={money(result.landedCost)} />
        <Mini label="Projected profit" value={money(result.projectedProfit)} />
        <Mini label="Projected ROI" value={pct(result.roiPercent)} />
        <Mini label="Risk score" value={`${decision.riskScore}/100`} />
        <Mini label="Condition" value={`${sheet.vehicle.conditionScore}/10`} />
      </div>

      <DecisionBanner decision={decision} />

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="mb-2 text-sm font-medium">Current bid</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="tabular h-11 max-w-48 text-lg"
            value={sheet.costs.currentBid}
            onChange={(event) => setBid(moneyNum(event.target.value))}
          />
          {INCREMENTS.map((amount) => (
            <Button key={amount} type="button" variant="outline" onClick={() => bump(amount)}>
              +${amount.toLocaleString()}
            </Button>
          ))}
          <div className="flex items-center gap-2">
            <Input
              className="tabular h-9 w-24"
              value={custom}
              onChange={(event) => setCustom(moneyNum(event.target.value))}
            />
            <Button type="button" variant="outline" onClick={() => bump(custom)}>
              + custom
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              upsertWorksheet(sheet);
              toast.success("Bid update saved.");
            }}
          >
            Save bid update
          </Button>
          <Button
            type="button"
            onClick={() => {
              markWon(sheet.id);
              toast.success("Marked as won and converted to a purchase.");
              router.push("/purchases");
            }}
          >
            Mark as won
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setWorksheetStatus(sheet.id, "lost");
              toast.message("Marked as lost.");
            }}
          >
            Mark as lost
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setWorksheetStatus(sheet.id, "passed");
              toast.message("Passed on this unit.");
            }}
          >
            Pass
          </Button>
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="tabular text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular text-lg font-semibold">{value}</p>
    </div>
  );
}
