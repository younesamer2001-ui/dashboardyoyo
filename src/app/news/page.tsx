"use client";

import { useState, useEffect } from "react";
import {
  Newspaper, TrendingUp, TrendingDown, DollarSign,
  Globe, Building2, Pickaxe, Droplets, Flame,
  Clock, ExternalLink, Filter, Star, RefreshCw
} from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
  isRead: boolean;
  isStarred: boolean;
}

interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  icon: any;
}

// Mock news data - In production, this would come from RSS/APIs
const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "Oljeprisen stiger etter OPEC+ produksjonskutt",
    summary: "Brent-olje har steget 3% etter at OPEC+ annonserte videre produksjonskutt. Dette påvirker norsk økonomi positivt.",
    source: "E24",
    category: "energy",
    url: "https://e24.no/olje",
    publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: true,
  },
  {
    id: "2",
    title: "Norsk krona styrker seg mot euro",
    summary: "NOK/EUR har falt til 11,45 etter sterke oljepriser og positive makrotall fra Norge.",
    source: "Finansavisen",
    category: "forex",
    url: "https://finansavisen.no/valuta",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: false,
  },
  {
    id: "3",
    title: "Gullpris når ny rekord - over $2,100 per unse",
    summary: "Gull har steget til historiske høyder på grunn av usikkerhet om rentebanen og geopolitisk spenning.",
    source: "Yahoo Finance",
    category: "commodities",
    url: "https://finance.yahoo.com/gold",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: true,
  },
  {
    id: "4",
    title: "Kobberprisen stiger på grønn energi-etterspørsel",
    summary: "Økt etterspørsel fra EV-industrien og vindkraft presser kobberprisen opp. Viktig for grønn omstilling.",
    source: "E24",
    category: "commodities",
    url: "https://e24.no/kobber",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: false,
  },
  {
    id: "5",
    title: "Oslo Børs opp 1,2% - Equinor og Yara leder an",
    summary: "Høye olje- og gjødselpriser gir sterk dag på børsen. Energy-sektoren er i fokus.",
    source: "Finansavisen",
    category: "markets",
    url: "https://finansavisen.no/oslobors",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: false,
  },
  {
    id: "6",
    title: "Naturgasspriser faller på mild vær i Europa",
    summary: "TTF-gassprisene har falt 5% denne uken på grunn av mildere temperaturer og høye lagrenivåer.",
    source: "E24",
    category: "energy",
    url: "https://e24.no/gass",
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
  },
  {
    id: "7",
    title: "Aluminium: Kina reduserer eksport - prisene stiger",
    summary: "Kinesiske produksjonskutt fører til høyere aluminiumspriser. Påvirker bil- og byggeindustrien.",
    source: "Yahoo Finance",
    category: "commodities",
    url: "https://finance.yahoo.com/aluminium",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: true,
  },
];

// Mock commodity prices
const mockCommodities: CommodityPrice[] = [
  {
    symbol: "BRENT",
    name: "Brent Oil",
    price: 83.45,
    change: 2.15,
    changePercent: 2.64,
    unit: "USD/bbl",
    icon: Droplets,
  },
  {
    symbol: "GOLD",
    name: "Gold",
    price: 2145.30,
    change: 28.50,
    changePercent: 1.35,
    unit: "USD/oz",
    icon: Star,
  },
  {
    symbol: "COPPER",
    name: "Copper",
    price: 3.92,
    change: 0.08,
    changePercent: 2.08,
    unit: "USD/lb",
    icon: Pickaxe,
  },
  {
    symbol: "NATGAS",
    name: "Natural Gas",
    price: 2.85,
    change: -0.15,
    changePercent: -5.00,
    unit: "USD/MMBtu",
    icon: Flame,
  },
  {
    symbol: "ALUM",
    name: "Aluminium",
    price: 2250.00,
    change: 45.00,
    changePercent: 2.04,
    unit: "USD/ton",
    icon: Building2,
  },
];

const categories = [
  { id: "all", label: "All News", icon: Newspaper },
  { id: "energy", label: "Energy", icon: Flame },
  { id: "commodities", label: "Commodities", icon: Pickaxe },
  { id: "markets", label: "Markets", icon: TrendingUp },
  { id: "forex", label: "Forex", icon: DollarSign },
];

