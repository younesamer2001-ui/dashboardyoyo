// API fallback with caching
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: any;
  timestamp: number;
}

const cache: Record<string, CachedData> = {};

export async function fetchWithFallback(
  url: string,
  options?: RequestInit
): Promise<any> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache successful response
    cache[url] = {
      data,
      timestamp: Date.now(),
    };
    
    return data;
  } catch (error) {
    // Return cached data if available
    const cached = cache[url];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.warn("Using cached data due to API error");
      return {
        ...cached.data,
        _cached: true,
        _cachedAt: cached.timestamp,
      };
    }
    
    throw error;
  }
}

export function isCachedData(data: any): boolean {
  return data?._cached === true;
}
