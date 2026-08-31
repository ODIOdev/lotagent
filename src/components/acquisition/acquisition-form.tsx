"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DecisionBanner } from "@/components/decision-banner";
import { MoneyInput, NumberInput } from "@/components/money-input";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { applyScheduleToWorksheet, toggleWatchlist, upsertWorksheet } from "@/lib/data/demo-store";
import { worksheetMetrics } from "@/lib/data/metrics";
import { useAppState } from "@/lib/data/use-app-state";
import { getProviders } from "@/lib/providers";
import { money, pct } from "@/lib/format";
import { uid } from "@/lib/format";
import { CONDITION_FLAG_LABELS, TITLE_STATUSES, type ConditionFlagId, type TitleStatus, type Worksheet } from "@/lib/types";

const COST_FIELDS: { key: keyof Worksheet["costs"]; label: string }[] = [
  { key: "currentBid", label: "Current bid" },
  { key: "expectedWinningBid", label: "Expected winning bid" },
  { key: "auctionBuyerFee", label: "Auction buyer fee" },
  { key: "internetBiddingFee", label: "Internet bidding fee" },
  { key: "gateFee", label: "Gate fee" },
  { key: "titleFee", label: "Title fee" },
  { key: "documentationFee", label: "Documentation fee" },
  { key: "salesTax", label: "Sales tax" },
  { key: "transportation", label: "Transportation" },
  { key: "mechanicalRepairs", label: "Mechanical repairs" },
  { key: "bodyRepairs", label: "Body repairs" },
  { key: "tires", label: "Tires" },
  { key: "brakes", label: "Brakes" },
  { key: "detailing", label: "Detailing" },
  { key: "reconditioning", label: "Reconditioning" },
  { key: "inspection", label: "Inspection" },
  { key: "keys", label: "Keys" },
  { key: "fuel", label: "Fuel" },
  { key: "storage", label: "Storage" },
  { key: "floorPlanFees", label: "Floor-plan fees" },
  { key: "financingInterest", label: "Financing interest" },
  { key: "riskReserve", label: "Risk reserve" },
  { key: "otherCosts", label: "Other costs" },
];

