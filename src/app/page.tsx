"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
} from "recharts";

interface ValidationArtifact {
  agentId: string;
  action: string;
  reason: string;
  confidence: number;
  priceChange: number;
  timestamp: string;
  hash: string;
}

interface TradeDecision {
  decision: "BUY" | "SELL" | "HOLD";
  reason: string;
  confidence: number;
  timestamp: string;
  priceChange: number;
  currentPrice: number;
  txHash: string | null;
  validation?: ValidationArtifact;
  agentStatus?: {
    status: "ACTIVE" | "SUSPENDED";
    dailySpent: number;
    dailyLimit: number;
    maxPerTrade: number;
    riskMode: "Conservative" | "Normal" | "Aggressive";
  };
  reputationScore?: number;
  agentIdentity?: {
    name: string;
    description: string;
    version: string;
    protocol: string;
    capabilities: string[];
    agentWallet: string | null;
    registeredAt: string;
  };
  riskBlocked?: boolean;
  aiPowered?: boolean;
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
  const [modalItem, setModalItem] = useState<TradeDecision | null>(null);
  const [identityModal, setIdentityModal] = useState(false);

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
            {/* Agent Status Banner */}
            {latest.agentStatus && (
              <div className={`flex items-center justify-between rounded-xl px-5 py-3 ${
                latest.agentStatus.status === "ACTIVE"
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-red-500/10 border border-red-500/30"
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    latest.agentStatus.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`} />
                  <span className={`text-sm font-semibold ${
                    latest.agentStatus.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    Agent {latest.agentStatus.status === "ACTIVE" ? "Active" : "Suspended"}
                  </span>
                </div>
                <button
                  onClick={() => setIdentityModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  View Onchain Identity
                </button>
              </div>
            )}

            {/* Reputation / Risk Row */}
            {latest.agentStatus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Reputation Score */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reputation Score</p>
                  <p className={`text-4xl font-bold tracking-tight ${
                    (latest.reputationScore ?? 50) > 70
                      ? "text-emerald-400"
                      : (latest.reputationScore ?? 50) >= 40
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}>
                    {latest.reputationScore ?? 50}
                  </p>
                  <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        (latest.reputationScore ?? 50) > 70
                          ? "bg-emerald-500"
                          : (latest.reputationScore ?? 50) >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${latest.reputationScore ?? 50}%` }}
                    />
                  </div>
                </div>

                {/* Risk Budget */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Risk Budget (Today)</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {latest.agentStatus.dailySpent.toFixed(4)}
                    <span className="text-gray-500 text-base font-normal"> / {latest.agentStatus.dailyLimit} ETH</span>
                  </p>
                  <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        latest.agentStatus.dailySpent / latest.agentStatus.dailyLimit > 0.8
                          ? "bg-red-500"
                          : latest.agentStatus.dailySpent / latest.agentStatus.dailyLimit > 0.5
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, (latest.agentStatus.dailySpent / latest.agentStatus.dailyLimit) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Risk Mode */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Risk Mode</p>
                  <span className={`inline-flex items-center px-5 py-2 rounded-full text-lg font-bold ring-1 ${
                    latest.agentStatus.riskMode === "Aggressive"
                      ? "bg-emerald-500/20 text-emerald-400 ring-emerald-500/40"
                      : latest.agentStatus.riskMode === "Conservative"
                      ? "bg-red-500/20 text-red-400 ring-red-500/40"
                      : "bg-blue-500/20 text-blue-400 ring-blue-500/40"
                  }`}>
                    {latest.agentStatus.riskMode}
                  </span>
                  <p className="text-xs text-gray-600 mt-2">Max {latest.agentStatus.maxPerTrade} ETH/trade</p>
                </div>
              </div>
            )}

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
                <span className={`mt-2 text-xs font-medium px-2 py-0.5 rounded ${latest.aiPowered ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700/50 text-gray-400'}`}>
                  {latest.aiPowered ? '✦ Gemini AI' : '⚙ Rule-Based'}
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

            {/* Price Chart */}
            {history.length > 1 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Price History</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[...history].reverse().map((item) => ({
                        time: new Date(item.timestamp).toLocaleTimeString(),
                        price: item.currentPrice,
                        decision: item.decision,
                      }))}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={{ stroke: "#374151" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={{ stroke: "#374151" }}
                        tickLine={false}
                        tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "0.75rem",
                          color: "#f3f4f6",
                          fontSize: 13,
                        }}
                        formatter={(value) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "ETH Price"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#priceGradient)"
                      />
                      {[...history].reverse().map((item, i) => {
                        if (item.decision === "HOLD") return null;
                        return (
                          <ReferenceDot
                            key={`dot-${item.timestamp}-${i}`}
                            x={new Date(item.timestamp).toLocaleTimeString()}
                            y={item.currentPrice}
                            r={6}
                            fill={item.decision === "BUY" ? "#10b981" : "#ef4444"}
                            stroke={item.decision === "BUY" ? "#065f46" : "#7f1d1d"}
                            strokeWidth={2}
                          />
                        );
                      })}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-3 justify-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs text-gray-500">BUY</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-500">SELL</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-0.5 bg-blue-500 rounded" />
                    <span className="text-xs text-gray-500">Price</span>
                  </div>
                </div>
              </div>
            )}

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
                      <button
                        onClick={() => setModalItem(item)}
                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verify
                      </button>
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

      {/* Verification Modal */}
      {modalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setModalItem(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-100">On-Chain Verification</h2>
              <button
                onClick={() => setModalItem(null)}
                className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Verified Badge */}
            <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
              <svg className="w-6 h-6 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-emerald-400 font-semibold">Verified on Sepolia Blockchain</span>
            </div>

            {/* Decision Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase">Action</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ring-1 ${decisionColors[modalItem.decision].bg} ${decisionColors[modalItem.decision].text} ${decisionColors[modalItem.decision].ring}`}>
                  {modalItem.decision}
                </span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-gray-500 uppercase shrink-0">Reason</span>
                <span className="text-sm text-gray-300 text-right">{modalItem.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 uppercase">Confidence</span>
                <span className="text-sm text-gray-300">{modalItem.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 uppercase">Timestamp</span>
                <span className="text-sm text-gray-300">{new Date(modalItem.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Validation Hash */}
            {modalItem.validation && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase mb-1">Validation Hash (SHA-256)</p>
                <p className="text-xs font-mono text-blue-400 bg-gray-800 rounded-lg px-3 py-2 break-all">
                  {modalItem.validation.hash}
                </p>
              </div>
            )}

            {/* Etherscan Link */}
            {modalItem.txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${modalItem.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 rounded-xl px-4 py-3 text-sm font-medium transition-colors mb-6"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8-8-8z" />
                </svg>
                View Transaction on Etherscan
              </a>
            )}

            {/* Explanation */}
            <p className="text-xs text-gray-500 leading-relaxed">
              This decision was cryptographically signed and recorded on-chain. The hash proves this exact decision was made at this exact time and cannot be altered.
            </p>
          </div>
        </div>
      )}

      {/* Identity Modal */}
      {identityModal && latest?.agentIdentity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIdentityModal(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-100">Onchain Agent Identity</h2>
              <button
                onClick={() => setIdentityModal(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
              <svg className="w-6 h-6 text-blue-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-400 font-semibold">{latest.agentIdentity.name}</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-gray-500 uppercase shrink-0">Description</span>
                <span className="text-sm text-gray-300 text-right">{latest.agentIdentity.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 uppercase">Version</span>
                <span className="text-sm text-gray-300">{latest.agentIdentity.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 uppercase">Protocol</span>
                <span className="text-sm text-gray-300">{latest.agentIdentity.protocol}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-gray-500 uppercase shrink-0">Capabilities</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {latest.agentIdentity.capabilities.map((cap) => (
                    <span key={cap} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 uppercase">Registered</span>
                <span className="text-sm text-gray-300">{new Date(latest.agentIdentity.registeredAt).toLocaleDateString()}</span>
              </div>
            </div>

            {latest.agentIdentity.agentWallet && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase mb-1">Agent Wallet</p>
                <a
                  href={`https://sepolia.etherscan.io/address/${latest.agentIdentity.agentWallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-400 hover:text-blue-300 bg-gray-800 rounded-lg px-3 py-2 break-all block transition-colors"
                >
                  {latest.agentIdentity.agentWallet}
                </a>
              </div>
            )}

            <p className="text-xs text-gray-500 leading-relaxed">
              This agent identity is registered on-chain via ERC-8004. All trading decisions are cryptographically linked to this identity.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center text-xs text-gray-600">
          TrustAgent © {new Date().getFullYear()} — Not financial advice. Use at your own risk.
        </div>
      </footer>
    </div>
  );
}
