import { GoogleGenerativeAI } from "@google/generative-ai";

export interface TradeDecision {
  decision: "BUY" | "SELL" | "HOLD";
  reason: string;
  confidence: number;
  timestamp: string;
  priceChange: number;
  aiPowered: boolean;
}

function fallbackDecision(
  currentPrice: number,
  priceChange: number
): { decision: TradeDecision["decision"]; reason: string; confidence: number } {
  const absChange = Math.abs(priceChange);
  const changeStr = absChange.toFixed(1);

  if (priceChange <= -3) {
    const confidence = Math.min(100, Math.round(absChange * 10));
    let reason: string;
    if (absChange >= 7) {
      reason = `ETH crashed ${changeStr}% — severe oversold territory. Strong accumulation zone with ${confidence}% confidence. Expecting dead cat bounce.`;
    } else if (absChange >= 5) {
      reason = `ETH dropped ${changeStr}% — heavy selling pressure exhausting. Entering deep accumulation zone with ${confidence}% confidence.`;
    } else {
      reason = `ETH dipped ${changeStr}% — oversold signal detected. Entering accumulation zone with ${confidence}% confidence.`;
    }
    return { decision: "BUY", reason, confidence };
  }

  if (priceChange >= 5) {
    const confidence = Math.min(100, Math.round(absChange * 8));
    let reason: string;
    if (absChange >= 10) {
      reason = `ETH surged ${changeStr}% — parabolic move above resistance. Taking profit immediately. Reversal highly probable at ${confidence}% confidence.`;
    } else if (absChange >= 7) {
      reason = `ETH rallied ${changeStr}% above key resistance — overbought territory. Strong upward momentum likely to reverse. Exiting with ${confidence}% confidence.`;
    } else {
      reason = `ETH gained ${changeStr}% past resistance level — taking profit. Momentum may be peaking. Sell signal at ${confidence}% confidence.`;
    }
    return { decision: "SELL", reason, confidence };
  }

  const confidence = Math.max(0, Math.round(100 - absChange * 20));
  const priceStr = `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const direction = priceChange >= 0 ? "+" : "";
  let reason: string;
  if (absChange < 0.5) {
    reason = `ETH moved ${direction}${changeStr}% — consolidating near ${priceStr}. Market indecisive, waiting for stronger confirmation before entry.`;
  } else if (priceChange > 0) {
    reason = `ETH climbed ${direction}${changeStr}% — momentum building but insufficient for entry. Monitoring for breakout above ${priceStr}.`;
  } else {
    reason = `ETH slipped ${changeStr}% — mild bearish pressure near ${priceStr}. Not yet in accumulation zone, watching for deeper pullback.`;
  }
  return { decision: "HOLD", reason, confidence };
}

async function callGemini(
  currentPrice: number,
  previousPrice: number,
  priceChange: number
): Promise<{ decision: TradeDecision["decision"]; reason: string; confidence: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert crypto trading AI. Current ETH price: $${currentPrice}, previous: $${previousPrice}, change: ${priceChange.toFixed(2)}%. Decide BUY, SELL, or HOLD. Respond ONLY with JSON: {"decision": "BUY"|"SELL"|"HOLD", "reason": "string", "confidence": number_0_to_100}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Gemini response");

  const parsed = JSON.parse(jsonMatch[0]);

  const validDecisions = ["BUY", "SELL", "HOLD"];
  if (!validDecisions.includes(parsed.decision)) throw new Error("Invalid decision from Gemini");

  return {
    decision: parsed.decision as TradeDecision["decision"],
    reason: typeof parsed.reason === "string" ? parsed.reason : "AI analysis complete",
    confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 50))),
  };
}

export function makeTradeDecision(
  currentPrice: number,
  previousPrice: number
): TradeDecision {
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  const { decision, reason, confidence } = fallbackDecision(currentPrice, priceChange);

  return {
    decision,
    reason,
    confidence,
    timestamp: new Date().toISOString(),
    priceChange: Math.round(priceChange * 100) / 100,
    aiPowered: false,
  };
}

export async function makeTradeDecisionAsync(
  currentPrice: number,
  previousPrice: number
): Promise<TradeDecision> {
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  const absChange = Math.abs(priceChange);

  // If price change < 0.5%, auto HOLD without calling Gemini
  if (absChange < 0.5) {
    const { decision, reason, confidence } = fallbackDecision(currentPrice, priceChange);
    return {
      decision,
      reason,
      confidence,
      timestamp: new Date().toISOString(),
      priceChange: Math.round(priceChange * 100) / 100,
      aiPowered: false,
    };
  }

  // Price moved enough — call Gemini
  try {
    const { decision, reason, confidence } = await callGemini(
      currentPrice,
      previousPrice,
      priceChange
    );

    return {
      decision,
      reason,
      confidence,
      timestamp: new Date().toISOString(),
      priceChange: Math.round(priceChange * 100) / 100,
      aiPowered: true,
    };
  } catch (err) {
    console.error("[Gemini fallback]", err);
    // Fallback to rule-based logic if Gemini fails
    const { decision, reason, confidence } = fallbackDecision(currentPrice, priceChange);
    return {
      decision,
      reason,
      confidence,
      timestamp: new Date().toISOString(),
      priceChange: Math.round(priceChange * 100) / 100,
      aiPowered: false,
    };
  }
}
