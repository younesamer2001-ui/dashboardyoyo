// RSS Feed parser for real news
import { XMLParser } from "fast-xml-parser";

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  category?: string | string[];
}

interface ParsedArticle {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
}

// RSS Feed URLs
const RSS_FEEDS = {
  e24: {
    url: "https://e24.no/rss",
    source: "E24",
    category: "markets",
  },
  finansavisen: {
    url: "https://www.finansavisen.no/rss",
    source: "Finansavisen",
    category: "markets",
  },
  // Yahoo Finance has different RSS endpoints per topic
  yahooFinance: {
    url: "https://finance.yahoo.com/rss/topstories",
    source: "Yahoo Finance",
    category: "markets",
  },
};

// CORS proxy for RSS feeds (in production, use your own proxy or server-side)
const CORS_PROXY = "https://api.allorigins.win/get?url=";

export async function fetchRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    // Use allorigins as CORS proxy
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(feedUrl)}`);
    
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const data = await response.json();
    const xmlContent = data.contents;

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const parsed = parser.parse(xmlContent);
    
    // Handle different RSS structures
    const channel = parsed.rss?.channel || parsed.feed;
    const items = channel?.item || channel?.entry || [];
    
    return Array.isArray(items) ? items : [items].filter(Boolean);
  } catch (error) {
    console.error("RSS parse error:", error);
    return [];
  }
}

// Generate summary from description
function generateSummary(description: string): string {
  // Remove HTML tags
  const cleanText = description?.replace(/&lt;[^&gt;]*&gt;/g, "") || "";
  // Limit to 200 chars
  return cleanText.length > 200 ? cleanText.substring(0, 200) + "..." : cleanText;
}

// Generate full content (in a real app, you'd fetch the full article)
function generateFullContent(title: string, summary: string, source: string): string {
  return `${summary}

Dette er en viktig finansiell nyhet fra ${source}. Analytikere og investorer følger utviklingen nøye.

**Nøkkelpunkter:**
• Nyheten kan påvirke markedene
• Eksperter anbefaler å følge med
• Situasjonen kan utvikle seg raskt

**Hva betyr dette for deg?**
Som investor er det viktig å holde seg oppdatert på finansielle nyheter. Denne utviklingen kan påvirke dine investeringer.

Les hele artikkelen på ${source} for mer detaljert informasjon.`;
}

// Categorize article based on keywords
function categorizeArticle(title: string, description: string = ""): string {
  const text = (title + " " + description).toLowerCase();
  
  if (text.includes("olje") || text.includes("gass") || text.includes("energi") || text.includes("oil")) {
    return "energy";
  }
  if (text.includes("gull") || text.includes("kobber") || text.includes("aluminium") || 
      text.includes("gold") || text.includes("copper") || text.includes("commodity")) {
    return "commodities";
  }
  if (text.includes("krone") || text.includes("euro") || text.includes("dollar") || 
      text.includes("valuta") || text.includes("forex")) {
    return "forex";
  }
  return "markets";
}

// Fetch and parse all news
export async function fetchAllNews(): Promise<ParsedArticle[]> {
  const allArticles: ParsedArticle[] = [];

  try {
    // Fetch E24
    const e24Items = await fetchRSSFeed(RSS_FEEDS.e24.url);
    e24Items.slice(0, 10).forEach((item, index) => {
      const summary = generateSummary(item.description || "");
      allArticles.push({
        id: `e24-${index}`,
        title: item.title,
        summary,
        fullContent: generateFullContent(item.title, summary, "E24"),
        source: "E24",
        category: categorizeArticle(item.title, item.description),
        url: item.link,
        publishedAt: new Date(item.pubDate).toISOString(),
      });
    });
  } catch (error) {
    console.error("E24 fetch failed:", error);
  }

  try {
    // Fetch Finansavisen
    const finansItems = await fetchRSSFeed(RSS_FEEDS.finansavisen.url);
    finansItems.slice(0, 10).forEach((item, index) => {
      const summary = generateSummary(item.description || "");
      allArticles.push({
        id: `finans-${index}`,
        title: item.title,
        summary,
        fullContent: generateFullContent(item.title, summary, "Finansavisen"),
        source: "Finansavisen",
        category: categorizeArticle(item.title, item.description),
        url: item.link,
        publishedAt: new Date(item.pubDate).toISOString(),
      });
    });
  } catch (error) {
    console.error("Finansavisen fetch failed:", error);
  }

  // Sort by date (newest first)
  return allArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
