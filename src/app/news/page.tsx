"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Newspaper, TrendingUp, DollarSign, Building2, Pickaxe, Droplets, Flame, Star,
  Clock, ExternalLink, Filter, RefreshCw, X, BarChart3, AlertCircle
} from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
}

interface PricePoint {
  time: number;
  price: number;
}

interface Commodity {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  unit: string;
  icon: any;
  history: PricePoint[];
}

type TimeRange = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1U" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Å" },
];

const categories = [
  { id: "all", label: "Alle", icon: Newspaper },
  { id: "energy", label: "Energi", icon: Flame },
  { id: "commodities", label: "Råvarer", icon: Pickaxe },
  { id: "markets", label: "Markeder", icon: TrendingUp },
  { id: "forex", label: "Valuta", icon: DollarSign },
];

const sources = ["Alle", "E24", "Finansavisen", "Yahoo Finance"];

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  const diffHour = Math.floor(diffMin / 60);
  if (diffMin < 1) return "Nå";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}t`;
  return date.toLocaleDateString("no-NO", { day: "numeric", month: "short" });
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("no-NO", { maximumFractionDigits: 0 });
  if (price >= 10) return price.toLocaleString("no-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString("no-NO", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

// Generate realistic price history
function generateHistory(basePrice: number, points: number): PricePoint[] {
  const history: PricePoint[] = [];
  const now = Date.now();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  
  let currentPrice = basePrice;
  
  for (let i = points; i >= 0; i--) {
    const time = now - (i / points) * oneYearMs;
    const randomChange = (Math.random() - 0.5) * 0.02;
    currentPrice = currentPrice * (1 + randomChange);
    
    history.push({
      time,
      price: Math.max(currentPrice, basePrice * 0.5),
    });
  }
  
  return history;
}

const initialCommodities: Commodity[] = [
  { symbol: "BRENT", name: "Brent Oil", currentPrice: 83.45, change: 2.15, changePercent: 2.64, unit: "USD/bbl", icon: Droplets, history: generateHistory(83.45, 365) },
  { symbol: "GOLD", name: "Gull", currentPrice: 2145.30, change: 28.50, changePercent: 1.35, unit: "USD/oz", icon: Star, history: generateHistory(2145, 365) },
  { symbol: "COPPER", name: "Kobber", currentPrice: 3.92, change: 0.08, changePercent: 2.08, unit: "USD/lb", icon: Pickaxe, history: generateHistory(3.92, 365) },
  { symbol: "NATGAS", name: "Naturgass", currentPrice: 2.85, change: -0.15, changePercent: -5.00, unit: "USD/MMBtu", icon: Flame, history: generateHistory(2.85, 365) },
  { symbol: "ALUM", name: "Aluminium", currentPrice: 2250.00, change: 45.00, changePercent: 2.04, unit: "USD/ton", icon: Building2, history: generateHistory(2250, 365) },
  { symbol: "NOK", name: "Norsk Krone", currentPrice: 11.45, change: -0.08, changePercent: -0.69, unit: "NOK/EUR", icon: TrendingUp, history: generateHistory(11.45, 365) },
  { symbol: "USD", name: "US Dollar", currentPrice: 1.08, change: 0.02, changePercent: 1.89, unit: "USD/EUR", icon: DollarSign, history: generateHistory(1.08, 365) },
];

// Mock RSS news - will be replaced with real RSS
const mockNews: NewsItem[] = [
  { id: "1", title: "Oljeprisen stiger etter OPEC+ møte", summary: "Brent-olje har steget 3% etter produksjonskutt.", source: "E24", category: "energy", url: "https://e24.no", publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: "2", title: "Norsk krona styrker seg", summary: "NOK/EUR har falt til 11,45 etter sterke oljepriser.", source: "Finansavisen", category: "forex", url: "https://finansavisen.no", publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "3", title: "Gullpris når ny rekord", summary: "Gull har steget til historiske høyder.", source: "Yahoo Finance", category: "commodities", url: "https://finance.yahoo.com", publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
];

export default function NewsPage() {
  const [commodities] = useState(initialCommodities);
  const [news, setNews] = useState(mockNews);
  const [newsLoading, setNewsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSource, setSelectedSource] = useState("Alle");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState(null as Commodity | null);
  const [chartRange, setChartRange] = useState("3m" as TimeRange);
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());

  // Fetch news on mount and every 5 minutes
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      // In production, this fetches from /api/news which uses RSS
      const response = await fetch("/api/news");
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setNews(data);
        }
      }
    } catch (error) {
      console.error("News fetch failed:", error);
    } finally {
      setNewsLoading(false);
      setLastUpdate(new Date().toISOString());
    }
  };

  const getFilteredHistory = (commodity: Commodity, range: TimeRange) => {
    const rangeDays: Record<TimeRange, number> = {
      "1d": 1, "1w": 7, "1m": 30, "3m": 90, "6m": 180, "1y": 365,
    };
    const cutoff = Date.now() - rangeDays[range] * 24 * 60 * 60 * 1000;
    return commodity.history.filter((p) => p.time >= cutoff);
  };

  const getChartData = (commodity: Commodity) => {
    const filtered = getFilteredHistory(commodity, chartRange);
    return filtered.map((p) => ({
      time: new Date(p.time).toLocaleDateString("no-NO", { 
        month: "short", 
        day: "numeric",
      }),
      price: p.price,
    }));
  };

  const filteredNews = news.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (selectedSource !== "Alle" && item.source !== selectedSource) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-[#5b8aff]" />
            Nyheter & Markeder
          </h1>
          <p className="text-[#8a8a9a] text-sm mt-1">Live oppdatering • {commodities.length} råvarer</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNews}
            disabled={newsLoading}
            className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8a8a9a] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${newsLoading ? "animate-spin" : ""}`} />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Live</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04]">
            <Clock className="w-4 h-4 text-[#5a5a6a]" />
            <span className="text-xs text-[#8a8a9a]">{getRelativeTime(lastUpdate)}</span>
          </div>
        </div>
      </div>

      {/* Commodity Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {commodities.map((commodity) => {
          const Icon = commodity.icon;
          const isPositive = commodity.change >= 0;

          return (
            <button
              key={commodity.symbol}
              onClick={() => {
                setSelectedCommodity(commodity);
                setChartRange("3m");
              }}
              className="p-4 rounded-xl bg-[#13131f] border border-white/[0.06] hover:border-[#5b8aff]/30 hover:bg-[#13131f]/80 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-[#5a5a6a] group-hover:text-[#5b8aff]" />
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                    {isPositive ? "+" : ""}{commodity.changePercent.toFixed(2)}%
                  </span>
                  <BarChart3 className="w-3 h-3 text-[#5a5a6a] group-hover:text-[#5b8aff]" />
                </div>
              </div>
              <p className="text-xs text-[#5a5a6a] uppercase tracking-wider">{commodity.symbol}</p>
              <p className="text-xl font-semibold text-white group-hover:text-[#5b8aff]">{formatPrice(commodity.currentPrice)}</p>
              <p className="text-xs text-[#5a5a6a]">{commodity.unit}</p>
            </button>
          );
        })}
      </div>

      {/* News Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-[#5b8aff]/20 text-[#5b8aff] border border-[#5b8aff]/30"
                    : "bg-white/[0.04] text-[#8a8a9a] border border-white/[0.06] hover:bg-white/[0.08]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}

          <div className="h-6 w-px bg-white/[0.1] mx-1" />

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-white"
          >
            {sources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        {/* News List */}
        <div className="space-y-3">
          {newsLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-[#5b8aff] animate-spin mx-auto mb-4" />
              <p className="text-[#8a8a9a]">Laster nyheter...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="w-12 h-12 text-[#5a5a6a] mx-auto mb-4" />
              <p className="text-[#8a8a9a]">Ingen nyheter funnet</p>
              <button 
                onClick={fetchNews}
                className="mt-4 px-4 py-2 bg-[#5b8aff]/20 text-[#5b8aff] rounded-lg text-sm"
              >
                Last nyheter nå
              </button>
            </div>
          ) : (
            filteredNews.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl bg-[#13131f] border border-white/[0.06] hover:border-white/[0.1] transition-all"
              >
                <div className="flex items-center gap-2 mb-1"
                >
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.category === "energy" ? "bg-orange-500/10 text-orange-400" :
                    item.category === "commodities" ? "bg-amber-500/10 text-amber-400" :
                    item.category === "markets" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-blue-500/10 text-blue-400"
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-xs text-[#5a5a6a]">{item.source}</span>
                </div>

                <h3 className="font-medium text-white mb-1">{item.title}</h3>
                <p className="text-sm text-[#8a8a9a] line-clamp-2">{item.summary}</p>

                <div className="flex items-center gap-2 mt-2"
                >
                  <span className="text-xs text-[#5a5a6a]">{getRelativeTime(item.publishedAt)}</span>
                  <ExternalLink className="w-3 h-3 text-[#5b8aff]" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Chart Modal */}
      {selectedCommodity && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedCommodity(null)}
        >
          <div 
            className="bg-[#0f0f14] border border-white/[0.08] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#0f0f14] border-b border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{selectedCommodity.name}</h2>
                  <p className="text-[#8a8a9a]">{selectedCommodity.symbol} • {selectedCommodity.unit}</p>
                </div>
                
                <button onClick={() => setSelectedCommodity(null)} className="p-2 rounded-lg hover:bg-white/[0.04] text-[#5a5a6a]">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-white">{formatPrice(selectedCommodity.currentPrice)}</span>
                <span className={`text-lg font-medium ${selectedCommodity.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {selectedCommodity.change >= 0 ? "+" : ""}{selectedCommodity.changePercent.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center gap-2 mt-6">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.key}
                    onClick={() => setChartRange(range.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      chartRange === range.key
                        ? "bg-[#5b8aff] text-white"
                        : "bg-white/[0.04] text-[#8a8a9a] hover:bg-white/[0.08]"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData(selectedCommodity)}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5b8aff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#5b8aff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
                    <XAxis dataKey="time" stroke="#5a5a6a" tick={{ fill: "#8a8a9a", fontSize: 12 }} tickLine={false} />
                    <YAxis stroke="#5a5a6a" tick={{ fill: "#8a8a9a", fontSize: 12 }} tickLine={false} domain={["auto", "auto"]} tickFormatter={(val) => formatPrice(val)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#13131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff" }}
                      formatter={(val) => [formatPrice(Number(val)), "Pris"]}
                    />
                    <Area type="monotone" dataKey="price" stroke="#5b8aff" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
