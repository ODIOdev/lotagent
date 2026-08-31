/** Same spreads as the demo valuation adapter: retail is asking, wholesale is book, trade-in is below book. */
export function bandsFromRetail(retailUsd: number) {
  const retail = Math.max(500, Math.round(retailUsd / 50) * 50);
  const wholesale = Math.max(400, Math.round(retail / 1.18 / 50) * 50);
  const tradeIn = Math.max(300, Math.round((wholesale * 0.86) / 50) * 50);
  return { tradeInUsd: tradeIn, wholesaleUsd: wholesale, retailUsd: retail, estimateUsd: retail };
}
