import { NextResponse } from "next/server";
import { fetchYahooData, fetchYahooHistory } from "@/lib/market-data";

// Cache data for 5 minutes to avoid hitting rate limits
let cache: {
  data: Record<string, any>;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const range = searchParams.get("range") || "1y";

    // Return cached data if fresh
    if (!symbol && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    // Fetch single symbol
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

    // Fetch all symbols
    const symbols = ["BRENT", "GOLD", "COPPER", "NATGAS", "ALUM", "USD"];
    const results: Record<string, any> = {};

    for (const sym of symbols) {
      const data = await fetchYahooData(sym);
      if (data) {
        const history = await fetchYahooHistory(sym, "1y");
        results[sym] = { ...data, history };
      }
      // Small delay to be nice to Yahoo
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Cache the results
    cache = { data: results, timestamp: Date.now() };

    return NextResponse.json(results);
  } catch (error) {
    console.error("Market data API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
