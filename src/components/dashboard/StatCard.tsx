"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp as TrendUp, TrendingDown as TrendDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: "accent" | "success" | "warning" | "info";
}

export default function StatCard({ label, value, icon: Icon, trend, color = "accent" }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlash(true);
      
      // Animate number change
      if (typeof value === "number" && typeof prevValue.current === "number") {
        const start = prevValue.current as number;
        const end = value as number;
        const duration = 600;
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(start + (end - start) * eased);
          setDisplayValue(current);
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
      
      prevValue.current = value;
      setTimeout(() => setFlash(false), 1000);
    }
  }, [value]);

  const colorMap = {
    accent: "text-accent bg-accent/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    info: "text-info bg-info/10",
  };

  const glowMap = {
    accent: "shadow-accent/20",
    success: "shadow-success/20",
    warning: "shadow-warning/20",
    info: "shadow-info/20",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border-main bg-bg-card p-4 transition-all duration-500 hover:bg-bg-card-hover",
        flash && "border-accent/30 shadow-lg " + glowMap[color]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-secondary leading-tight">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn(
        "mt-1.5 text-2xl font-bold tracking-tight transition-colors duration-300",
        flash && "text-accent"
      )}>
        {displayValue}
      </p>
      {trend && (
        <p className={cn("mt-1 text-[10px] font-medium flex items-center gap-1", trend.isPositive ? "text-success" : "text-error")}>
          {trend.isPositive ? <TrendUp className="h-3 w-3" /> : <TrendDown className="h-3 w-3" />}
          {Math.abs(trend.value)}% from last week
        </p>
      )}
    </div>
  );
}
