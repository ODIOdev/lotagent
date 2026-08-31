"use client";

import { AcquisitionForm } from "@/components/acquisition/acquisition-form";
import { createBlankWorksheet } from "@/lib/data/blank";
import { useAppState } from "@/lib/data/use-app-state";
import { useMemo } from "react";

export default function NewAcquisitionPage() {
  const state = useAppState();
  const initial = useMemo(() => {
    const sheet = createBlankWorksheet();
    return {
      ...sheet,
      assignedBuyer: state.profile.fullName,
      profitTargets: {
        ...sheet.profitTargets,
        desiredMinProfit: state.settings.defaultDesiredProfit,
        desiredRoi: state.settings.defaultDesiredRoi,
      },
      costs: { ...sheet.costs, riskReserve: state.settings.defaultRiskReserve },
    };
  }, [state.profile.fullName, state.settings]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New acquisition</h1>
        <p className="text-sm text-muted-foreground">
          Build the worksheet, then open Live Bid when the lane starts.
        </p>
      </div>
      <AcquisitionForm initial={initial} />
    </div>
  );
}
