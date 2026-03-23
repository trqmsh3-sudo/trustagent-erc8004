import { ethers } from "ethers";
import { getWallet } from "./blockchain";

const AGENT_METADATA = {
  name: "TrustAgent v1",
  description: "Autonomous AI trading agent with on-chain validation via ERC-8004",
  version: "1.0.0",
  protocol: "ERC-8004",
  capabilities: ["price-analysis", "swap-execution", "on-chain-validation"],
};

export function getAgentCard() {
  let agentWallet: string | null = null;
  try {
    const wallet = getWallet();
    agentWallet = wallet.address;
  } catch {
    agentWallet = null;
  }

  return {
    ...AGENT_METADATA,
    agentWallet,
    registeredAt: "2026-03-09T00:00:00.000Z",
  };
}

export async function deployAgentIdentity(): Promise<{
  contractAddress: string;
  txHash: string;
}> {
  try {
    const wallet = getWallet();

    // Deploy a minimal identity contract with agent metadata in the data field
    const metadataHex = ethers.hexlify(
      ethers.toUtf8Bytes(JSON.stringify(getAgentCard()))
    );

    const tx = await wallet.sendTransaction({
      data: metadataHex,
      value: BigInt(0),
    });

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Deployment receipt is null");

    return {
      contractAddress: receipt.contractAddress ?? receipt.hash,
      txHash: receipt.hash,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Identity deployment failed";
    throw new Error(`Agent identity deployment failed: ${message}`);
  }
}
