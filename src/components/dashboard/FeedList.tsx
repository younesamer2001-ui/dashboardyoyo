"use client";

import { cn, timeAgo } from "@/lib/utils";
import { FeedItem } from "@/lib/types";
import { Activity, MessageSquare, CheckCircle, AlertTriangle, Cpu } from "lucide-react";

const typeConfig = {
  task: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  message: { icon: MessageSquare, color: "text-info", bg: "bg-info/10" },
  evaluation: { icon: Activity, color: "text-accent", bg: "bg-accent/10" },
  error: { icon: AlertTriangle, color: "text-error", bg: "bg-error/10" },
  system: { icon: Cpu, color: "text-text-secondary", bg: "bg-text-secondary/10" },
};

interface FeedListProps {
  items: FeedItem[];
  limit?: number;
}

export default function FeedList({ items, limit }: FeedListProps) {
  const displayItems = limit ? items.slice(0, limit) : items;

  return (
    <div className="space-y-3">
      {displayItems.map((item, index) => {
        const config = typeConfig[item.type];
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
