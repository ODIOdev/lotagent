"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { worksheetMetrics, capitalCommitted, purchasesThisMonth, watchlistSheets } from "@/lib/data/metrics";
import { useAppState } from "@/lib/data/use-app-state";
import { formatDate, money, pct, vehicleTitle } from "@/lib/format";

export default function DashboardPage() {
  const state = useAppState();
  const watched = watchlistSheets(state);
  const committed = capitalCommitted(state);
  const remaining = state.settings.acquisitionBudget - committed;
  const withMetrics = state.worksheets.map((sheet) => ({ sheet, ...worksheetMetrics(sheet, state) }));
  const avgProfit =
    withMetrics.reduce((sum, item) => sum + item.result.projectedProfit, 0) / Math.max(1, withMetrics.length);
  const avgRoi =
    withMetrics.reduce((sum, item) => sum + item.result.roiPercent, 0) / Math.max(1, withMetrics.length);
  const avgDays =
    withMetrics.reduce((sum, item) => sum + item.sheet.profitTargets.estimatedDaysToSell, 0) /
    Math.max(1, withMetrics.length);
  const pendingTransport = state.transports.filter((item) => item.pickupStatus !== "delivered").length;
  const attention = withMetrics.filter(
    (item) =>
      item.decision.status === "PASS" ||
      item.decision.elevatedRisk ||
      item.sheet.status === "live",
  );
  const recent = [...state.worksheets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  const spend = [
    { name: "Week 1", spend: 16400, projected: 2100, actual: 0 },
    { name: "Week 2", spend: 23800, projected: 2800, actual: 1900 },
    { name: "Week 3", spend: 0, projected: 3175, actual: 0 },
    { name: "Week 4", spend: committed, projected: avgProfit, actual: 640 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Acquisition dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {state.dealership.name} · {state.profile.fullName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/acquisitions/new">New acquisition</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/live-bid">Open Live Bid Mode</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Available budget" value={money(remaining)} hint={`Line ${money(state.settings.acquisitionBudget)}`} />
        <MetricCard label="Capital committed" value={money(committed)} hint="Open purchases not yet sold" />
        <MetricCard label="Vehicles watched" value={String(watched.length)} hint="Active auction targets" />
        <MetricCard label="Purchased this month" value={String(purchasesThisMonth(state))} hint="Won units converted to purchases" />
        <MetricCard label="Avg projected profit" value={money(avgProfit)} />
        <MetricCard label="Avg projected ROI" value={pct(avgRoi)} />
        <MetricCard label="Avg days-to-sell" value={`${Math.round(avgDays)} days`} />
        <MetricCard label="Transportation pending" value={String(pendingTransport)} hint="Pickups not delivered" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Acquisition spending</CardTitle>
            <CardDescription>Demo weekly spend versus open capital</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="spend" fill="#1565ff" name="Spend" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Projected vs actual profit</CardTitle>
            <CardDescription>Worksheet projections against booked results</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="projected" fill="#1565ff" name="Projected" radius={4} />
                <Bar dataKey="actual" fill="#15803d" name="Actual" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="shadow-sm xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent worksheets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((sheet) => {
              const { result, decision } = worksheetMetrics(sheet, state);
              return (
                <Link key={sheet.id} href={`/acquisitions/${sheet.id}`} className="block rounded-lg border p-3 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{vehicleTitle(sheet.vehicle)}</p>
                      <p className="text-xs text-muted-foreground">
                        {sheet.vehicle.auctionName} · {formatDate(sheet.vehicle.auctionDate)}
                      </p>
                    </div>
                    <StatusBadge status={decision.status} />
                  </div>
                  <p className="mt-2 tabular text-sm">
                    Max bid {money(result.maxSafeBid)} · ROI {pct(result.roiPercent)}
                  </p>
                </Link>
              );
            })}
          </CardContent>
        </Card>
        <Card className="shadow-sm xl:col-span-1">
          <CardHeader>
            <CardTitle>Watchlist opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {watched.slice(0, 5).map((sheet) => {
              const { result, decision } = worksheetMetrics(sheet, state);
              return (
                <Link key={sheet.id} href={`/live-bid/${sheet.id}`} className="block rounded-lg border p-3 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{vehicleTitle(sheet.vehicle)}</p>
                    <StatusBadge status={decision.status} />
                  </div>
                  <p className="mt-1 tabular text-sm text-muted-foreground">
                    Room {money(result.remainingBidRoom)} · {pct(result.roiPercent)} ROI
                  </p>
                </Link>
              );
            })}
          </CardContent>
        </Card>
        <Card className="shadow-sm xl:col-span-1">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attention.slice(0, 5).map(({ sheet, decision, result }) => (
              <Link key={sheet.id} href={`/acquisitions/${sheet.id}`} className="block rounded-lg border p-3 hover:bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{vehicleTitle(sheet.vehicle)}</p>
                  <StatusBadge status={decision.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{decision.reasons[0]}</p>
                <p className="tabular text-xs text-muted-foreground">Bid {money(sheet.costs.currentBid)} / max {money(result.maxSafeBid)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
