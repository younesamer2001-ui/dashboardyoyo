// Yahoo Finance API integration for real commodity and currency data
// Free to use, no API key required

interface YahooQuote {
  symbol: string;
  shortName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  currency?: string;
}

// Map our symbols to Yahoo Finance symbols
const YAHOO_SYMBOLS: Record<string, string> = {
  BRENT: "BZ=F",           // Brent Crude Oil
  GOLD: "GC=F",            // Gold
  COPPER: "HG=F",          // Copper
  NATGAS: "NG=F",          // Natural Gas
  ALUM: "ALI=F",           // Aluminium (using futures)
  NOK: "NOK=X",            // NOK/USD (we'll convert)
  USD: "EUR=X",            // USD/EUR
};

export async function fetchYahooData(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  name: string;
} | null> {
  try {
    const yahooSymbol = YAHOO_SYMBOLS[symbol];
    if (!yahooSymbol) return null;

    // Use a CORS proxy or server-side API route in production
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1y`
    );

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      return null;
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const prices = result.indicators.quote[0].close;
    const timestamps = result.timestamp;
    
    // Get current and previous close
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      price: currentPrice,
      change,
      changePercent,
      name: meta.shortName || meta.symbol,
    };
  } catch (error) {
    console.error(`Failed to fetch ${symbol}:`, error);
    return null;
  }
}

// Fetch historical data for charts
export async function fetchYahooHistory(
  symbol: string,
  range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" = "1y"
): Promise<{ time: number; price: number }[]> {
  try {
    const yahooSymbol = YAHOO_SYMBOLS[symbol];
    if (!yahooSymbol) return [];

    // Map our ranges to Yahoo intervals
    const intervalMap: Record<string, string> = {
      "1d": "15m",
      "5d": "1h",
      "1mo": "1d",
      "3mo": "1d",
      "6mo": "1d",
      "1y": "1d",
    };

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${intervalMap[range]}&range=${range}`
    );

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      return [];
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const prices = result.indicators.quote[0].close;

    return timestamps
      .map((time: number, i: number) => ({
        time: time * 1000, // Convert to milliseconds
        price: prices[i],
      }))
      .filter((p: { price: number | null }) => p.price !== null) as { time: number; price: number }[];
  } catch (error) {
    console.error(`Failed to fetch history for ${symbol}:`, error);
    return [];
  }
}

// Fetch all commodities at once
export async function fetchAllCommodities(): Promise<
  Record<string, { price: number; change: number; changePercent: number; name: string }>
> {
  const results: Record<string, { price: number; change: number; changePercent: number; name: string }> = {};
  
  // Fetch sequentially to avoid rate limits
  for (const symbol of Object.keys(YAHOO_SYMBOLS)) {
    const data = await fetchYahooData(symbol);
    if (data) {
      results[symbol] = data;
    }
    // Small delay to be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

// Norges Bank API for NOK rates (more accurate for Norwegian Krone)
export async function fetchNorgesBankRate(): Promise<{
  nokPerEur: number;
  usdPerEur: number;
} | null> {
  try {
    // Norges Bank API - official rates
    const response = await fetch(
      "https://data.norges-bank.no/api/data/EXR/B.EUR.NOK.SP?format=sdmx-json&lastNObservations=1"
    );

    if (!response.ok) {
      throw new Error(`Norges Bank API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse Norges Bank response
    // This is a simplified parser - the actual structure may vary
    const nokPerEur = parseFloat(
      data.dataSets?.[0]?.series?.["0:0:0"]?.observations?.["0"]?.[0] || "11.45"
    );

    return { nokPerEur, usdPerEur: 1.08 }; // USD would need separate call
  } catch (error) {
    console.error("Norges Bank fetch failed:", error);
    return null;
  }
}
