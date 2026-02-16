"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Activity, MessageSquare, CheckCircle, AlertTriangle, Cpu, Sparkles, Radio } from "lucide-react";

interface FeedItem {
  id: string;
  type: string;
  message?: string;
  content?: string;
  agent?: { name: string; icon: string };
  agentName?: string;
  agentEmoji?: string;
  timestamp: string;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", label: "Success" },
  info: { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Warning" },
  error: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Error" },
  system: { icon: Cpu, color: "text-gray-400", bg: "bg-gray-500/10", label: "System" },
  evolution: { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10", label: "Evolution" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

interface FeedListProps {
  limit?: number;
}

export default function FeedList({ limit = 20 }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Refresh timestamps every 30s
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch("/api/feed?limit=" + limit);
        const data = await res.json();
        if (data.success && Array.isArray(data.feed)) {
          const incomingIds = new Set(data.feed.map((f: FeedItem) => f.id));
          
          if (!isFirstLoad.current) {
            const brandNew = new Set<string>();
            data.feed.forEach((f: FeedItem) => {
              if (!prevIdsRef.current.has(f.id)) {
                brandNew.add(f.id);
              }
            });
            if (brandNew.size > 0) {
              setNewIds(brandNew);
              setTimeout(() => setNewIds(new Set()), 2000);
            }
          }
          
          prevIdsRef.current = incomingIds;
          isFirstLoad.current = false;
          setItems(data.feed);
        }
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
    const interval = setInterval(fetchFeed, 4000);
    return () => clearInterval(interval);
  }, [limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-[10px] uppercase tracking-wider text-green-400 font-semibold">Live</span>
        <span className="text-[10px] text-gray-500 ml-auto">{items.length} events</span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
        {items.map((item, index) => {
          const config = typeConfig[item.type] || typeConfig.system;
          const Icon = config.icon;
          const agentName = item.agent?.name || item.agentName || "System";
          const agentIcon = item.agent?.icon || item.agentEmoji || "\u{1F916}";
          const messageText = item.message || item.content || "";
          const isNew = newIds.has(item.id);

          return (
            <div
              key={item.id}
              className={cn(
                "flex gap-3 rounded-lg border p-3 transition-all duration-500",
                isNew
                  ? "border-accent/40 bg-accent/5 animate-pulse"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/[0.06]"
              )}
              style={{
                animationDelay: isNew ? "0ms" : `${index * 30}ms`,
              }}
            >
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                <Icon className={cn("h-3.5 w-3.5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{agentIcon}</span>
                  <span className="text-xs font-medium text-white">{agentName}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", config.bg, config.color)}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-gray-500 ml-auto whitespace-nowrap">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
                {messageText && (
                  <p className="mt-1 text-xs text-gray-400 leading-relaxed line-clamp-2">{messageText}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
