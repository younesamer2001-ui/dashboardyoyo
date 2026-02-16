"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type AgentStatus = "online" | "active" | "working" | "idle" | "error" | "offline";

interface Agent {
  id: string;
  name: string;
  role: string;
  icon?: string;
  emoji?: string;
  status: AgentStatus | string;
  health?: number;
  lastActive?: string;
  tasksCompleted?: number;
  tasksToday?: number;
  currentTask?: string | null;
  evaluationTime?: string;
  systemPrompt?: string;
  model?: string;
  metrics?: Record<string, any>;
  updatedAt?: string;
  capabilities?: any[];
  tools?: any[];
  files?: any[];
}

const statusConfig: Record<AgentStatus, { label: string; color: string; dot: string; glow: string }> = {
  online: { label: "Online", color: "text-success", dot: "bg-success", glow: "shadow-success/50" },
  active: { label: "Active", color: "text-success", dot: "bg-success", glow: "shadow-success/50" },
  working: { label: "Working", color: "text-info", dot: "bg-info", glow: "shadow-info/50" },
  idle: { label: "Idle", color: "text-warning", dot: "bg-warning", glow: "shadow-warning/50" },
  error: { label: "Error", color: "text-red-400", dot: "bg-red-400", glow: "shadow-red-400/50" },
  offline: { label: "Offline", color: "text-gray-500", dot: "bg-gray-500", glow: "" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
  onClick?: () => void;
}

export default function AgentCard({ agent, compact = false, onClick }: AgentCardProps) {
  const agentStatus = (agent.status || "idle") as AgentStatus;
  const status = statusConfig[agentStatus] || statusConfig.idle;
  const isAlive = agentStatus === "online" || agentStatus === "active" || agentStatus === "working";
  const health = agent.health ?? 100;
  const lastActive = agent.lastActive || new Date().toISOString();
  const emoji = agent.emoji || agent.icon || "K";

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-bg-card p-3 transition-all cursor-pointer hover:bg-bg-card-hover",
          isAlive ? "border-success/20" : "border-border-main"
        )}
      >
        <div className="relative">
          <span className="text-xl">{emoji}</span>
          {isAlive && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          <p className="text-[10px] text-text-secondary truncate">
            {agent.currentTask || agent.role}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <div className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            <span className={cn("text-[10px] font-medium", status.color)}>{status.label}</span>
          </div>
          <span className="text-[9px] text-gray-600">{timeAgo(lastActive)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-bg-card p-5 transition-all hover:bg-bg-card-hover cursor-pointer",
        isAlive ? "border-success/20" : "border-border-main"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-xl">
            {emoji}
            {isAlive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success border-2 border-bg-card"></span>
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{agent.name}</h3>
            <p className="text-sm text-text-secondary">{agent.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
        </div>
      </div>

      {agent.currentTask && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
          <p className="text-[10px] text-accent font-medium uppercase tracking-wider">Current Task</p>
          <p className="text-xs text-gray-300 mt-0.5 truncate">{agent.currentTask}</p>
        </div>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Health</span>
          <span className={cn(
            health > 80 ? "text-success" : health > 50 ? "text-warning" : "text-red-400"
          )}>
            {health}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-bg-primary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              health > 80 ? "bg-success" : health > 50 ? "bg-warning" : "bg-red-400"
            )}
            style={{ width: `${health}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-bg-primary p-2">
          <p className="text-[10px] text-text-secondary">Today</p>
          <p className="text-base font-bold">{agent.tasksToday ?? 0}</p>
        </div>
        <div className="rounded-lg bg-bg-primary p-2">
          <p className="text-[10px] text-text-secondary">Total</p>
          <p className="text-base font-bold">{(agent.tasksCompleted ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-text-secondary">
        Last active: {timeAgo(lastActive)}
      </p>
    </div>
  );
}
