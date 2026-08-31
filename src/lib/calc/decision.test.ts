import { describe, expect, it } from "vitest";
import { calculateAcquisition } from "@/lib/calc/acquisition";
import { decideAcquisition } from "@/lib/calc/decision";
import { opportunityScore } from "@/lib/calc/opportunity";
import type { AcquisitionCosts, ConditionItem, DecisionThresholds, ProfitTargets } from "@/lib/types";

const costs: AcquisitionCosts = {
  currentBid: 10000,
  expectedWinningBid: 10000,
  auctionBuyerFee: 300,
  internetBiddingFee: 0,
  gateFee: 0,
  titleFee: 0,
  documentationFee: 0,
  salesTax: 0,
  transportation: 400,
  mechanicalRepairs: 0,
  bodyRepairs: 0,
  tires: 0,
  brakes: 0,
  detailing: 0,
  reconditioning: 200,
  inspection: 0,
  keys: 0,
  fuel: 0,
  storage: 0,
  floorPlanFees: 0,
  financingInterest: 0,
  riskReserve: 100,
  otherCosts: 0,
  customRows: [],
  feeOverride: false,
};

const targets: ProfitTargets = {
  expectedSellingPrice: 16000,
  desiredMinProfit: 1000,
  desiredRoi: 10,
  expectedHoldingPeriod: 20,
  estimatedDaysToSell: 15,
  salesCommission: 0,
  advertisingCost: 0,
  negotiationDiscount: 0,
};

const thresholds: DecisionThresholds = {
  comfortMarginPercent: 8,
  cautionMarginPercent: 3,
  minRoiPercent: 8,
  minProfit: 500,
  elevatedRiskScoreBelow: 5,
};

const clean: ConditionItem[] = [{ flag: "clean", selected: true, dollarAdjustment: 0 }];

describe("decision engine", () => {
  it("returns BUY when bid room and ROI are comfortable", () => {
    const result = calculateAcquisition(costs, targets);
    const decision = decideAcquisition(
      result,
      { conditionScore: 8, titleStatus: "clean" },
      clean,
      thresholds,
      10000,
    );
    expect(decision.status).toBe("BUY");
    expect(decision.reasons.length).toBeGreaterThan(0);
  });

  it("returns PASS when the current bid exceeds max safe bid", () => {
    const high = { ...costs, currentBid: 50000, expectedWinningBid: 50000 };
    const result = calculateAcquisition(high, targets);
    const decision = decideAcquisition(
      result,
      { conditionScore: 8, titleStatus: "clean" },
      clean,
      thresholds,
      50000,
    );
    expect(decision.status).toBe("PASS");
    expect(decision.reasons.some((reason) => reason.includes("exceeds"))).toBe(true);
  });

  it("returns CAUTION for elevated title risk", () => {
    const result = calculateAcquisition(costs, targets);
    const salvage: ConditionItem[] = [
      { flag: "salvage_title", selected: true, dollarAdjustment: 1500 },
    ];
    const decision = decideAcquisition(
      result,
      { conditionScore: 6, titleStatus: "salvage" },
      salvage,
      thresholds,
      10000,
    );
    expect(decision.status).toBe("CAUTION");
    expect(decision.elevatedRisk).toBe(true);
  });
});

describe("opportunity score", () => {
  it("explains weights and does not use retail value", () => {
    const result = calculateAcquisition(costs, targets);
    const score = opportunityScore(
      result,
      { conditionScore: 8, titleStatus: "clean" },
      clean,
      10,
      1000,
      15,
    );
    expect(score.total).toBeGreaterThan(0);
    expect(score.explanation.toLowerCase()).toContain("retail value is not used");
  });
});
