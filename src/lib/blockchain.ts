import { ethers } from "ethers";

export function getWallet(): ethers.Wallet {
  const privateKey = process.env.PRIVATE_KEY;
  const infuraKey = process.env.INFURA_KEY;

  if (!privateKey) throw new Error("PRIVATE_KEY environment variable is not set");
  if (!infuraKey) throw new Error("INFURA_KEY environment variable is not set");

  const provider = new ethers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${infuraKey}`
  );

  return new ethers.Wallet(privateKey, provider);
}

export async function recordValidation(hash: string): Promise<string> {
  try {
    const wallet = getWallet();
    const address = await wallet.getAddress();

    const tx = await wallet.sendTransaction({
      to: address,
      value: 0n,
      data: ethers.hexlify(ethers.toUtf8Bytes(hash)),
    });

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction receipt is null");

    return receipt.hash;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record validation";
    throw new Error(`Blockchain validation failed: ${message}`);
  }
}
