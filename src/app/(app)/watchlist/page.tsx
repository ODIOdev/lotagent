"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { VehicleThumb } from "@/components/vehicle-thumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setComparison, toggleWatchlist } from "@/lib/data/demo-store";
import { worksheetMetrics, watchlistSheets } from "@/lib/data/metrics";
import { useAppState } from "@/lib/data/use-app-state";
import { formatDateTime, money, pct, vehicleTitle } from "@/lib/format";
import type { DecisionStatus } from "@/lib/types";
import { toast } from "sonner";

export default function WatchlistPage() {
  const state = useAppState();
  const [view, setView] = useState<"table" | "cards">("table");
  const [tab, setTab] = useState<"all" | DecisionStatus>("all");
  const [query, setQuery] = useState("");
  const [auction, setAuction] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return watchlistSheets(state)
      .map((sheet) => ({ sheet, ...worksheetMetrics(sheet, state) }))
      .filter((item) => {
        if (tab !== "all" && item.decision.status !== tab) return false;
        if (auction !== "all" && item.sheet.vehicle.auctionKey !== auction) return false;
        if (!q) return true;
        const blob = `${vehicleTitle(item.sheet.vehicle)} ${item.sheet.vehicle.auctionName} ${item.sheet.assignedBuyer}`.toLowerCase();
        return blob.includes(q);
      });
  }, [state, tab, query, auction]);

  function toggleSelect(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length >= 4 ? current : [...current, id],
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Watchlist</h1>
          <p className="text-sm text-muted-foreground">Auction units you are tracking before the gavel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>
            Table
          </Button>
          <Button variant={view === "cards" ? "default" : "outline"} onClick={() => setView("cards")}>
            Cards
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setComparison(selected);
              toast.success("Comparison set updated.");
            }}
            disabled={selected.length < 2}
          >
            Compare selected ({selected.length}/4)
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <Input placeholder="Search vehicle, auction, buyer" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={auction} onValueChange={setAuction}>
          <SelectTrigger className="md:w-56"><SelectValue placeholder="Auction" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All auctions</SelectItem>
            {state.feeSchedules.map((item) => (
              <SelectItem key={item.id} value={item.auctionKey}>{item.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="BUY">BUY</TabsTrigger>
          <TabsTrigger value="CAUTION">CAUTION</TabsTrigger>
          <TabsTrigger value="PASS">PASS</TabsTrigger>
        </TabsList>
      </Tabs>

      {rows.length === 0 ? (
        <EmptyState
          title="Watchlist is empty"
          description="Save a worksheet and add it to the watchlist."
          action={<Button asChild><Link href="/acquisitions/new">New acquisition</Link></Button>}
        />
      ) : view === "cards" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ sheet, result, decision }) => (
            <div key={sheet.id} className="rounded-xl border bg-card p-3 shadow-sm">
              <VehicleThumb vehicle={sheet.vehicle} className="mb-3" />
              <div className="flex items-start justify-between gap-2">
                <Link href={`/acquisitions/${sheet.id}`} className="font-medium hover:underline">
                  {vehicleTitle(sheet.vehicle)}
                </Link>
                <StatusBadge status={decision.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{sheet.vehicle.auctionName} · {formatDateTime(sheet.vehicle.auctionDate)}</p>
              <p className="mt-2 tabular text-sm">Bid {money(sheet.costs.currentBid)} · max {money(result.maxSafeBid)}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" asChild><Link href={`/live-bid/${sheet.id}`}>Live bid</Link></Button>
                <Button size="sm" variant="outline" onClick={() => toggleSelect(sheet.id)}>
                  {selected.includes(sheet.id) ? "Selected" : "Select"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["", "Vehicle", "Auction", "When", "Bid", "Max", "Room", "Wholesale", "Retail", "Profit", "ROI", "Risk", "Status", "Buyer", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ sheet, result, decision }) => (
                <tr key={sheet.id} className="border-t">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.includes(sheet.id)} onChange={() => toggleSelect(sheet.id)} />
                  </td>
                  <td className="px-3 py-2 font-medium">{vehicleTitle(sheet.vehicle)}</td>
                  <td className="px-3 py-2">{sheet.vehicle.auctionName}</td>
                  <td className="px-3 py-2">{formatDateTime(sheet.vehicle.auctionDate)}</td>
                  <td className="tabular px-3 py-2">{money(sheet.costs.currentBid)}</td>
                  <td className="tabular px-3 py-2">{money(result.maxSafeBid)}</td>
                  <td className="tabular px-3 py-2">{money(result.remainingBidRoom)}</td>
                  <td className="tabular px-3 py-2">{money(sheet.values.wholesale)}</td>
                  <td className="tabular px-3 py-2">{money(sheet.values.retail)}</td>
                  <td className="tabular px-3 py-2">{money(result.projectedProfit)}</td>
                  <td className="tabular px-3 py-2">{pct(result.roiPercent)}</td>
                  <td className="px-3 py-2">{decision.riskScore}</td>
                  <td className="px-3 py-2"><StatusBadge status={decision.status} /></td>
                  <td className="px-3 py-2">{sheet.assignedBuyer}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" asChild><Link href={`/live-bid/${sheet.id}`}>Bid</Link></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleWatchlist(sheet.id)}>Remove</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
