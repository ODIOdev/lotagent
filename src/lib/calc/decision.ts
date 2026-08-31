import type {
  ConditionItem,
  DecisionStatus,
  DecisionThresholds,
  VehicleInfo,
} from "@/lib/types";
import { ELEVATED_RISK_FLAGS, HIGH_RISK_FLAGS } from "@/lib/types";
import type { AcquisitionResult } from "@/lib/calc/acquisition";
import { moneyNum } from "@/lib/calc/money";

export interface DecisionResult {
  status: DecisionStatus;
  reasons: string[];
  riskScore: number;
  elevatedRisk: boolean;
}

export function conditionRiskScore(
  items: ConditionItem[],
  vehicle: Pick<VehicleInfo, "conditionScore" | "titleStatus">,
): number {
  let score = 0;
  const selected = items.filter((item) => item.selected).map((item) => item.flag);
  if (selected.some((flag) => HIGH_RISK_FLAGS.includes(flag))) score += 45;
  if (selected.some((flag) => ELEVATED_RISK_FLAGS.includes(flag))) score += 20;
  if (vehicle.titleStatus === "salvage" || vehicle.titleStatus === "flood") score += 25;
  if (vehicle.titleStatus === "rebuilt" || vehicle.titleStatus === "lemon") score += 15;
  if (vehicle.conditionScore <= 4) score += 20;
  else if (vehicle.conditionScore <= 6) score += 10;
  return Math.min(100, score);
}

export function decideAcquisition(
  result: AcquisitionResult,
  vehicle: Pick<VehicleInfo, "conditionScore" | "titleStatus">,
  items: ConditionItem[],
  thresholds: DecisionThresholds,
  currentBid: number,
): DecisionResult {
  const reasons: string[] = [];
  const riskScore = conditionRiskScore(items, vehicle);
  const elevatedRisk =
    riskScore >= 40 || vehicle.conditionScore < thresholds.elevatedRiskScoreBelow;
  const room = result.remainingBidRoom;
  const maxBid = result.maxSafeBid;
  const roomPct = maxBid > 0 ? (room / maxBid) * 100 : 0;
  const bid = moneyNum(currentBid);

  if (bid > maxBid) {
    reasons.push(
      `Current bid ${formatUsd(bid)} exceeds the maximum safe bid of ${formatUsd(maxBid)}.`,
    );
  }
  if (result.projectedProfit < thresholds.minProfit) {
    reasons.push(
      `Projected profit ${formatUsd(result.projectedProfit)} is below the ${formatUsd(thresholds.minProfit)} minimum.`,
    );
  }
  if (result.roiPercent < thresholds.minRoiPercent) {
    reasons.push(
      `Projected ROI ${result.roiPercent.toFixed(1)}% is below the ${thresholds.minRoiPercent}% floor.`,
    );
  }
  if (elevatedRisk) {
    reasons.push(
      `Risk is elevated (score ${riskScore}/100, condition ${vehicle.conditionScore}/10).`,
    );
  }

  let status: DecisionStatus;
  if (
    bid > maxBid ||
    result.projectedProfit < thresholds.minProfit ||
    result.roiPercent < thresholds.minRoiPercent
  ) {
    status = "PASS";
    if (reasons.length === 0) {
      reasons.push("The numbers do not support buying at this bid.");
    }
  } else if (
    roomPct < thresholds.comfortMarginPercent ||
    elevatedRisk ||
    roomPct < thresholds.cautionMarginPercent
  ) {
    status = "CAUTION";
    if (roomPct < thresholds.comfortMarginPercent) {
      reasons.push(
        `Remaining bid room is ${roomPct.toFixed(1)}% of max bid — inside the caution band.`,
      );
    }
    if (reasons.length === 0) {
      reasons.push("Proceed only if you can hold the line on price and recon.");
    }
  } else {
    status = "BUY";
    reasons.unshift(
      `Current bid is ${formatUsd(room)} under the ${formatUsd(maxBid)} max safe bid, and ROI ${result.roiPercent.toFixed(1)}% meets the target.`,
    );
  }

  return { status, reasons, riskScore, elevatedRisk };
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
