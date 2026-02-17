"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Newspaper, TrendingUp, TrendingDown, DollarSign,
  Globe, Building2, Pickaxe, Droplets, Flame,
  Clock, ExternalLink, Filter, Star, RefreshCw,
  X, Sparkles, Bell, Zap
} from "lucide-react";

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

interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  icon: any;
}

// Generate more detailed mock content
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

// Initial mock news data
const initialNews: NewsItem[] = [
  {
    id: "1",
    title: "Oljeprisen stiger etter OPEC+ produksjonskutt",
    summary: "Brent-olje har steget 3% etter at OPEC+ annonserte videre produksjonskutt. Dette påvirker norsk økonomi positivt.",
    fullContent: generateFullContent("Oljeprisen stiger", "Brent-olje har steget 3%"),
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
    fullContent: generateFullContent("Norsk krona styrker seg", "NOK/EUR har falt til 11,45"),
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
    fullContent: generateFullContent("Gullpris rekord", "Gull har steget til historiske høyder"),
    source: "Yahoo Finance",
    category: "commodities",
    url: "https://finance.yahoo.com/gold",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: true,
  },
];

// Breaking news templates for live updates
const breakingNewsTemplates = [
  {
    title: "BREAKING: Stort oljefunn i Nordsjøen",
    summary: "Equinor har annonsert et betydelig oljefunn som kan inneholde opptil 500 millioner fat olje.",
    category: "energy",
    source: "E24",
  },
  {
    title: "Norges Bank holder renten uendret",
    summary: "Styringsrenten blir uendret på 4.50%. Dette var forventet av markedet.",
    category: "markets",
    source: "Finansavisen",
  },
  {
    title: "Kobberprisen eksploderer på grønn etterspørsel",
    summary: "Elektrifisering og vindkraft presser kobberprisen til nye høyder.",
    category: "commodities",
    source: "Yahoo Finance",
  },
  {
    title: "Oslo Børs stenger på ny rekord",
    summary: "Hovedindeksen steg 1.8% og satte ny all-time high.",
    category: "markets",
    source: "E24",
  },
  {
    title: "Naturgassprisene stiger kraftig i Europa",
    summary: "Kaldt vær og redusert lagring fører til høyere gasspriser.",
    category: "energy",
    source: "Finansavisen",
  },
];

const mockCommodities: CommodityPrice[] = [
  { symbol: "BRENT", name: "Brent Oil", price: 83.45, change: 2.15, changePercent: 2.64, unit: "USD/bbl", icon: Droplets },
  { symbol: "GOLD", name: "Gold", price: 2145.30, change: 28.50, changePercent: 1.35, unit: "USD/oz", icon: Star },
  { symbol: "COPPER", name: "Copper", price: 3.92, change: 0.08, changePercent: 2.08, unit: "USD/lb", icon: Pickaxe },
  { symbol: "NATGAS", name: "Natural Gas", price: 2.85, change: -0.15, changePercent: -5.00, unit: "USD/MMBtu", icon: Flame },
  { symbol: "ALUM", name: "Aluminium", price: 2250.00, change: 45.00, changePercent: 2.04, unit: "USD/ton", icon: Building2 },
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

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return "Today";
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [commodities, setCommodities] = useState<CommodityPrice[]>(mockCommodities);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSource, setSelectedSource] = useState("All");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [newArticleAlert, setNewArticleAlert] = useState<NewsItem | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Live auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add new breaking news
      if (Math.random() > 0.7) {
        const template = breakingNewsTemplates[Math.floor(Math.random() * breakingNewsTemplates.length)];
        const newArticle: NewsItem = {
          id: `breaking-${Date.now()}`,
          title: template.title,
          summary: template.summary,
          fullContent: generateFullContent(template.title, template.summary),
          source: template.source,
          category: template.category,
          url: "#",
          publishedAt: new Date().toISOString(),
          isRead: false,
          isStarred: false,
        };

        setNews((prev) => [newArticle, ...prev]);
        setNewArticleAlert(newArticle);
        setLastUpdate(Date.now());

        // Play notification sound (optional)
        if (typeof window !== "undefined") {
          // You can add audio notification here
        }
      }

      // Update commodity prices slightly
      setCommodities((prev) =>
        prev.map((comm) => ({
          ...comm,
          price: comm.price * (1 + (Math.random() - 0.5) * 0.01),
          change: comm.change + (Math.random() - 0.5) * 0.5,
          changePercent: comm.changePercent + (Math.random() - 0.5) * 0.2,
        }))
      );
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Clear new article alert after 5 seconds
  useEffect(() => {
    if (newArticleAlert) {
      const timeout = setTimeout(() => {
        setNewArticleAlert(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [newArticleAlert]);

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

  const openArticle = (item: NewsItem) => {
    setSelectedArticle(item);
    // Mark as read
    setNews((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i))
    );
  };

  const refreshData = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    setLastUpdate(Date.now());
  };

  const unreadCount = news.filter((n) => !n.isRead).length;
  const starredCount = news.filter((n) => n.isStarred).length;

  return (
    <div className="space-y-6">
      {/* New Article Alert */}
      {newArticleAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
          <div className="bg-[#13131f] border border-amber-500/30 rounded-xl p-4 shadow-xl max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Breaking News</p>
                <p className="text-xs text-[#8a8a9a] line-clamp-2">{newArticleAlert.title}</p>
                <button
                  onClick={() => {
                    openArticle(newArticleAlert);
                    setNewArticleAlert(null);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 mt-2 flex items-center gap-1"
                >
                  Read now <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => setNewArticleAlert(null)}
                className="text-[#5a5a6a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-[#5b8aff]" />
            News & Markets
          </h1>
          <p className="text-[#8a8a9a] text-sm mt-1">
            Live updates • Finance, commodities, and markets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Live</span>
          </div>

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

      {/* Commodity Prices */}
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
                <span className={`text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {isPositive ? "+" : ""}{commodity.changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-xs text-[#5a5a6a] uppercase tracking-wider">{commodity.symbol}</p>
              <p className="text-lg font-semibold text-white">{commodity.price.toFixed(2)}</p>
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
                  onClick={() => openArticle(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    item.isRead
                      ? "bg-[#13131f] border-white/[0.04] opacity-70"
                      : "bg-[#13131f] border-white/[0.06] hover:border-white/[0.1]"
                  } ${item.title.startsWith("BREAKING") ? "border-l-2 border-l-amber-500" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(item.id);
                      }}
                      className={`mt-0.5 ${item.isStarred ? "text-amber-400" : "text-[#5a5a6a] hover:text-amber-400"}`}
                    >
                      <Star className="w-4 h-4" fill={item.isStarred ? "currentColor" : "none"} />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {item.title.startsWith("BREAKING") && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">BREAKING</span>
                        )}
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

                        <span className="text-xs text-[#5b8aff] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to read <ExternalLink className="w-3 h-3" />
                        </span>
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
        </div>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
                }`}>
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-[#5a5a6a]">{selectedArticle.source}</span>
              </div>
              
              <button 
                onClick={() => setSelectedArticle(null)}
                className="p-2 rounded-lg hover:bg-white/[0.04] text-[#5a5a6a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{selectedArticle.title}</h2>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-[#f0f0f5] whitespace-pre-line leading-relaxed">{selectedArticle.fullContent}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#5a5a6a]">
                  <Clock className="w-4 h-4" />
                  {getRelativeTime(selectedArticle.publishedAt)}
                </div>

                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#5b8aff] text-white rounded-lg hover:bg-[#5b8aff]/90 transition-colors"
                >
                  Read full article
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
