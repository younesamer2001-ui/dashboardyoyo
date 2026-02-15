"use client";

import { useEffect, useState } from "react";
import { cn, timeAgo } from "@/lib/utils";
import { Activity, MessageSquare, CheckCircle, AlertTriangle, Cpu } from "lucide-react";

interface FeedItem {
  id: string;
  type: "success" | "info" | "warning" | "error" | "system";
  message: string;
  agent?: { name: string; icon: string };
  timestamp: string;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", label: "Success" },
  info: { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Warning" },
  error: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Error" },
  system: { icon: Cpu, color: "text-gray-400", bg: "bg-gray-500/10", label: "System" },
};

interface FeedListProps {
  limit?: number;
}

export default function FeedList({ limit = 20 }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch feed data every 5 seconds
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(`/api/feed?limit=${limit}`);
        const data = await res.json();
        if (data.success) {
          setItems(data.feed);
        }
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchFeed();

    // Poll every 5 seconds
    const interval = setInterval(fetchFeed, 5000);

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
    <div className="space-y-3">
      {items.map((item, index) => {
        const config = typeConfig[item.type] || typeConfig.system;
        const Icon = config.icon;
        return (
          <div
            key={item.id}
            className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.bg)}>
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.agent?.icon || "🤖"}</span>
                <span className="text-sm font-medium">{item.agent?.name || "System"}</span>
                <span className="text-xs text-gray-400 ml-auto">{timeAgo(item.timestamp)}</span>
              </div>
              <p className="mt-1 text-sm text-gray-300 leading-relaxed">{item.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
