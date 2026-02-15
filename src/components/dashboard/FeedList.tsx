"use client";

import { cn, timeAgo } from "@/lib/utils";
import { FeedItem } from "@/lib/types";
import { Activity, MessageSquare, CheckCircle, AlertTriangle, Cpu } from "lucide-react";
import { useEffect, useState } from "react";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  success: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  task: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  info: { icon: MessageSquare, color: "text-info", bg: "bg-info/10" },
  message: { icon: MessageSquare, color: "text-info", bg: "bg-info/10" },
  warning: { icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
  error: { icon: AlertTriangle, color: "text-error", bg: "bg-error/10" },
  system: { icon: Cpu, color: "text-text-secondary", bg: "bg-text-secondary/10" },
};

interface FeedListProps {
  items?: FeedItem[];
  limit?: number;
}

export default function FeedList({ items: propItems, limit }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(propItems || []);
  const [loading, setLoading] = useState(!propItems);

  // Fetch real data from API
  useEffect(() => {
    if (propItems) return; // Use prop items if provided

    const fetchFeed = async () => {
      try {
        const res = await fetch('/api/feed?limit=20');
        const data = await res.json();
        if (data.success) {
          // Transform API format to component format
          const transformed = data.feed.map((item: any) => ({
            id: item.id,
            type: item.type,
            content: item.message,
            agentName: item.agent?.name || 'System',
            agentEmoji: item.agent?.icon || '🤖',
            timestamp: item.timestamp,
          }));
          setItems(transformed);
        }
      } catch (error) {
        console.error('Failed to fetch feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
    // Poll every 5 seconds
    const interval = setInterval(fetchFeed, 5000);
    return () => clearInterval(interval);
  }, [propItems]);

  const displayItems = limit ? items.slice(0, limit) : items;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayItems.map((item, index) => {
        const config = typeConfig[item.type] || typeConfig.system;
        return (
          <div
            key={item.id}
            className="fade-in flex gap-3 rounded-lg border border-border-main bg-bg-card p-4 transition-colors hover:bg-bg-card-hover"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.bg)}>
              <config.icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.agentEmoji}</span>
                <span className="text-sm font-medium">{item.agentName}</span>
                <span className="text-[11px] text-text-secondary">{timeAgo(item.timestamp)}</span>
              </div>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">{item.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
