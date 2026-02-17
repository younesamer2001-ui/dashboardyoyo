import { NextResponse } from "next/server";
import { fetchYahooData, fetchYahooHistory } from "@/lib/market-data";
import { fetchAllNews } from "@/lib/news-data";

// Cache for market data
let marketCache: {
  data: Record<string, any>;
  timestamp: number;
} | null = null;

// Cache for news
let newsCache: {
  data: any[];
  timestamp: number;
} | null = null;

const MARKET_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const NEWS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "market";
    const symbol = searchParams.get("symbol");
    const range = searchParams.get("range") || "1y";

    // Handle news requests
    if (type === "news") {
      // Return cached news if fresh
      if (newsCache && Date.now() - newsCache.timestamp < NEWS_CACHE_DURATION) {
        return NextResponse.json(newsCache.data);
      }

      const news = await fetchAllNews();
      newsCache = { data: news, timestamp: Date.now() };
      return NextResponse.json(news);
    }

    // Handle market data requests
    if (symbol) {
      const [currentData, history] = await Promise.all([
        fetchYahooData(symbol),
        fetchYahooHistory(symbol, range as any),
      ]);

      if (!currentData) {
        return NextResponse.json(
          { error: "Failed to fetch data" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        symbol,
        ...currentData,
        history,
      });
    }

    // Return cached market data if fresh
    if (marketCache && Date.now() - marketCache.timestamp < MARKET_CACHE_DURATION) {
      return NextResponse.json(marketCache.data);
    }

    // Fetch all commodities
    const symbols = ["BRENT", "GOLD", "COPPER", "NATGAS", "ALUM", "USD"];
    const results: Record<string, any> = {};

    for (const sym of symbols) {
      const data = await fetchYahooData(sym);
      if (data) {
        const history = await fetchYahooHistory(sym, "1y");
        results[sym] = { ...data, history };
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    marketCache = { data: results, timestamp: Date.now() };
    return NextResponse.json(results);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
