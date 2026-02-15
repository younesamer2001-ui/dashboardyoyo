"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CheckCircle,
  Users,
  Clock,
  MessageSquare,
  TrendingUp,
  Activity,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import AgentCard from "@/components/dashboard/AgentCard";
import FeedList from "@/components/dashboard/FeedList";

interface Stats {
  tasksCompleted: number;
  activeAgents: number;
  messagesExchanged: number;
  uptime: number;
  todayTasks: number;
  systemHealth: "healthy" | "warning" | "critical";
}

interface Agent {
  id: string;
  name: string;
  role?: string;
  icon?: string;
  emoji?: string;
  status: "active" | "idle" | "error" | string;
  currentTask?: string | null;
  lastActive?: string;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stats and agents every 5 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, agentsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/agents"),
        ]);

        const [statsData, agentsData] = await Promise.all([
          statsRes.json(),
          agentsRes.json(),
        ]);

        if (statsData.success) {
          setStats(statsData.stats);
        }
        if (agentsData.success) {
          setAgents(agentsData.agents);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const statItems = [
    {
      label: "Tasks Today",
      value: stats?.todayTasks || 0,
      icon: CheckCircle,
      color: "success" as const,
    },
    {
      label: "Total Tasks",
      value: stats?.tasksCompleted || 0,
      icon: TrendingUp,
      color: "accent" as const,
    },
    {
      label: "Active Agents",
      value: stats?.activeAgents || 0,
      icon: Users,
      color: "info" as const,
    },
    {
      label: "Uptime",
      value: `${stats?.uptime || 99.9}%`,
      icon: Clock,
      color: "success" as const,
    },
    {
      label: "Messages",
      value: stats?.messagesExchanged || 0,
      icon: MessageSquare,
      color: "info" as const,
    },
    {
      label: "Health",
      value: stats?.systemHealth === "healthy" 
        ? "Good" 
        : stats?.systemHealth === "warning" 
          ? "Warn" 
          : "Critical",
      icon: Activity,
      color: (stats?.systemHealth === "healthy"
        ? "success"
        : stats?.systemHealth === "warning"
          ? "warning"
          : "info") as "success" | "warning" | "info",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-accent" />
          Overview
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Welcome back, Younes. Here is the status of your AI team.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statItems.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Two-column layout: Agents + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent fleet */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Agent Fleet ({agents.length})
          </h2>
          <div className="space-y-3">
            {agents.length === 0 ? (
              <p className="text-gray-400 text-sm">No agents registered yet.</p>
            ) : (
              agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={{
                    id: agent.id,
                    name: agent.name,
                    role: agent.role || "Agent",
                    emoji: agent.icon || agent.emoji || "K",
                    status: agent.status === "active" ? "online" : "idle",
                    health: 100,
                    lastActive: agent.lastActive || new Date().toISOString(),
                    tasksCompleted: 0,
                    tasksToday: 0,
                  }}
                  compact
                />
              ))
            )}
          </div>
        </div>

        {/* Live feed */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            Live Feed
          </h2>
          <FeedList limit={6} />
        </div>
      </div>
    </div>
  );
}
