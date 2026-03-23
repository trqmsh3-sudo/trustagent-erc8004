import { NextResponse } from "next/server";
import { getETHPrice } from "@/lib/priceService";
import { makeTradeDecisionAsync } from "@/lib/agent";

export async function GET() {
  try {
    const currentPrice = await getETHPrice();
    const previousPrice = currentPrice / 1.02; // simulate a +2% change

    const decision = await makeTradeDecisionAsync(currentPrice, previousPrice);

    return NextResponse.json(decision);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
