type ReputationEvent = "TRADE_EXECUTED" | "HOLD_STABLE" | "RISK_BLOCKED";

let score = 50;

const SCORE_DELTAS: Record<ReputationEvent, number> = {
  TRADE_EXECUTED: 5,
  HOLD_STABLE: 1,
  RISK_BLOCKED: -2,
};

export function getScore(): number {
  return score;
}

export function updateScore(event: ReputationEvent): number {
  score = Math.max(0, Math.min(100, score + SCORE_DELTAS[event]));
  return score;
}
