const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
const BINANCE_URL =
  "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT";
const CRYPTOCOMPARE_URL =
  "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD";

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
    try {
      const response = await fetch(BINANCE_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { price?: string };
      const price = Number(data.price);

      if (!Number.isFinite(price)) {
        throw new Error("Invalid Binance price");
      }

      cachedPrice = price;
      lastFetchTime = now;
      return cachedPrice;
    } catch {
      try {
        const response = await fetch(CRYPTOCOMPARE_URL);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as { USD?: number };
        const price = Number(data.USD);

        if (!Number.isFinite(price)) {
          throw new Error("Invalid CryptoCompare price");
        }

        cachedPrice = price;
        lastFetchTime = now;
        return cachedPrice;
      } catch {
        if (cachedPrice !== null) return cachedPrice;
        throw new Error("Failed to fetch ETH price");
      }
    }
  }
}
