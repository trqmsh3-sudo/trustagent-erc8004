import { NextRequest, NextResponse } from "next/server";
import { getETHPrice } from "@/lib/priceService";
import { makeTradeDecision } from "@/lib/agent";
import { buildValidationArtifact } from "@/lib/erc8004";
import { recordValidation } from "@/lib/blockchain";

let previousPrice: number | null = null;

export async function GET(request: NextRequest) {
  try {
    const mock = request.nextUrl.searchParams.get("mock") === "true";
    const currentPrice = await getETHPrice();

    if (previousPrice === null) {
      previousPrice = currentPrice;
    }

    const decision = makeTradeDecision(currentPrice, previousPrice);
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

    previousPrice = currentPrice;

    return NextResponse.json({
      ...decision,
      currentPrice,
      validation,
      txHash,
      ...(blockchainError && { blockchainError }),
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

    const decision = makeTradeDecision(body.currentPrice, body.previousPrice);
    const validation = buildValidationArtifact(decision);

    return NextResponse.json({ ...decision, validation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
