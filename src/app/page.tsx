"use client";

import { useState, useEffect } from "react";

interface TradeDecision {
  decision: "BUY" | "SELL" | "HOLD";
  reason: string;
  confidence: number;
  timestamp: string;
  priceChange: number;
  currentPrice: number;
  txHash: string | null;
}

const decisionColors: Record<string, { bg: string; text: string; ring: string }> = {
  BUY: { bg: "bg-emerald-500/20", text: "text-emerald-400", ring: "ring-emerald-500/40" },
  SELL: { bg: "bg-red-500/20", text: "text-red-400", ring: "ring-red-500/40" },
  HOLD: { bg: "bg-amber-500/20", text: "text-amber-400", ring: "ring-amber-500/40" },
};

const confidenceBarColor: Record<string, string> = {
  BUY: "bg-emerald-500",
  SELL: "bg-red-500",
  HOLD: "bg-amber-500",
};

export default function Home() {
  const [latest, setLatest] = useState<TradeDecision | null>(null);
  const [history, setHistory] = useState<TradeDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  const fetchTrade = async () => {
    try {
      setError(null);
      const res = await fetch("/api/trade");
      if (!res.ok) throw new Error("API request failed");
      const data: TradeDecision = await res.json();
      setLatest(data);
      setHistory((prev) => [data, ...prev].slice(0, 10));
      setCountdown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrade();
    const interval = setInterval(fetchTrade, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-blue-400">Trust</span>Agent
              <span className="text-gray-500 font-normal text-lg ml-2">— AI Trading Agent</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 tracking-wide uppercase">
              Powered by ERC-8004 Trustless Validation
            </p>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <div>Auto-refresh in <span className="text-gray-300 font-mono">{countdown}s</span></div>
            <button
              onClick={fetchTrade}
              className="mt-1 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              Refresh now
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500 text-lg">Loading market data...</div>
          </div>
        ) : latest ? (
          <>
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ETH Price Card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ETH / USD</p>
                <p className="text-4xl font-bold tracking-tight">
                  ${latest.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-sm mt-2 font-medium ${latest.priceChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {latest.priceChange >= 0 ? "+" : ""}{latest.priceChange.toFixed(2)}%
                </p>
              </div>

              {/* Decision Card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Signal</p>
                <span
                  className={`inline-flex items-center px-5 py-2 rounded-full text-xl font-bold ring-1 ${decisionColors[latest.decision].bg} ${decisionColors[latest.decision].text} ${decisionColors[latest.decision].ring}`}
                >
                  {latest.decision}
                </span>
              </div>

              {/* Confidence Card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
                <p className="text-4xl font-bold tracking-tight">{latest.confidence}%</p>
                <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${confidenceBarColor[latest.decision]}`}
                    style={{ width: `${latest.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Reason Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Analysis</p>
              <p className="text-gray-200 text-lg">{latest.reason}</p>
              <p className="text-xs text-gray-600 mt-3">
                {new Date(latest.timestamp).toLocaleString()}
              </p>
            </div>

            {/* History */}
            {history.length > 1 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                  Decision History <span className="text-gray-600">(last {history.length} signals)</span>
                </p>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {history.map((item, i) => (
                    <div
                      key={`${item.timestamp}-${i}`}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ring-1 whitespace-nowrap ${decisionColors[item.decision].bg} ${decisionColors[item.decision].text} ${decisionColors[item.decision].ring}`}
                      >
                        {item.decision}
                      </span>
                      <span className="text-sm text-gray-300 flex-1 truncate">{item.reason}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap font-mono">
                        ${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {item.txHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8-8-8z" />
                          </svg>
                          Etherscan
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600 italic whitespace-nowrap">Pending...</span>
                      )}
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center text-xs text-gray-600">
          TrustAgent © {new Date().getFullYear()} — Not financial advice. Use at your own risk.
        </div>
      </footer>
    </div>
  );
}
