"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Newspaper, TrendingUp, TrendingDown, DollarSign,
  Globe, Building2, Pickaxe, Droplets, Flame,
  Clock, ExternalLink, Filter, Star, RefreshCw,
  X, Bell, BarChart3
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
  isRead: boolean;
  isStarred: boolean;
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

type TimeRange = "3h" | "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

const TIME_RANGES: { key: TimeRange; label: string; minutes: number }[] = [
  { key: "3h", label: "3T", minutes: 180 },
  { key: "1d", label: "1D", minutes: 1440 },
  { key: "1w", label: "1U", minutes: 10080 },
  { key: "1m", label: "1M", minutes: 43200 },
  { key: "3m", label: "3M", minutes: 129600 },
  { key: "6m", label: "6M", minutes: 259200 },
  { key: "1y", label: "1Å", minutes: 525600 },
];

// Generate realistic price history
function generatePriceHistory(basePrice: number, volatility: number): PricePoint[] {
  const history: PricePoint[] = [];
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const points = 365 * 24; // Hourly data for a year
  
  let currentPrice = basePrice;
  
  for (let i = 0; i < points; i++) {
    const time = oneYearAgo + (i * 60 * 60 * 1000);
    const randomChange = (Math.random() - 0.5) * volatility;
    const trend = Math.sin(i / 100) * volatility * 0.5; // Add some trend
    currentPrice = currentPrice * (1 + randomChange + trend * 0.001);
    
    history.push({
      time,
      price: Math.max(currentPrice, basePrice * 0.5), // Prevent negative prices
    });
  }
  
  return history;
}

// Initial commodities with history
const createInitialCommodities = (): Commodity[] => [
  {
    symbol: "BRENT",
    name: "Brent Oil",
    currentPrice: 83.45,
    change: 2.15,
    changePercent: 2.64,
    unit: "USD/bbl",
    icon: Droplets,
    history: generatePriceHistory(83.45, 0.02),
  },
  {
    symbol: "GOLD",
    name: "Gull",
    currentPrice: 2145.30,
    change: 28.50,
    changePercent: 1.35,
    unit: "USD/oz",
    icon: Star,
    history: generatePriceHistory(2145, 0.015),
  },
  {
    symbol: "COPPER",
    name: "Kobber",
    currentPrice: 3.92,
    change: 0.08,
    changePercent: 2.08,
    unit: "USD/lb",
    icon: Pickaxe,
    history: generatePriceHistory(3.92, 0.025),
  },
  {
    symbol: "NATGAS",
    name: "Naturgass",
    currentPrice: 2.85,
    change: -0.15,
    changePercent: -5.00,
    unit: "USD/MMBtu",
    icon: Flame,
    history: generatePriceHistory(2.85, 0.04),
  },
  {
    symbol: "ALUM",
    name: "Aluminium",
    currentPrice: 2250.00,
    change: 45.00,
    changePercent: 2.04,
    unit: "USD/ton",
    icon: Building2,
    history: generatePriceHistory(2250, 0.02),
  },
  {
    symbol: "NOK",
    name: "Norsk Krone",
    currentPrice: 11.45,
    change: -0.08,
    changePercent: -0.69,
    unit: "NOK/EUR",
    icon: TrendingUp,
    history: generatePriceHistory(11.45, 0.008),
  },
  {
    symbol: "USD",
    name: "US Dollar",
    currentPrice: 1.08,
    change: 0.02,
    changePercent: 1.89,
    unit: "USD/EUR",
    icon: DollarSign,
    history: generatePriceHistory(1.08, 0.012),
  },
];

// Generate full content for articles
const generateFullContent = (title: string, summary: string): string => {
  return `${summary}

Dette er en viktig utvikling som kan ha betydelige konsekvenser for markedet. Analytikere følger situasjonen nøye.

**Nøkkelpunkter:**
• Situationen utvikler seg raskt
• Markedet reagerer positivt
• Eksperter anbefaler å følge med på videre utvikling

**Hva betyr dette for deg?**
Avhengig av din portefølje kan dette påvirke dine investeringer. Det er lurt å holde seg oppdatert på videre nyheter.

Les hele artikkelen på kilden for mer detaljert informasjon.`;
};

