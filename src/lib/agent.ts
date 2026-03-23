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
    confidence = Math.min(100, Math.round(absChange * 10));
    if (absChange >= 7) {
      reason = `ETH crashed ${changeStr}% — severe oversold territory. Strong accumulation zone with ${confidence}% confidence. Expecting dead cat bounce.`;
    } else if (absChange >= 5) {
      reason = `ETH dropped ${changeStr}% — heavy selling pressure exhausting. Entering deep accumulation zone with ${confidence}% confidence.`;
    } else {
      reason = `ETH dipped ${changeStr}% — oversold signal detected. Entering accumulation zone with ${confidence}% confidence.`;
    }
  } else if (priceChange >= 5) {
    decision = "SELL";
    confidence = Math.min(100, Math.round(absChange * 8));
    if (absChange >= 10) {
      reason = `ETH surged ${changeStr}% — parabolic move above resistance. Taking profit immediately. Reversal highly probable at ${confidence}% confidence.`;
    } else if (absChange >= 7) {
      reason = `ETH rallied ${changeStr}% above key resistance — overbought territory. Strong upward momentum likely to reverse. Exiting with ${confidence}% confidence.`;
    } else {
      reason = `ETH gained ${changeStr}% past resistance level — taking profit. Momentum may be peaking. Sell signal at ${confidence}% confidence.`;
    }
  } else {
    decision = "HOLD";
    confidence = Math.max(0, Math.round(100 - absChange * 20));
    const priceStr = `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const direction = priceChange >= 0 ? "+" : "";
    if (absChange < 0.5) {
      reason = `ETH moved ${direction}${changeStr}% — consolidating near ${priceStr}. Market indecisive, waiting for stronger confirmation before entry.`;
    } else if (priceChange > 0) {
      reason = `ETH climbed ${direction}${changeStr}% — momentum building but insufficient for entry. Monitoring for breakout above ${priceStr}.`;
    } else {
      reason = `ETH slipped ${changeStr}% — mild bearish pressure near ${priceStr}. Not yet in accumulation zone, watching for deeper pullback.`;
    }
  }

  return {
    decision,
    reason,
    confidence,
    timestamp: new Date().toISOString(),
    priceChange: Math.round(priceChange * 100) / 100,
  };
}
