"use client";

import Link from "next/link";
import { LiveBidScreen } from "@/components/live-bid/live-bid-screen";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { worksheetMetrics, watchlistSheets } from "@/lib/data/metrics";
import { useAppState } from "@/lib/data/use-app-state";
import { money, vehicleTitle } from "@/lib/format";

export default function LiveBidIndexPage() {
  const state = useAppState();
  const live = state.worksheets.find((item) => item.status === "live");
  const options = watchlistSheets(state);

  if (live) return <LiveBidScreen id={live.id} />;
  if (options.length === 0) {
    return (
      <EmptyState
        title="Nothing in the lane"
        description="Add a vehicle to the watchlist, then open Live Bid Mode from the worksheet."
        action={
          <Button asChild>
            <Link href="/acquisitions/new">New acquisition</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Live Bid Mode</h1>
        <p className="text-sm text-muted-foreground">Pick a unit. Calculations update instantly as the bid moves.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((sheet) => {
          const { result, decision } = worksheetMetrics(sheet, state);
          return (
            <Link key={sheet.id} href={`/live-bid/${sheet.id}`} className="rounded-xl border bg-card p-4 shadow-sm hover:border-primary">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{vehicleTitle(sheet.vehicle)}</p>
                <StatusBadge status={decision.status} />
              </div>
              <p className="mt-2 tabular text-sm text-muted-foreground">
                Bid {money(sheet.costs.currentBid)} · max {money(result.maxSafeBid)} · room {money(result.remainingBidRoom)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
