export interface TradeDecision {
  decision: "BUY" | "SELL" | "HOLD";
  reason: string;
  confidence: number;
  timestamp: string;
  priceChange: number;
}

export function makeTradeDecision(
  currentPrice: number,
  previousPrice: number
): TradeDecision {
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  const absChange = Math.abs(priceChange);
  const changeStr = absChange.toFixed(1);

  let decision: TradeDecision["decision"];
  let reason: string;
  let confidence: number;

  if (priceChange <= -3) {
    decision = "BUY";
    reason = `Price dropped ${changeStr}% — buying opportunity detected`;
    confidence = Math.min(100, Math.round(absChange * 10));
  } else if (priceChange >= 5) {
    decision = "SELL";
    reason = `Price rose ${changeStr}% — taking profit recommended`;
    confidence = Math.min(100, Math.round(absChange * 8));
  } else {
    decision = "HOLD";
    reason = `Price changed ${priceChange >= 0 ? "+" : ""}${changeStr}% — no strong signal`;
    confidence = Math.max(0, Math.round(100 - absChange * 20));
  }

  return {
    decision,
    reason,
    confidence,
    timestamp: new Date().toISOString(),
    priceChange: Math.round(priceChange * 100) / 100,
  };
}
