import { NextRequest, NextResponse } from "next/server";
import { getETHPrice } from "@/lib/priceService";
import { makeTradeDecisionAsync } from "@/lib/agent";
import { buildValidationArtifact } from "@/lib/erc8004";
import { recordValidation } from "@/lib/blockchain";
import { executeSwap } from "@/lib/uniswap";
import { checkRiskLimits, recordSpend, getAgentStatus } from "@/lib/riskManager";
import { getScore, updateScore } from "@/lib/reputationManager";
import { getAgentCard } from "@/lib/identityRegistry";

let previousPrice: number | null = null;

export async function GET(request: NextRequest) {
  try {
    const mock = request.nextUrl.searchParams.get("mock") === "true";
    const currentPrice = await getETHPrice();

    if (previousPrice === null) {
      previousPrice = currentPrice;
    }

    const decision = await makeTradeDecisionAsync(currentPrice, previousPrice);
    const validation = buildValidationArtifact(decision);

    let txHash: string | null = null;
    let blockchainError: string | undefined;

    if (mock) {
      txHash = `0xMOCK_${Date.now()}`;
    } else {
      try {
        txHash = await recordValidation(validation.hash);
      } catch (err) {
        blockchainError =
          err instanceof Error ? err.message : "Failed to record on blockchain";
      }
    }

    let swapTxHash: string | null = null;
    let swapError: string | undefined;
    let riskBlocked = false;

    if (decision.decision !== "HOLD") {
      const riskCheck = checkRiskLimits(0.001);

      if (!riskCheck.allowed) {
        riskBlocked = true;
        swapError = riskCheck.reason;
        updateScore("RISK_BLOCKED");
      } else if (mock) {
        swapTxHash = `0xSWAP_MOCK_${Date.now()}`;
        recordSpend(0.001);
        updateScore("TRADE_EXECUTED");
      } else {
        try {
          swapTxHash = await executeSwap(decision.decision, 0.001);
          recordSpend(0.001);
          updateScore("TRADE_EXECUTED");
        } catch (err) {
          swapError =
            err instanceof Error ? err.message : "Swap execution failed";
        }
      }
    } else {
      updateScore("HOLD_STABLE");
    }

    previousPrice = currentPrice;

    return NextResponse.json({
      ...decision,
      currentPrice,
      validation,
      txHash,
      ...(blockchainError && { blockchainError }),
      swapTxHash,
      ...(swapError && { swapError }),
      riskBlocked,
      agentStatus: getAgentStatus(),
      reputationScore: getScore(),
      agentIdentity: getAgentCard(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface PostBody {
  previousPrice: number;
  currentPrice: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;

    if (
      typeof body.previousPrice !== "number" ||
      typeof body.currentPrice !== "number"
    ) {
      return NextResponse.json(
        { error: "Both previousPrice and currentPrice must be numbers" },
        { status: 400 }
      );
    }

    const decision = await makeTradeDecisionAsync(body.currentPrice, body.previousPrice);
    const validation = buildValidationArtifact(decision);

    return NextResponse.json({ ...decision, validation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
