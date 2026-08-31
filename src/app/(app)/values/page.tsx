"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { worksheetMetrics } from "@/lib/data/metrics";
import { useAppState } from "@/lib/data/use-app-state";
import { formatDate, money, pct, vehicleTitle } from "@/lib/format";

export default function ValuesPage() {
  const state = useAppState();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.worksheets.filter((sheet) =>
      vehicleTitle(sheet.vehicle).toLowerCase().includes(q) ||
      sheet.vehicle.vin.toLowerCase().includes(q),
    );
  }, [query, state.worksheets]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Vehicle values</h1>
        <p className="text-sm text-muted-foreground">
          Manual and demo adapter values. Do not scrape Kelley Blue Book or other protected services.
        </p>
      </div>
      <Input placeholder="Search make, model, or VIN" value={query} onChange={(event) => setQuery(event.target.value)} />
      {rows.length === 0 ? (
        <EmptyState title="No vehicles" description="Create a worksheet to record trade-in, wholesale, and retail." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Vehicle", "Source", "Trade-in", "Wholesale", "Retail", "Quick-sale", "Confidence", "Decision", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((sheet) => {
                const { decision } = worksheetMetrics(sheet, state);
                return (
                  <tr key={sheet.id} className="border-t">
                    <td className="px-3 py-2">
                      <p className="font-medium">{vehicleTitle(sheet.vehicle)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(sheet.values.retrievedAt)}</p>
                    </td>
                    <td className="px-3 py-2 text-xs">{sheet.values.source}</td>
                    <td className="tabular px-3 py-2">{money(sheet.values.tradeIn)}</td>
                    <td className="tabular px-3 py-2">{money(sheet.values.wholesale)}</td>
                    <td className="tabular px-3 py-2">{money(sheet.values.retail)}</td>
                    <td className="tabular px-3 py-2">{money(sheet.values.quickSale)}</td>
                    <td className="tabular px-3 py-2">{pct(sheet.values.confidence, 0)}</td>
                    <td className="px-3 py-2"><StatusBadge status={decision.status} /></td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/acquisitions/${sheet.id}`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
