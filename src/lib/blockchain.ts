import { ethers } from "ethers";

export function getWallet() {
  const provider = new ethers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`
  );
  return new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
}

export async function recordValidation(hash: string): Promise<string> {
  try {
    const wallet = getWallet();
    const address = await wallet.getAddress();
    const tx = await wallet.sendTransaction({
      to: address,
      value: BigInt(0),
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
    const tx = await wallet.sendTransaction({
      to: address,
      value: BigInt(0),
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
