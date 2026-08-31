"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateAcquisition } from "@/lib/calc/acquisition";
import { downloadCsv, exportStateCsv } from "@/lib/data/demo-store";
import { useAppState } from "@/lib/data/use-app-state";
import { money, pct, vehicleTitle } from "@/lib/format";

function inRange(iso: string, start: string, end: string) {
  return iso.slice(0, 10) >= start && iso.slice(0, 10) <= end;
}

export default function ReportsPage() {
  const state = useAppState();
  const [from, setFrom] = useState("2026-08-01");
  const [to, setTo] = useState("2026-09-30");

  const rows = useMemo(() => {
    return state.worksheets.filter((sheet) => inRange(sheet.createdAt, from, to)).map((sheet) => {
      const result = calculateAcquisition(sheet.costs, sheet.profitTargets);
      return { sheet, result };
    });
  }, [state.worksheets, from, to]);

  const byMake = groupSum(rows, (row) => row.sheet.vehicle.make, (row) => row.result.roiPercent);
  const byModel = groupSum(rows, (row) => row.sheet.vehicle.model, (row) => row.result.roiPercent);
  const byAuction = groupSum(rows, (row) => row.sheet.vehicle.auctionName, (row) => row.result.roiPercent);
  const spend = rows.reduce((sum, row) => sum + row.result.landedCost, 0);
  const projProfit = rows.reduce((sum, row) => sum + row.result.projectedProfit, 0);
  const actualProfit = state.purchases
    .filter((item) => inRange(item.createdAt, from, to) && item.actuals.soldPrice > 0)
    .reduce((sum, item) => sum + (item.actuals.soldPrice - item.actuals.totalCost), 0);
  const transport = rows.reduce((sum, row) => sum + row.sheet.costs.transportation, 0);
  const repairs = rows.reduce(
    (sum, row) =>
      sum +
      row.sheet.costs.mechanicalRepairs +
      row.sheet.costs.bodyRepairs +
      row.sheet.costs.tires +
      row.sheet.costs.brakes,
    0,
  );
  const avgDays =
    rows.reduce((sum, row) => sum + row.sheet.profitTargets.estimatedDaysToSell, 0) / Math.max(1, rows.length);
  const passed = rows.filter((row) => row.sheet.status === "passed").length;
  const won = rows.filter((row) => row.sheet.status === "won").length;
  const ranked = [...rows].sort((a, b) => b.result.projectedProfit - a.result.projectedProfit);
  const buyerPerf = groupSum(rows, (row) => row.sheet.assignedBuyer, (row) => row.result.projectedProfit);

  function exportCsv() {
    downloadCsv(
      "lotagent-report.csv",
      exportStateCsv(
        rows.map(({ sheet, result }) => ({
          vehicle: vehicleTitle(sheet.vehicle),
          auction: sheet.vehicle.auctionName,
          status: sheet.status,
          bid: sheet.costs.currentBid,
          landed: result.landedCost,
          profit: result.projectedProfit,
          roi: result.roiPercent,
        })),
      ),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Date-filtered acquisition performance. Demo figures included.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          <Button onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Acquisition spending" value={money(spend)} />
        <Stat label="Projected profit" value={money(projProfit)} />
        <Stat label="Actual profit" value={money(actualProfit)} />
        <Stat label="Avg days held (est.)" value={`${Math.round(avgDays)}`} />
        <Stat label="Transportation costs" value={money(transport)} />
        <Stat label="Repair costs" value={money(repairs)} />
        <Stat label="Vehicles won" value={String(won)} />
        <Stat label="Vehicles passed" value={String(passed)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="ROI by make" data={byMake} />
        <ChartCard title="ROI by model" data={byModel} />
        <ChartCard title="ROI by auction" data={byAuction} />
        <ChartCard title="Buyer projected profit" data={buyerPerf} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Best acquisitions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {ranked.slice(0, 5).map(({ sheet, result }) => (
              <p key={sheet.id}>
                {vehicleTitle(sheet.vehicle)} · {money(result.projectedProfit)} · {pct(result.roiPercent)}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Worst acquisitions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {ranked.slice(-5).reverse().map(({ sheet, result }) => (
              <p key={sheet.id}>
                {vehicleTitle(sheet.vehicle)} · {money(result.projectedProfit)} · {pct(result.roiPercent)}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function groupSum<T>(rows: T[], key: (row: T) => string, value: (row: T) => number) {
  const map = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const k = key(row);
    const current = map.get(k) ?? { total: 0, count: 0 };
    current.total += value(row);
    current.count += 1;
    map.set(k, current);
  }
  return [...map.entries()].map(([name, stats]) => ({ name, value: Math.round((stats.total / stats.count) * 10) / 10 }));
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm" className="shadow-sm">
      <CardHeader>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="tabular text-2xl font-semibold">{value}</p>
      </CardHeader>
    </Card>
  );
}

function ChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" hide={data.length > 6} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#1565ff" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
