import type { AcquisitionCosts, ProfitTargets } from "@/lib/types";
import { moneyNum, roundMoney } from "@/lib/calc/money";

export function customCostTotal(costs: Pick<AcquisitionCosts, "customRows">): number {
  return roundMoney(
    (costs.customRows ?? []).reduce((sum, row) => sum + moneyNum(row.amount), 0),
  );
}

export function auctionFeeTotal(costs: AcquisitionCosts): number {
  return roundMoney(
    moneyNum(costs.auctionBuyerFee) +
      moneyNum(costs.internetBiddingFee) +
      moneyNum(costs.gateFee),
  );
}

export function docsAndTitleTotal(costs: AcquisitionCosts): number {
  return roundMoney(moneyNum(costs.titleFee) + moneyNum(costs.documentationFee));
}

export function repairTotal(costs: AcquisitionCosts): number {
  return roundMoney(
    moneyNum(costs.mechanicalRepairs) +
      moneyNum(costs.bodyRepairs) +
      moneyNum(costs.tires) +
      moneyNum(costs.brakes) +
      moneyNum(costs.keys),
  );
}

export function reconditioningTotal(costs: AcquisitionCosts): number {
  return roundMoney(
    moneyNum(costs.detailing) +
      moneyNum(costs.reconditioning) +
      moneyNum(costs.inspection) +
      moneyNum(costs.fuel),
  );
}

export function financingTotal(costs: AcquisitionCosts): number {
  return roundMoney(moneyNum(costs.floorPlanFees) + moneyNum(costs.financingInterest));
}

/** Every expense except the winning bid. */
export function expensesExceptWinningBid(costs: AcquisitionCosts): number {
  return roundMoney(
    auctionFeeTotal(costs) +
      docsAndTitleTotal(costs) +
      moneyNum(costs.salesTax) +
      moneyNum(costs.transportation) +
      repairTotal(costs) +
      reconditioningTotal(costs) +
      moneyNum(costs.storage) +
      financingTotal(costs) +
      moneyNum(costs.riskReserve) +
      moneyNum(costs.otherCosts) +
      customCostTotal(costs),
  );
}

export function landedCost(costs: AcquisitionCosts, winningBid = costs.expectedWinningBid): number {
  return roundMoney(moneyNum(winningBid) + expensesExceptWinningBid(costs));
}

export function netExpectedSellingPrice(targets: ProfitTargets): number {
  return roundMoney(
    moneyNum(targets.expectedSellingPrice) -
      moneyNum(targets.negotiationDiscount) -
      moneyNum(targets.salesCommission) -
      moneyNum(targets.advertisingCost),
  );
}

export function projectedProfit(netSell: number, landed: number): number {
  return roundMoney(netSell - landed);
}

export function roiPercent(profit: number, landed: number): number {
  if (landed <= 0) return 0;
  return roundMoney((profit / landed) * 100);
}

export function maxSafeBidFromProfit(
  netSell: number,
  desiredMinProfit: number,
  expensesExceptBid: number,
): number {
  return roundMoney(netSell - moneyNum(desiredMinProfit) - expensesExceptBid);
}

export function maxSafeBidFromRoi(
  netSell: number,
  desiredRoiPercent: number,
  expensesExceptBid: number,
): number {
  const roi = moneyNum(desiredRoiPercent) / 100;
  const landedMax = netSell / (1 + roi);
  return roundMoney(landedMax - expensesExceptBid);
}

/** More conservative of profit-target and ROI-target max bids. Floor at 0. */
export function maxSafeBid(
  netSell: number,
  desiredMinProfit: number,
  desiredRoiPercent: number,
  expensesExceptBid: number,
): number {
  const profitBid = maxSafeBidFromProfit(netSell, desiredMinProfit, expensesExceptBid);
  const roiBid = maxSafeBidFromRoi(netSell, desiredRoiPercent, expensesExceptBid);
  return roundMoney(Math.max(0, Math.min(profitBid, roiBid)));
}

export function remainingBidRoom(maxBid: number, currentBid: number): number {
  return roundMoney(maxBid - moneyNum(currentBid));
}

export interface AcquisitionResult {
  expensesExceptBid: number;
  landedCost: number;
  netExpectedSellingPrice: number;
  projectedProfit: number;
  roiPercent: number;
  maxSafeBidProfit: number;
  maxSafeBidRoi: number;
  maxSafeBid: number;
  remainingBidRoom: number;
}

export function calculateAcquisition(
  costs: AcquisitionCosts,
  targets: ProfitTargets,
  winningBid = costs.expectedWinningBid,
): AcquisitionResult {
  const expenses = expensesExceptWinningBid(costs);
  const netSell = netExpectedSellingPrice(targets);
  const landed = landedCost(costs, winningBid);
  const profit = projectedProfit(netSell, landed);
  const roi = roiPercent(profit, landed);
  const profitBid = maxSafeBidFromProfit(netSell, targets.desiredMinProfit, expenses);
  const roiBid = maxSafeBidFromRoi(netSell, targets.desiredRoi, expenses);
  const maxBid = maxSafeBid(netSell, targets.desiredMinProfit, targets.desiredRoi, expenses);
  return {
    expensesExceptBid: expenses,
    landedCost: landed,
    netExpectedSellingPrice: netSell,
    projectedProfit: profit,
    roiPercent: roi,
    maxSafeBidProfit: Math.max(0, profitBid),
    maxSafeBidRoi: Math.max(0, roiBid),
    maxSafeBid: maxBid,
    remainingBidRoom: remainingBidRoom(maxBid, costs.currentBid),
  };
}
