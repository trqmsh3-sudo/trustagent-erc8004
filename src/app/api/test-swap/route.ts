import { NextResponse } from "next/server";
import { executeSwap } from "@/lib/uniswap";

export async function GET() {
  try {
    const txHash = await executeSwap("BUY", 0.001);
    return NextResponse.json({ success: true, txHash });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Swap failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
