export { moneyNum, roundMoney, clamp } from "@/lib/calc/money";
export {
  calculateAcquisition,
  landedCost,
  netExpectedSellingPrice,
  projectedProfit,
  roiPercent,
  maxSafeBid,
  maxSafeBidFromProfit,
  maxSafeBidFromRoi,
  remainingBidRoom,
  expensesExceptWinningBid,
} from "@/lib/calc/acquisition";
export type { AcquisitionResult } from "@/lib/calc/acquisition";
export {
  calculateAuctionFees,
  calculateBuyerFee,
  calculateTransportEstimate,
  matchingTier,
} from "@/lib/calc/fees";
export { decideAcquisition, conditionRiskScore } from "@/lib/calc/decision";
export type { DecisionResult } from "@/lib/calc/decision";
export { opportunityScore, OPPORTUNITY_WEIGHTS } from "@/lib/calc/opportunity";
