import { ethers } from "ethers";
import { getWallet } from "./blockchain";

const UNISWAP_V2_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const DAI = "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357";

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

export async function executeSwap(
  action: "BUY" | "SELL",
  amountInETH: number
): Promise<string> {
  try {
    const wallet = getWallet();
    const address = await wallet.getAddress();
    const router = new ethers.Contract(UNISWAP_V2_ROUTER, ROUTER_ABI, wallet);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    if (action === "BUY") {
      // Swap ETH → USDC
      const amountIn = ethers.parseEther(amountInETH.toString());
      const path = [WETH, DAI];

      const tx = await router.swapExactETHForTokens(
        0, // amountOutMin: accept any amount (testnet only)
        path,
        address,
        deadline,
        { value: amountIn }
      );

      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction receipt is null");
      return receipt.hash;
    } else {
      // Swap USDC → ETH
      const dai = new ethers.Contract(DAI, ERC20_ABI, wallet);
      const amountIn = ethers.parseUnits(amountInETH.toString(), 18); // DAI has 18 decimals

      // Approve router to spend DAI if needed
      const currentAllowance = await dai.allowance(address, UNISWAP_V2_ROUTER);
      if (currentAllowance < amountIn) {
        const approveTx = await dai.approve(UNISWAP_V2_ROUTER, amountIn);
        await approveTx.wait();
      }

      const path = [DAI, WETH];

      const tx = await router.swapExactTokensForETH(
        amountIn,
        0, // amountOutMin: accept any amount (testnet only)
        path,
        address,
        deadline
      );

      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction receipt is null");
      return receipt.hash;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Swap execution failed";
    throw new Error(`Uniswap swap failed: ${message}`);
  }
}
