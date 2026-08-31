import { describe, expect, it } from "vitest";
import { calculateAuctionFees, calculateBuyerFee, matchingTier } from "@/lib/calc/fees";
import type { AuctionFeeSchedule, BuyerFeeConfig } from "@/lib/types";

const tiered: BuyerFeeConfig = {
  kind: "tiered",
  flat: 0,
  percent: 0,
  min: 50,
  max: 800,
  tiers: [
    { minBid: 0, maxBid: 999, flat: 155, percent: 0 },
    { minBid: 1000, maxBid: 4999, flat: 250, percent: 0 },
    { minBid: 5000, maxBid: 9999, flat: 350, percent: 1 },
    { minBid: 10000, maxBid: null, flat: 400, percent: 2 },
  ],
};

const schedule: AuctionFeeSchedule = {
  id: "test",
  name: "Test Auction",
  auctionKey: "test",
  sampleData: true,
  active: true,
  buyerFee: tiered,
  internetFee: 79,
  gateFee: 25,
  titleFee: 80,
  documentationFee: 40,
  storageFee: 0,
  latePaymentFee: 0,
  taxTreatment: "on_fees",
  taxRate: 0,
};

describe("tiered buyer fees", () => {
  it("selects the matching tier", () => {
    expect(matchingTier(tiered.tiers, 800)?.flat).toBe(155);
    expect(matchingTier(tiered.tiers, 2500)?.flat).toBe(250);
    expect(matchingTier(tiered.tiers, 7500)?.percent).toBe(1);
    expect(matchingTier(tiered.tiers, 18000)?.percent).toBe(2);
  });

  it("applies flat plus percent within a tier", () => {
    expect(calculateBuyerFee(tiered, 7500)).toBe(425);
    expect(calculateBuyerFee(tiered, 18000)).toBe(760);
  });

  it("enforces minimum and maximum fees", () => {
    const withCap: BuyerFeeConfig = { ...tiered, max: 500 };
    expect(calculateBuyerFee(withCap, 18000)).toBe(500);
    const withMin: BuyerFeeConfig = {
      kind: "percentage",
      flat: 0,
      percent: 1,
      min: 200,
      max: null,
      tiers: [],
    };
    expect(calculateBuyerFee(withMin, 1000)).toBe(200);
  });

  it("handles flat and percentage kinds", () => {
    expect(
      calculateBuyerFee(
        { kind: "flat", flat: 299, percent: 0, min: 0, max: null, tiers: [] },
        20000,
      ),
    ).toBe(299);
    expect(
      calculateBuyerFee(
        { kind: "percentage", flat: 0, percent: 5, min: 0, max: null, tiers: [] },
        10000,
      ),
    ).toBe(500);
  });
});

describe("full fee schedule", () => {
  it("sums buyer, internet, gate, title, and documentation fees", () => {
    const fees = calculateAuctionFees(schedule, 18000);
    expect(fees.buyerFee).toBe(760);
    expect(fees.internetFee).toBe(79);
    expect(fees.gateFee).toBe(25);
    expect(fees.total).toBe(760 + 79 + 25 + 80 + 40);
  });

  it("can tax fees or the vehicle", () => {
    const onVehicle = calculateAuctionFees(
      { ...schedule, taxTreatment: "on_vehicle", taxRate: 6 },
      10000,
    );
    expect(onVehicle.tax).toBe(600);
    const onFees = calculateAuctionFees(
      { ...schedule, taxTreatment: "on_fees", taxRate: 10 },
      2500,
    );
    expect(onFees.tax).toBeCloseTo(onFees.total - (onFees.buyerFee + 79 + 25 + 80 + 40), 2);
  });
});