const sources = ["All", "E24", "Finansavisen", "Yahoo Finance"];

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>(mockNews);
  const [commodities, setCommodities] = useState<CommodityPrice[]>(mockCommodities);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSource, setSelectedSource] = useState("All");
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const filteredNews = news.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (selectedSource !== "All" && item.source !== selectedSource) return false;
    if (showStarredOnly && !item.isStarred) return false;
    return true;
  });

  const toggleStar = (id: string) => {
    setNews((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      )
    );
  };

  const markAsRead = (id: string) => {
    setNews((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
    );
  };

  const refreshData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const unreadCount = news.filter((n) => !n.isRead).length;
  const starredCount = news.filter((n) => n.isStarred).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-[#5b8aff]" />
            News & Markets
          </h1>
          <p className="text-[#8a8a9a] text-sm mt-1">
            Finance, commodities, and market updates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8a8a9a] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04]">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-sm text-[#8a8a9a]">{unreadCount} unread</span>
          </div>
        </div>
      </div>

      {/* Commodity Prices Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {commodities.map((commodity) => {
          const Icon = commodity.icon;
          const isPositive = commodity.change >= 0;

          return (
            <div
              key={commodity.symbol}
              className="p-4 rounded-xl bg-[#13131f] border border-white/[0.06] hover:border-white/[0.1] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-[#5a5a6a]" />
                <span
                  className={`text-xs font-medium ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {commodity.changePercent.toFixed(2)}%
                </span>
              </div>

              <p className="text-xs text-[#5a5a6a] uppercase tracking-wider">
                {commodity.symbol}
              </p>
              <p className="text-lg font-semibold text-white">
                {commodity.price.toLocaleString()}
              </p>
              <p className="text-xs text-[#5a5a6a]">{commodity.unit}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* News Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
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
                <option key={source} value={source}>
                  {source}
                </option>
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
              <Star className="w-3.5 h-3.5" />
              Starred
            </button>
          </div>

          {/* News List */}
          <div className="space-y-3">
            {filteredNews.length === 0 ? (
              <div className="text-center py-12">
                <Newspaper className="w-12 h-12 text-[#5a5a6a] mx-auto mb-4" />
                <p className="text-[#8a8a9a]">No news found</p>
              </div>
            ) : (
              filteredNews.map((item) => (
                <article
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
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
                        toggleStar(item.id);
                      }}
                      className={`mt-0.5 ${
                        item.isStarred
                          ? "text-amber-400"
                          : "text-[#5a5a6a] hover:text-amber-400"
                      }`}
                    >
                      <Star
                        className="w-4 h-4"
                        fill={item.isStarred ? "currentColor" : "none"}
                      />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            item.category === "energy"
                              ? "bg-orange-500/10 text-orange-400"
                              : item.category === "commodities"
                              ? "bg-amber-500/10 text-amber-400"
                              : item.category === "markets"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {item.category}
                        </span>
                        <span className="text-xs text-[#5a5a6a]">
                          {item.source}
                        </span>
                        {!item.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5b8aff]" />
                        )}
                      </div>

                      <h3
                        className={`font-medium mb-1 ${
                          item.isRead ? "text-[#8a8a9a]" : "text-white"
                        }`}
                      >
                        {item.title}
                      </h3>

                      <p className="text-sm text-[#8a8a9a] line-clamp-2 mb-2">
                        {item.summary}
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#5a5a6a] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(item.publishedAt)}
                        </span>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-[#5b8aff] hover:text-[#7ca4ff] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Read more
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="p-4 rounded-xl bg-[#13131f] border border-white/[0.06]">
            <h3 className="text-sm font-medium text-white mb-3">Your Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8a9a]">Unread</span>
                <span className="text-white">{unreadCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8a9a]">Starred</span>
                <span className="text-amber-400">{starredCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8a9a]">Total</span>
                <span className="text-white">{news.length}</span>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="p-4 rounded-xl bg-[#13131f] border border-white/[0.06]">
            <h3 className="text-sm font-medium text-white mb-3">Sources</h3>
            <div className="space-y-2">
              {["E24", "Finansavisen", "Yahoo Finance"].map((source) => (
                <a
                  key={source}
                  href={`https://${source.toLowerCase().replace(" ", "")}.no`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  <span className="text-sm text-[#8a8a9a] group-hover:text-white">
                    {source}
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#5a5a6a] group-hover:text-[#5b8aff]" />
                </a>
              ))}
            </div>
          </div>

          {/* Market Status */}
          <div className="p-4 rounded-xl bg-[#13131f] border border-white/[0.06]">
            <h3 className="text-sm font-medium text-white mb-3">Market Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-[#8a8a9a]">Oslo Børs</span>
                <span className="text-emerald-400 ml-auto">Open</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-[#8a8a9a]">NYSE</span>
                <span className="text-emerald-400 ml-auto">Open</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#5a5a6a]" />
                <span className="text-[#8a8a9a]">Tokyo</span>
                <span className="text-[#5a5a6a] ml-auto">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
