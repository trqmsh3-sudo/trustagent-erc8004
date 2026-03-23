const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

const CACHE_TTL = 30_000; // 30 seconds
let cachedPrice: number | null = null;
let lastFetchTime = 0;

export async function getETHPrice(): Promise<number> {
  const now = Date.now();

  if (cachedPrice !== null && now - lastFetchTime < CACHE_TTL) {
    return cachedPrice;
  }

  try {
    const response = await fetch(COINGECKO_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    cachedPrice = data.ethereum.usd as number;
    lastFetchTime = now;
    return cachedPrice;
  } catch {
    if (cachedPrice !== null) return cachedPrice;
    throw new Error("Failed to fetch ETH price");
  }
}
