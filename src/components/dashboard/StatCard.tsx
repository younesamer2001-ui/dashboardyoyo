"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp as TrendUp, TrendingDown as TrendDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: "accent" | "success" | "warning" | "info";
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = "accent",
}: StatCardProps) {
  const colorMap = {
    accent: "text-accent bg-accent/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    info: "text-info bg-info/10",
  };

  return (
    <div className="rounded-xl border border-border-main bg-bg-card p-5 transition-colors hover:bg-bg-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            colorMap[color]
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs font-medium flex items-center gap-1",
            trend.isPositive ? "text-success" : "text-error"
          )}
        >
          {trend.isPositive ? (
            <TrendUp className="h-3 w-3" />
          ) : (
            <TrendDown className="h-3 w-3" />
          )}
          {Math.abs(trend.value)}% from last week
        </p>
      )}
    </div>
  );
}
