"use client";

import { cn } from "@/lib/utils";
import { Agent, AgentStatus } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

const statusConfig: Record<AgentStatus, { label: string; color: string; dot: string }> = {
  online: { label: "Online", color: "text-success", dot: "bg-success" },
  active: { label: "Active", color: "text-success", dot: "bg-success" },
  working: { label: "Working", color: "text-info", dot: "bg-info" },
  idle: { label: "Idle", color: "text-warning", dot: "bg-warning" },
  error: { label: "Error", color: "text-red-400", dot: "bg-red-400" },
  offline: { label: "Offline", color: "text-text-secondary", dot: "bg-text-secondary" },
};

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
  onClick?: () => void;
}

export default function AgentCard({ agent, compact = false, onClick }: AgentCardProps) {
  const status = statusConfig[agent.status] || statusConfig.idle;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 rounded-lg border border-border-main bg-bg-card p-3 transition-colors hover:bg-bg-card-hover cursor-pointer"
      >
        <span className="text-xl">{agent.emoji || "K"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          <p className="text-xs text-text-secondary">{agent.role}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn("h-2 w-2 rounded-full", status.dot, agent.status === "online" && "pulse-dot")} />
          <span className={cn("text-xs", status.color)}>{status.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-border-main bg-bg-card p-5 transition-all hover:bg-bg-card-hover cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-xl">
            {agent.emoji || "K"}
          </div>
          <div>
            <h3 className="font-semibold">{agent.name}</h3>
            <p className="text-sm text-text-secondary">{agent.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn("h-2 w-2 rounded-full", status.dot, agent.status === "online" && "pulse-dot")} />
          <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
        </div>
      </div>

      {/* Health bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Health</span>
          <span className={cn(
            (agent.health ?? 100) > 80 ? "text-success" : (agent.health ?? 100) > 50 ? "text-warning" : "text-error"
          )}>
            {agent.health ?? 100}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-bg-primary">
          <div
            className={cn(
              "health-bar h-full rounded-full",
              (agent.health ?? 100) > 80 ? "bg-success" : (agent.health ?? 100) > 50 ? "bg-warning" : "bg-error"
            )}
            style={{ width: `${agent.health ?? 100}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-bg-primary p-2.5">
          <p className="text-[11px] text-text-secondary">Tasks Today</p>
          <p className="text-lg font-bold">{agent.tasksToday ?? 0}</p>
        </div>
        <div className="rounded-lg bg-bg-primary p-2.5">
          <p className="text-[11px] text-text-secondary">Total</p>
          <p className="text-lg font-bold">{(agent.tasksCompleted ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-3 text-[11px] text-text-secondary">
        Last active: {timeAgo(agent.lastActive || new Date().toISOString())}
        {agent.evaluationTime && ` | Eval: ${agent.evaluationTime}`}
      </p>
    </div>
  );
}
