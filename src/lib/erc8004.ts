import { createHash } from "crypto";
import type { TradeDecision } from "./agent";

export interface ValidationArtifact {
  agentId: string;
  action: TradeDecision["decision"];
  reason: string;
  confidence: number;
  priceChange: number;
  timestamp: string;
  hash: string;
}

export function buildValidationArtifact(
  decision: TradeDecision
): ValidationArtifact {
  const hash = createHash("sha256")
    .update(JSON.stringify(decision))
    .digest("hex");

  return {
    agentId: "trustagent-v1",
    action: decision.decision,
    reason: decision.reason,
    confidence: decision.confidence,
    priceChange: decision.priceChange,
    timestamp: decision.timestamp,
    hash,
  };
}
