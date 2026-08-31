"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { duplicateFeeSchedule, setFeeScheduleActive, upsertFeeSchedule } from "@/lib/data/demo-store";
import { useAppState } from "@/lib/data/use-app-state";
import { calculateAuctionFees } from "@/lib/calc/fees";
import { money, uid } from "@/lib/format";
import type { AuctionFeeSchedule, FeeKind, TaxTreatment } from "@/lib/types";

export default function AuctionFeesPage() {
  const state = useAppState();
  const [selectedId, setSelectedId] = useState(state.feeSchedules[0]?.id);
  const [bid, setBid] = useState(15000);
  const selected = state.feeSchedules.find((item) => item.id === selectedId) ?? state.feeSchedules[0];
  const preview = selected ? calculateAuctionFees(selected, bid) : null;

  function patch(partial: Partial<AuctionFeeSchedule>) {
    if (!selected) return;
    upsertFeeSchedule({ ...selected, ...partial });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Auction fee rules</h1>
        <p className="text-sm text-muted-foreground">
          Preset amounts are sample data and must be verified before live bidding.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Schedules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.feeSchedules.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${item.id === selected?.id ? "border-primary bg-primary/5" : ""}`}
              >
                <span className="flex items-center justify-between gap-2">
                  {item.name}
                  {item.sampleData ? <Badge variant="outline">Sample</Badge> : null}
                </span>
                <span className="text-xs text-muted-foreground">{item.active ? "Active" : "Inactive"}</span>
              </button>
            ))}
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                const copy: AuctionFeeSchedule = {
                  ...state.feeSchedules[0],
                  id: uid("fee"),
                  name: "New custom schedule",
                  auctionKey: "custom",
                  sampleData: false,
                };
                upsertFeeSchedule(copy);
                setSelectedId(copy.id);
              }}
            >
              New schedule
            </Button>
          </CardContent>
        </Card>

        {selected ? (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{selected.name}</CardTitle>
              <CardDescription>Buyer fee kind, min/max, and add-on fees.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>Name</Label>
                <Input value={selected.name} onChange={(event) => patch({ name: event.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Buyer fee kind</Label>
                <Select value={selected.buyerFee.kind} onValueChange={(kind) => patch({ buyerFee: { ...selected.buyerFee, kind: kind as FeeKind } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="tiered">Tiered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Tax treatment</Label>
                <Select value={selected.taxTreatment} onValueChange={(taxTreatment) => patch({ taxTreatment: taxTreatment as TaxTreatment })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="on_fees">On fees</SelectItem>
                    <SelectItem value="on_vehicle">On vehicle</SelectItem>
                    <SelectItem value="on_vehicle_and_fees">On vehicle and fees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {["flat", "percent", "min"].map((field) => (
                <div key={field} className="grid gap-1.5">
                  <Label className="capitalize">{field}</Label>
                  <Input
                    className="tabular"
                    value={selected.buyerFee[field as "flat" | "percent" | "min"]}
                    onChange={(event) =>
                      patch({
                        buyerFee: { ...selected.buyerFee, [field]: Number(event.target.value) || 0 },
                      })
                    }
                  />
                </div>
              ))}
              {["internetFee", "gateFee", "titleFee", "documentationFee", "storageFee", "latePaymentFee", "taxRate"].map((field) => (
                <div key={field} className="grid gap-1.5">
                  <Label className="capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
                  <Input
                    className="tabular"
                    value={selected[field as keyof AuctionFeeSchedule] as number}
                    onChange={(event) => patch({ [field]: Number(event.target.value) || 0 })}
                  />
                </div>
              ))}
              <div className="sm:col-span-2 rounded-lg border bg-muted/40 p-3">
                <Label>Preview winning bid</Label>
                <Input className="tabular mt-1 max-w-xs" value={bid} onChange={(event) => setBid(Number(event.target.value) || 0)} />
                {preview ? (
                  <p className="mt-2 tabular text-sm">
                    Buyer {money(preview.buyerFee)} · internet {money(preview.internetFee)} · gate {money(preview.gateFee)} ·
                    title {money(preview.titleFee)} · doc {money(preview.documentationFee)} · tax {money(preview.tax)} ·
                    total {money(preview.total)}
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => duplicateFeeSchedule(selected.id)}>
                  Duplicate
                </Button>
                <Button type="button" variant="outline" onClick={() => setFeeScheduleActive(selected.id, !selected.active)}>
                  {selected.active ? "Deactivate" : "Activate"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">Deactivate and hide</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate this schedule?</AlertDialogTitle>
                      <AlertDialogDescription>
                        It stays in the list as inactive so historical worksheets can still resolve fees.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => setFeeScheduleActive(selected.id, false)}>Deactivate</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
