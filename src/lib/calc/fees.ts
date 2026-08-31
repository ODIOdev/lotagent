import type { AuctionFeeSchedule, BuyerFeeConfig, FeeTier } from "@/lib/types";
import { moneyNum, roundMoney } from "@/lib/calc/money";

export function matchingTier(tiers: FeeTier[], bid: number): FeeTier | null {
  const amount = moneyNum(bid);
  const match = tiers.find((tier) => {
    const min = moneyNum(tier.minBid);
    const max = tier.maxBid == null ? Number.POSITIVE_INFINITY : moneyNum(tier.maxBid);
    return amount >= min && amount <= max;
  });
  return match ?? null;
}

export function applyMinMax(fee: number, min: number, max: number | null): number {
  let result = roundMoney(fee);
  if (moneyNum(min) > 0) result = Math.max(result, moneyNum(min));
  if (max != null && moneyNum(max) > 0) result = Math.min(result, moneyNum(max));
  return roundMoney(result);
}

export function calculateBuyerFee(config: BuyerFeeConfig, winningBid: number): number {
  const bid = moneyNum(winningBid);
  let fee = 0;

  if (config.kind === "flat") {
    fee = moneyNum(config.flat);
  } else if (config.kind === "percentage") {
    fee = bid * (moneyNum(config.percent) / 100);
  } else {
    const tier = matchingTier(config.tiers, bid);
    if (tier) {
      fee = moneyNum(tier.flat) + bid * (moneyNum(tier.percent) / 100);
    } else {
      fee = moneyNum(config.flat) + bid * (moneyNum(config.percent) / 100);
    }
  }

  return applyMinMax(fee, config.min, config.max);
}

export interface CalculatedFees {
  buyerFee: number;
  internetFee: number;
  gateFee: number;
  titleFee: number;
  documentationFee: number;
  storageFee: number;
  latePaymentFee: number;
  tax: number;
  total: number;
}

export function calculateAuctionFees(
  schedule: AuctionFeeSchedule,
  winningBid: number,
): CalculatedFees {
  const bid = moneyNum(winningBid);
  const buyerFee = calculateBuyerFee(schedule.buyerFee, bid);
  const internetFee = moneyNum(schedule.internetFee);
  const gateFee = moneyNum(schedule.gateFee);
  const titleFee = moneyNum(schedule.titleFee);
  const documentationFee = moneyNum(schedule.documentationFee);
  const storageFee = moneyNum(schedule.storageFee);
  const latePaymentFee = moneyNum(schedule.latePaymentFee);
  const feeSubtotal =
    buyerFee + internetFee + gateFee + titleFee + documentationFee + storageFee + latePaymentFee;

  let tax = 0;
  const rate = moneyNum(schedule.taxRate) / 100;
  if (schedule.taxTreatment === "on_fees") tax = feeSubtotal * rate;
  if (schedule.taxTreatment === "on_vehicle") tax = bid * rate;
  if (schedule.taxTreatment === "on_vehicle_and_fees") tax = (bid + feeSubtotal) * rate;

  const roundedTax = roundMoney(tax);
  return {
    buyerFee,
    internetFee,
    gateFee,
    titleFee,
    documentationFee,
    storageFee,
    latePaymentFee,
    tax: roundedTax,
    total: roundMoney(feeSubtotal + roundedTax),
  };
}

export function calculateTransportEstimate(input: {
  distance: number;
  costPerMile: number;
  flatPickupCharge: number;
  inoperableSurcharge: number;
  enclosedSurcharge: number;
  urgentSurcharge: number;
  tollEstimate: number;
}): number {
  return roundMoney(
    moneyNum(input.distance) * moneyNum(input.costPerMile) +
      moneyNum(input.flatPickupCharge) +
      moneyNum(input.inoperableSurcharge) +
      moneyNum(input.enclosedSurcharge) +
      moneyNum(input.urgentSurcharge) +
      moneyNum(input.tollEstimate),
  );
}
