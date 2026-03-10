import { NextResponse } from "next/server";
import { getWallet } from "@/lib/blockchain";

export async function GET() {
  try {
    const wallet = getWallet();
    const address = await wallet.getAddress();

    return NextResponse.json({ address });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