export function AcquisitionForm({ initial }: { initial: Worksheet }) {
  const router = useRouter();
  const state = useAppState();
  const [sheet, setSheet] = useState<Worksheet>(initial);
  const [saving, setSaving] = useState(false);
  const lastSubmit = useRef(0);

  const scheduled = useMemo(() => {
    const schedule =
      state.feeSchedules.find((item) => item.auctionKey === sheet.vehicle.auctionKey && item.active) ??
      state.feeSchedules[0];
    return applyScheduleToWorksheet(sheet, schedule);
  }, [sheet, state.feeSchedules]);

  const { result, decision } = worksheetMetrics(scheduled, state);

  function patch(partial: Partial<Worksheet>) {
    setSheet((current) => ({ ...current, ...partial, updatedAt: new Date().toISOString() }));
  }

  async function save(nextStatus?: Worksheet["status"]) {
    const now = Date.now();
    if (now - lastSubmit.current < 600) return;
    lastSubmit.current = now;
    if (!scheduled.vehicle.make || !scheduled.vehicle.model) {
      toast.error("Enter make and model before saving.");
      return;
    }
    setSaving(true);
    upsertWorksheet({ ...scheduled, status: nextStatus ?? scheduled.status });
    setSaving(false);
    toast.success("Worksheet saved.");
    router.push("/watchlist");
  }

  async function mockValuation() {
    const values = await getProviders().valuate(scheduled.vehicle);
    patch({ values: { ...values, manualOverride: false } });
    toast.message("Demo valuation loaded. Licensed providers can replace this adapter later.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Vehicle information</CardTitle>
            <CardDescription>Year, identity, auction, and condition.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NumberInput id="year" label="Year" value={sheet.vehicle.year} onChange={(year) => patch({ vehicle: { ...sheet.vehicle, year } })} />
            <Field label="Make" value={sheet.vehicle.make} onChange={(make) => patch({ vehicle: { ...sheet.vehicle, make } })} />
            <Field label="Model" value={sheet.vehicle.model} onChange={(model) => patch({ vehicle: { ...sheet.vehicle, model } })} />
            <Field label="Trim" value={sheet.vehicle.trim} onChange={(trim) => patch({ vehicle: { ...sheet.vehicle, trim } })} />
            <NumberInput id="miles" label="Mileage" value={sheet.vehicle.mileage} onChange={(mileage) => patch({ vehicle: { ...sheet.vehicle, mileage } })} />
            <Field label="Exterior color" value={sheet.vehicle.exteriorColor} onChange={(exteriorColor) => patch({ vehicle: { ...sheet.vehicle, exteriorColor } })} />
            <Field label="Interior color" value={sheet.vehicle.interiorColor} onChange={(interiorColor) => patch({ vehicle: { ...sheet.vehicle, interiorColor } })} />
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Title status</Label>
              <Select
                value={sheet.vehicle.titleStatus}
                onValueChange={(titleStatus) =>
                  patch({ vehicle: { ...sheet.vehicle, titleStatus: titleStatus as TitleStatus } })
                }
              >
                <SelectTrigger className="h-8 capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TITLE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Auction</Label>
              <Select
                value={sheet.vehicle.auctionKey}
                onValueChange={(auctionKey) => {
                  const named = state.feeSchedules.find((item) => item.auctionKey === auctionKey);
                  patch({
                    vehicle: {
                      ...sheet.vehicle,
                      auctionKey,
                      auctionName: named?.name.replace(" (sample)", "") ?? sheet.vehicle.auctionName,
                    },
                  });
                }}
              >
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {state.feeSchedules.map((item) => (
                    <SelectItem key={item.id} value={item.auctionKey}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field label="Auction location" value={sheet.vehicle.auctionLocation} onChange={(auctionLocation) => patch({ vehicle: { ...sheet.vehicle, auctionLocation } })} />
            <Field label="Stock / lot #" value={sheet.vehicle.stockNumber} onChange={(stockNumber) => patch({ vehicle: { ...sheet.vehicle, stockNumber } })} />
            <Field label="VIN" value={sheet.vehicle.vin} onChange={(vin) => patch({ vehicle: { ...sheet.vehicle, vin } })} />
            <div className="sm:col-span-2 lg:col-span-4 grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea value={sheet.vehicle.notes} onChange={(event) => patch({ vehicle: { ...sheet.vehicle, notes: event.target.value } })} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Label className="text-xs text-muted-foreground">Condition score {sheet.vehicle.conditionScore}/10</Label>
              <Slider
                className="mt-3"
                min={1}
                max={10}
                value={[sheet.vehicle.conditionScore]}
                onValueChange={([conditionScore]) => patch({ vehicle: { ...sheet.vehicle, conditionScore } })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Condition flags</CardTitle>
            <CardDescription>Assign a dollar adjustment to each issue. Totals inform recon, not landed cost automatically.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(CONDITION_FLAG_LABELS) as ConditionFlagId[]).map((flag) => {
              const item = sheet.conditionItems.find((entry) => entry.flag === flag);
              return (
                <label key={flag} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                  <Checkbox
                    checked={item?.selected ?? false}
                    onCheckedChange={(checked) =>
                      patch({
                        conditionItems: sheet.conditionItems.map((entry) =>
                          entry.flag === flag ? { ...entry, selected: Boolean(checked) } : entry,
                        ),
                      })
                    }
                  />
                  <span className="flex-1 text-sm">{CONDITION_FLAG_LABELS[flag]}</span>
                  <Input
                    className="h-7 w-20 tabular"
                    value={item?.dollarAdjustment ?? 0}
                    onChange={(event) =>
                      patch({
                        conditionItems: sheet.conditionItems.map((entry) =>
                          entry.flag === flag
                            ? { ...entry, dollarAdjustment: Number(event.target.value) || 0 }
                            : entry,
                        ),
                      })
                    }
                  />
                </label>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Vehicle values</CardTitle>
              <CardDescription>Manual figures until a licensed valuation API is connected.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void mockValuation()}>
              Load demo values
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MoneyInput id="tradeIn" label="Trade-in" value={sheet.values.tradeIn} onChange={(tradeIn) => patch({ values: { ...sheet.values, tradeIn, manualOverride: true } })} />
            <MoneyInput id="wholesale" label="Wholesale" value={sheet.values.wholesale} onChange={(wholesale) => patch({ values: { ...sheet.values, wholesale, manualOverride: true } })} />
            <MoneyInput id="retail" label="Retail" value={sheet.values.retail} onChange={(retail) => patch({ values: { ...sheet.values, retail, manualOverride: true } })} />
            <MoneyInput id="quick" label="Quick-sale" value={sheet.values.quickSale} onChange={(quickSale) => patch({ values: { ...sheet.values, quickSale, manualOverride: true } })} />
            <MoneyInput id="local" label="Local market avg" value={sheet.values.localMarketAverage} onChange={(localMarketAverage) => patch({ values: { ...sheet.values, localMarketAverage, manualOverride: true } })} />
            <MoneyInput id="low" label="Low market" value={sheet.values.lowMarket} onChange={(lowMarket) => patch({ values: { ...sheet.values, lowMarket, manualOverride: true } })} />
            <MoneyInput id="high" label="High market" value={sheet.values.highMarket} onChange={(highMarket) => patch({ values: { ...sheet.values, highMarket, manualOverride: true } })} />
            <NumberInput id="conf" label="Confidence" value={sheet.values.confidence} onChange={(confidence) => patch({ values: { ...sheet.values, confidence } })} />
            <Field label="Value source" value={sheet.values.source} onChange={(source) => patch({ values: { ...sheet.values, source } })} />
            <div className="sm:col-span-2 lg:col-span-3 grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Valuation notes</Label>
              <Textarea value={sheet.values.notes} onChange={(event) => patch({ values: { ...sheet.values, notes: event.target.value } })} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Acquisition costs</CardTitle>
            <CardDescription>
              Fees auto-fill from the selected auction schedule unless you override.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="col-span-full flex items-center gap-2 text-sm">
              <Checkbox
                checked={sheet.costs.feeOverride}
                onCheckedChange={(checked) => patch({ costs: { ...sheet.costs, feeOverride: Boolean(checked) } })}
              />
              Manual fee override
            </label>
            {COST_FIELDS.map((field) => (
              <MoneyInput
                key={field.key}
                id={field.key}
                label={field.label}
                value={Number(scheduled.costs[field.key])}
                disabled={!sheet.costs.feeOverride && ["auctionBuyerFee", "internetBiddingFee", "gateFee", "titleFee", "documentationFee", "salesTax"].includes(field.key)}
                onChange={(value) => patch({ costs: { ...sheet.costs, [field.key]: value } })}
              />
            ))}
            <div className="col-span-full flex items-center justify-between">
              <p className="text-sm font-medium">Custom cost rows</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  patch({
                    costs: {
                      ...sheet.costs,
                      customRows: [...sheet.costs.customRows, { id: uid("cost"), label: "Custom", amount: 0 }],
                    },
                  })
                }
              >
                Add row
              </Button>
            </div>
            {sheet.costs.customRows.map((row) => (
              <div key={row.id} className="col-span-full grid grid-cols-[1fr_120px_auto] gap-2">
                <Input
                  value={row.label}
                  onChange={(event) =>
                    patch({
                      costs: {
                        ...sheet.costs,
                        customRows: sheet.costs.customRows.map((item) =>
                          item.id === row.id ? { ...item, label: event.target.value } : item,
                        ),
                      },
                    })
                  }
                />
                <Input
                  className="tabular"
                  value={row.amount}
                  onChange={(event) =>
                    patch({
                      costs: {
                        ...sheet.costs,
                        customRows: sheet.costs.customRows.map((item) =>
                          item.id === row.id ? { ...item, amount: Number(event.target.value) || 0 } : item,
                        ),
                      },
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    patch({
                      costs: { ...sheet.costs, customRows: sheet.costs.customRows.filter((item) => item.id !== row.id) },
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Profit targets</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MoneyInput id="esp" label="Expected selling price" value={sheet.profitTargets.expectedSellingPrice} onChange={(expectedSellingPrice) => patch({ profitTargets: { ...sheet.profitTargets, expectedSellingPrice } })} />
            <MoneyInput id="minp" label="Desired minimum profit" value={sheet.profitTargets.desiredMinProfit} onChange={(desiredMinProfit) => patch({ profitTargets: { ...sheet.profitTargets, desiredMinProfit } })} />
            <NumberInput id="roi" label="Desired ROI %" value={sheet.profitTargets.desiredRoi} onChange={(desiredRoi) => patch({ profitTargets: { ...sheet.profitTargets, desiredRoi } })} />
            <NumberInput id="hold" label="Holding period (days)" value={sheet.profitTargets.expectedHoldingPeriod} onChange={(expectedHoldingPeriod) => patch({ profitTargets: { ...sheet.profitTargets, expectedHoldingPeriod } })} />
            <NumberInput id="dts" label="Est. days to sell" value={sheet.profitTargets.estimatedDaysToSell} onChange={(estimatedDaysToSell) => patch({ profitTargets: { ...sheet.profitTargets, estimatedDaysToSell } })} />
            <MoneyInput id="comm" label="Sales commission" value={sheet.profitTargets.salesCommission} onChange={(salesCommission) => patch({ profitTargets: { ...sheet.profitTargets, salesCommission } })} />
            <MoneyInput id="ad" label="Advertising" value={sheet.profitTargets.advertisingCost} onChange={(advertisingCost) => patch({ profitTargets: { ...sheet.profitTargets, advertisingCost } })} />
            <MoneyInput id="neg" label="Negotiation discount" value={sheet.profitTargets.negotiationDiscount} onChange={(negotiationDiscount) => patch({ profitTargets: { ...sheet.profitTargets, negotiationDiscount } })} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={saving} onClick={() => void save("watching")}>
            Save worksheet
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              upsertWorksheet(scheduled);
              toggleWatchlist(scheduled.id);
              toast.success("Watchlist updated.");
            }}
          >
            Toggle watchlist
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/live-bid/${scheduled.id}`)}>
            Open Live Bid
          </Button>
        </div>
      </div>

      <aside className="xl:sticky xl:top-4 h-fit space-y-3">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live summary</CardTitle>
              <StatusBadge status={decision.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Landed cost" value={money(result.landedCost)} />
            <Row label="Net sell" value={money(result.netExpectedSellingPrice)} />
            <Row label="Projected profit" value={money(result.projectedProfit)} />
            <Row label="Projected ROI" value={pct(result.roiPercent)} />
            <Row label="Max safe bid" value={money(result.maxSafeBid)} />
            <Row label="Bid room" value={money(result.remainingBidRoom)} />
            <p className="pt-1 text-xs text-muted-foreground">
              Conservative max of profit target {money(result.maxSafeBidProfit)} and ROI target{" "}
              {money(result.maxSafeBidRoi)}.
            </p>
          </CardContent>
        </Card>
        <DecisionBanner decision={decision} />
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input className="h-8" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-medium">{value}</span>
    </div>
  );
}
