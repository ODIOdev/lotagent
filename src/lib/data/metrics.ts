import { calculateAcquisition } from "@/lib/calc/acquisition";
import { decideAcquisition } from "@/lib/calc/decision";
import { opportunityScore } from "@/lib/calc/opportunity";
import type { AppState, Worksheet } from "@/lib/types";

export function worksheetMetrics(sheet: Worksheet, state: AppState) {
  const result = calculateAcquisition(sheet.costs, sheet.profitTargets);
  const decision = decideAcquisition(
    result,
    sheet.vehicle,
    sheet.conditionItems,
    state.settings.decisionThresholds,
    sheet.costs.currentBid,
  );
  const opportunity = opportunityScore(
    result,
    sheet.vehicle,
    sheet.conditionItems,
    sheet.profitTargets.desiredRoi,
    sheet.profitTargets.desiredMinProfit,
    sheet.profitTargets.estimatedDaysToSell,
  );
  return { result, decision, opportunity };
}

export function watchlistSheets(state: AppState): Worksheet[] {
  return state.watchlistIds
    .map((id) => state.worksheets.find((item) => item.id === id))
    .filter((item): item is Worksheet => Boolean(item));
}

export function capitalCommitted(state: AppState): number {
  return state.purchases
    .filter((item) => item.status !== "sold")
    .reduce((sum, item) => sum + item.actuals.totalCost, 0);
}

export function purchasesThisMonth(state: AppState): number {
  const now = new Date();
  return state.purchases.filter((item) => {
    const date = new Date(item.createdAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
}