const initialNews: NewsItem[] = [
  {
    id: "1",
    title: "Oljeprisen stiger etter OPEC+ produksjonskutt",
    summary: "Brent-olje har steget 3% etter at OPEC+ annonserte videre produksjonskutt.",
    fullContent: generateFullContent("Oljeprisen stiger", "Brent-olje har steget 3%"),
    source: "E24",
    category: "energy",
    url: "https://e24.no/olje",
    publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: true,
  },
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
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);

  if (diffMin < 1) return "Nå";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}t`;
  return "I dag";
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("no-NO", { maximumFractionDigits: 0 });
  if (price >= 10) return price.toLocaleString("no-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString("no-NO", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export default function NewsPage() {
  const [commodities, setCommodities] = useState<Commodity[]>(createInitialCommodities());
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSource, setSelectedSource] = useState("Alle");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null);
  const [chartRange, setChartRange] = useState<TimeRange>("3m");
  const [lastHourlyUpdate, setLastHourlyUpdate] = useState(Date.now());

  // Live price updates every hour
  useEffect(() => {
    const updatePrices = () => {
      setCommodities((prev) =>
        prev.map((comm) => {
          const randomChange = (Math.random() - 0.5) * 0.02; // Max 1% change
          const newPrice = comm.currentPrice * (1 + randomChange);
          const priceChange = newPrice - comm.currentPrice;
          const percentChange = (priceChange / comm.currentPrice) * 100;

          // Add new price point to history
          const newHistoryPoint = {
            time: Date.now(),
            price: newPrice,
          };

          return {
            ...comm,
            currentPrice: newPrice,
            change: priceChange,
            changePercent: percentChange,
            history: [...comm.history.slice(-8760), newHistoryPoint], // Keep last year
          };
        })
      );
      setLastHourlyUpdate(Date.now());
    };

    // Update immediately
    updatePrices();

    // Then every hour
    const interval = setInterval(updatePrices, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  // Filter history based on selected time range
  const getFilteredHistory = (commodity: Commodity, range: TimeRange) => {
    const now = Date.now();
    const rangeConfig = TIME_RANGES.find((r) => r.key === range);
    if (!rangeConfig) return commodity.history;
    
    const cutoff = now - rangeConfig.minutes * 60 * 1000;
    return commodity.history.filter((p) => p.time >= cutoff);
  };

  // Chart data formatter
  const getChartData = (commodity: Commodity) => {
    const filtered = getFilteredHistory(commodity, chartRange);
    return filtered.map((p) => ({
      time: new Date(p.time).toLocaleDateString("no-NO", { 
        month: "short", 
        day: "numeric",
        hour: chartRange === "3h" || chartRange === "1d" ? "numeric" : undefined,
      }),
      price: p.price,
    }));
  };

  const filteredNews = news.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (selectedSource !== "Alle" && item.source !== selectedSource) return false;
    if (showStarredOnly && !item.isStarred) return false;
    return true;
  });

  const openArticle = (item: NewsItem) => {
    setSelectedArticle(item);
    setNews((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)));
  };

  const unreadCount = news.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-[#5b8aff]" />
            Nyheter & Markeder
          </h1>
          <p className="text-[#8a8a9a] text-sm mt-1">
            Live oppdatering hver time • {commodities.length} råvarer
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Live</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04]">
            <Clock className="w-4 h-4 text-[#5a5a6a]" />
            <span className="text-xs text-[#8a8a9a]">Oppdatert {getRelativeTime(new Date(lastHourlyUpdate).toISOString())}</span>
          </div>
        </div>
      </div>

      {/* Commodity Cards - Clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {commodities.map((commodity) => {
          const Icon = commodity.icon;
          const isPositive = commodity.change >= 0;

          return (
            <button
              key={commodity.symbol}
              onClick={() => setSelectedCommodity(commodity)}
              className="p-4 rounded-xl bg-[#13131f] border border-white/[0.06] hover:border-[#5b8aff]/30 hover:bg-[#13131f]/80 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-[#5a5a6a] group-hover:text-[#5b8aff] transition-colors" />
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                    {isPositive ? "+" : ""}{commodity.changePercent.toFixed(2)}%
                  </span>
                  <BarChart3 className="w-3 h-3 text-[#5a5a6a] group-hover:text-[#5b8aff]" />
                </div>
              </div>
              <p className="text-xs text-[#5a5a6a] uppercase tracking-wider">{commodity.symbol}</p>
              <p className="text-xl font-semibold text-white group-hover:text-[#5b8aff] transition-colors">
                {formatPrice(commodity.currentPrice)}
              </p>
              <p className="text-xs text-[#5a5a6a]">{commodity.unit}</p>
            </button>
          );
        })}
      </div>

      {/* News Feed */}
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
            className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#5b8aff]/30"
          >
            {sources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          <button
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showStarredOnly
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-white/[0.04] text-[#8a8a9a] border border-white/[0.06]"
            }`}
          >
            <Star className="w-3.5 h-3.5" fill={showStarredOnly ? "currentColor" : "none"} />
            Stjernemerket
          </button>
        </div>

        <div className="space-y-3">
          {filteredNews.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="w-12 h-12 text-[#5a5a6a] mx-auto mb-4" />
              <p className="text-[#8a8a9a]">Ingen nyheter funnet</p>
            </div>
          ) : (
            filteredNews.map((item) => (
              <article
                key={item.id}
                onClick={() => openArticle(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  item.isRead
                    ? "bg-[#13131f] border-white/[0.04] opacity-70"
                    : "bg-[#13131f] border-white/[0.06] hover:border-white/[0.1]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNews((prev) =>
                        prev.map((i) => (i.id === item.id ? { ...i, isStarred: !i.isStarred } : i))
                      );
                    }}
                    className={`mt-0.5 ${item.isStarred ? "text-amber-400" : "text-[#5a5a6a] hover:text-amber-400"}`}
                  >
                    <Star className="w-4 h-4" fill={item.isStarred ? "currentColor" : "none"} />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.category === "energy" ? "bg-orange-500/10 text-orange-400" :
                        item.category === "commodities" ? "bg-amber-500/10 text-amber-400" :
                        item.category === "markets" ? "bg-emerald-500/10 text-emerald-400" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>
                        {item.category}
                      </span>
                      <span className="text-xs text-[#5a5a6a]">{item.source}</span>
                      {!item.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#5b8aff]" />}
                    </div>

                    <h3 className={`font-medium mb-1 ${item.isRead ? "text-[#8a8a9a]" : "text-white"}`}>
                      {item.title}
                    </h3>

                    <p className="text-sm text-[#8a8a9a] line-clamp-2 mb-2">{item.summary}</p>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#5a5a6a] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(item.publishedAt)}
                      </span>
                      <span className="text-xs text-[#5b8aff] opacity-0 group-hover:opacity-100 transition-opacity">
                        Klikk for å lese →
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Commodity Chart Modal */}
      {selectedCommodity && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedCommodity(null)}
        >
          <div 
            className="bg-[#0f0f14] border border-white/[0.08] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0f0f14] border-b border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5b8aff]/10 flex items-center justify-center"
                  >
                    <selectedCommodity.icon className="w-6 h-6 text-[#5b8aff]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{selectedCommodity.name}</h2>
                    <p className="text-[#8a8a9a]">{selectedCommodity.symbol} • {selectedCommodity.unit}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedCommodity(null)}
                  className="p-2 rounded-lg hover:bg-white/[0.04] text-[#5a5a6a]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Current Price */}
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-white">
                  {formatPrice(selectedCommodity.currentPrice)}
                </span>
                <span className={`text-lg font-medium flex items-center gap-1 ${
                  selectedCommodity.change >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
                >
                  {selectedCommodity.change >= 0 ? "+" : ""}
                  {selectedCommodity.change.toFixed(2)} ({selectedCommodity.change >= 0 ? "+" : ""}
                  {selectedCommodity.changePercent.toFixed(2)}%)
                </span>
              </div>

              {/* Time Range Selector */}
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

            {/* Chart */}
            <div className="p-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData(selectedCommodity)}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5b8aff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#5b8aff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#5a5a6a" 
                      tick={{ fill: "#8a8a9a", fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#5a5a6a" 
                      tick={{ fill: "#8a8a9a", fontSize: 12 }}
                      tickLine={false}
                      domain={["auto", "auto"]}
                      tickFormatter={(val) => formatPrice(val)}
                    />
                    
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#13131f",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(val: number) => [formatPrice(val), "Pris"]}
                    />
                    
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#5b8aff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs text-[#5a5a6a] mb-1">Høyeste (periode)</p>
                  <p className="text-lg font-semibold text-white">
                    {formatPrice(Math.max(...getFilteredHistory(selectedCommodity, chartRange).map((p) => p.price)))}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs text-[#5a5a6a] mb-1">Laveste (periode)</p>
                  <p className="text-lg font-semibold text-white">
                    {formatPrice(Math.min(...getFilteredHistory(selectedCommodity, chartRange).map((p) => p.price)))}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs text-[#5a5a6a] mb-1">Endring (periode)</p>
                  <p className={`text-lg font-semibold ${
                    getFilteredHistory(selectedCommodity, chartRange).slice(-1)[0]?.price >=
                    getFilteredHistory(selectedCommodity, chartRange)[0]?.price
                      ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {(() => {
                      const hist = getFilteredHistory(selectedCommodity, chartRange);
                      if (hist.length < 2) return "0.00%";
                      const first = hist[0].price;
                      const last = hist[hist.length - 1].price;
                      const change = ((last - first) / first) * 100;
                      return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
                    })()}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs text-[#5a5a6a] mb-1">Volatilitet</p>
                  <p className="text-lg font-semibold text-white">
                    {(() => {
                      const hist = getFilteredHistory(selectedCommodity, chartRange);
                      if (hist.length < 2) return "0.00%";
                      const prices = hist.map((p) => p.price);
                      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
                      const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
                      const volatility = Math.sqrt(variance) / mean * 100;
                      return `${volatility.toFixed(2)}%`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="bg-[#13131f] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#13131f] border-b border-white/[0.06] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  selectedArticle.category === "energy" ? "bg-orange-500/10 text-orange-400" :
                  selectedArticle.category === "commodities" ? "bg-amber-500/10 text-amber-400" :
                  selectedArticle.category === "markets" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}
                >
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-[#5a5a6a]">{selectedArticle.source}</span>
              </div>
              
              <button onClick={() => setSelectedArticle(null)} className="p-2 rounded-lg hover:bg-white/[0.04] text-[#5a5a6a]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{selectedArticle.title}</h2>
              <p className="text-[#f0f0f5] whitespace-pre-line leading-relaxed">{selectedArticle.fullContent}</p>

              <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-sm text-[#5a5a6a] flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {getRelativeTime(selectedArticle.publishedAt)}
                </span>

                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#5b8aff] text-white rounded-lg hover:bg-[#5b8aff]/90"
                >
                  Les full artikkel
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
