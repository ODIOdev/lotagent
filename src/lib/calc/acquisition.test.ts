import { describe, expect, it } from "vitest";
import {
  calculateAcquisition,
  expensesExceptWinningBid,
  landedCost,
  maxSafeBid,
  maxSafeBidFromProfit,
  maxSafeBidFromRoi,
  moneyNum,
  netExpectedSellingPrice,
  projectedProfit,
  remainingBidRoom,
  roiPercent,
} from "@/lib/calc";
import type { AcquisitionCosts, ProfitTargets } from "@/lib/types";

const costs: AcquisitionCosts = {
  currentBid: 14000,
  expectedWinningBid: 15000,
  auctionBuyerFee: 450,
  internetBiddingFee: 75,
  gateFee: 25,
  titleFee: 80,
  documentationFee: 40,
  salesTax: 0,
  transportation: 650,
  mechanicalRepairs: 800,
  bodyRepairs: 400,
  tires: 200,
  brakes: 150,
  detailing: 175,
  reconditioning: 300,
  inspection: 125,
  keys: 0,
  fuel: 40,
  storage: 0,
  floorPlanFees: 75,
  financingInterest: 50,
  riskReserve: 250,
  otherCosts: 100,
  customRows: [{ id: "c1", label: "Scan tool", amount: 90 }],
  feeOverride: false,
};

const targets: ProfitTargets = {
  expectedSellingPrice: 22900,
  desiredMinProfit: 1500,
  desiredRoi: 12,
  expectedHoldingPeriod: 21,
  estimatedDaysToSell: 18,
  salesCommission: 200,
  advertisingCost: 150,
  negotiationDiscount: 300,
};

describe("moneyNum", () => {
  it("coerces empty, invalid, NaN, and negative values to 0", () => {
    expect(moneyNum("")).toBe(0);
    expect(moneyNum(null)).toBe(0);
    expect(moneyNum(undefined)).toBe(0);
    expect(moneyNum("abc")).toBe(0);
    expect(moneyNum(Number.NaN)).toBe(0);
    expect(moneyNum(-40)).toBe(0);
    expect(moneyNum("$1,250.50")).toBe(1250.5);
  });
});

describe("landed cost", () => {
  it("sums winning bid with every expense including custom rows", () => {
    const expenses = expensesExceptWinningBid(costs);
    expect(expenses).toBe(4075);
    expect(landedCost(costs, 15000)).toBe(19075);
  });

  it("does not break when custom rows are missing", () => {
    const broken = { ...costs, customRows: undefined as unknown as AcquisitionCosts["customRows"] };
    expect(landedCost(broken, 1000)).toBeGreaterThan(0);
  });
});

describe("profit and ROI", () => {
  it("computes net sell, profit, and ROI", () => {
    const net = netExpectedSellingPrice(targets);
    expect(net).toBe(22250);
    const profit = projectedProfit(net, 19075);
    expect(profit).toBe(3175);
    expect(roiPercent(profit, 19075)).toBeCloseTo(16.64, 2);
  });

  it("returns 0 ROI when landed cost is 0", () => {
    expect(roiPercent(500, 0)).toBe(0);
  });
});

describe("maximum safe bid", () => {
  it("uses the more conservative of profit and ROI targets", () => {
    const expenses = 4075;
    const net = 22250;
    const profitBid = maxSafeBidFromProfit(net, 1500, expenses);
    const roiBid = maxSafeBidFromRoi(net, 12, expenses);
    expect(profitBid).toBe(16675);
    expect(roiBid).toBeCloseTo(15791.07, 1);
    expect(maxSafeBid(net, 1500, 12, expenses)).toBe(roiBid);
  });

  it("never returns a negative max bid", () => {
    expect(maxSafeBid(1000, 5000, 50, 2000)).toBe(0);
  });

  it("computes remaining bid room", () => {
    expect(remainingBidRoom(16000, 14000)).toBe(2000);
    expect(remainingBidRoom(14000, 16000)).toBe(-2000);
  });
});

describe("calculateAcquisition", () => {
  it("returns a complete result using expected winning bid", () => {
    const result = calculateAcquisition(costs, targets);
    expect(result.landedCost).toBe(19075);
    expect(result.netExpectedSellingPrice).toBe(22250);
    expect(result.projectedProfit).toBe(3175);
    expect(result.maxSafeBid).toBe(result.maxSafeBidRoi);
    expect(result.remainingBidRoom).toBeCloseTo(result.maxSafeBid - 14000, 2);
  });
});
