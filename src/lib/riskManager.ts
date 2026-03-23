import { getScore } from "./reputationManager";

type AgentStatus = "ACTIVE" | "SUSPENDED";

let dailySpent = 0;
let lastResetDate = new Date().toDateString();
let status: AgentStatus = "ACTIVE";

function checkDayReset() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailySpent = 0;
    lastResetDate = today;
  }
}

function getLimits() {
  const score = getScore();
  let maxPerTrade = 0.001;
  let maxPerDay = 0.05;
  let mode: "Conservative" | "Normal" | "Aggressive" = "Normal";

  if (score > 75) {
    maxPerTrade = 0.002;
    maxPerDay = 0.08;
    mode = "Aggressive";
  } else if (score < 25) {
    maxPerTrade = 0.0005;
    maxPerDay = 0.02;
    mode = "Conservative";
  }

  return { maxPerTrade, maxPerDay, mode };
}

export function checkRiskLimits(amountInETH: number): {
  allowed: boolean;
  reason: string;
} {
  checkDayReset();

  if (status === "SUSPENDED") {
    return { allowed: false, reason: "Agent is suspended due to excessive daily losses" };
  }

  const { maxPerTrade, maxPerDay } = getLimits();

  if (amountInETH > maxPerTrade) {
    return {
      allowed: false,
      reason: `Trade amount ${amountInETH} ETH exceeds per-trade limit of ${maxPerTrade} ETH`,
    };
  }

  if (dailySpent + amountInETH > maxPerDay) {
    return {
      allowed: false,
      reason: `Daily budget exhausted. Spent: ${dailySpent.toFixed(4)} ETH, limit: ${maxPerDay} ETH`,
    };
  }

  return { allowed: true, reason: "Trade within risk limits" };
}

export function recordSpend(amountInETH: number) {
  checkDayReset();
  dailySpent += amountInETH;

  if (dailySpent > 0.03) {
    status = "SUSPENDED";
  }
}

export function getAgentStatus() {
  checkDayReset();
  const { maxPerTrade, maxPerDay, mode } = getLimits();

  return {
    status,
    dailySpent: Math.round(dailySpent * 10000) / 10000,
    dailyLimit: maxPerDay,
    maxPerTrade,
    riskMode: mode,
  };
}

export function resetSuspension() {
  status = "ACTIVE";
  dailySpent = 0;
}
