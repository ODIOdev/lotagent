import type { AcquisitionResult } from "@/lib/calc/acquisition";
import type { ConditionItem, VehicleInfo } from "@/lib/types";
import { clamp } from "@/lib/calc/money";
import { conditionRiskScore } from "@/lib/calc/decision";

export const OPPORTUNITY_WEIGHTS = {
  remainingRoom: 0.25,
  roiVsTarget: 0.25,
  profitVsTarget: 0.2,
  condition: 0.15,
  risk: 0.1,
  daysToSell: 0.05,
} as const;

export interface OpportunityBreakdown {
  remainingRoom: number;
  roiVsTarget: number;
  profitVsTarget: number;
  condition: number;
  risk: number;
  daysToSell: number;
  total: number;
  explanation: string;
}

export function opportunityScore(
  result: AcquisitionResult,
  vehicle: Pick<VehicleInfo, "conditionScore" | "titleStatus">,
  items: ConditionItem[],
  desiredRoi: number,
  desiredProfit: number,
  daysToSell: number,
): OpportunityBreakdown {
  const roomPct = result.maxSafeBid > 0 ? result.remainingBidRoom / result.maxSafeBid : 0;
  const remainingRoom = clamp(roomPct / 0.2, 0, 1) * 100;

  const roiVsTarget =
    desiredRoi <= 0 ? 50 : clamp(result.roiPercent / desiredRoi, 0, 1.5) * (100 / 1.5);

  const profitVsTarget =
    desiredProfit <= 0
      ? 50
      : clamp(result.projectedProfit / desiredProfit, 0, 1.5) * (100 / 1.5);

  const condition = clamp(vehicle.conditionScore / 10, 0, 1) * 100;

  const risk = 100 - conditionRiskScore(items, vehicle);

  const daysToSellScore = clamp(1 - daysToSell / 60, 0, 1) * 100;

  const total =
    remainingRoom * OPPORTUNITY_WEIGHTS.remainingRoom +
    roiVsTarget * OPPORTUNITY_WEIGHTS.roiVsTarget +
    profitVsTarget * OPPORTUNITY_WEIGHTS.profitVsTarget +
    condition * OPPORTUNITY_WEIGHTS.condition +
    risk * OPPORTUNITY_WEIGHTS.risk +
    daysToSellScore * OPPORTUNITY_WEIGHTS.daysToSell;

  return {
    remainingRoom,
    roiVsTarget,
    profitVsTarget,
    condition,
    risk,
    daysToSell: daysToSellScore,
    total: Math.round(total * 10) / 10,
    explanation:
      "Score weights remaining bid room 25%, ROI vs target 25%, profit vs target 20%, condition 15%, inverse risk 10%, and faster days-to-sell 5%. Retail value is not used so a high asking price cannot inflate the ranking.",
  };
}
