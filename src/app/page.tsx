"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CheckCircle,
  Users,
  Clock,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import AgentCard from "@/components/dashboard/AgentCard";
import FeedList from "@/components/dashboard/FeedList";
import { Agent } from "@/lib/types";

interface Stats {
  tasksCompleted: number;
  activeAgents: number;
  messagesExchanged: number;
  uptime: number;
  todayTasks: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stats and agents
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, agentsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/agents')
        ]);

        const statsData = await statsRes.json();
        const agentsData = await agentsRes.json();

        if (statsData.success) {
          setStats(statsData.stats);
        }

        if (agentsData.success) {
          setAgents(agentsData.agents);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-accent" />
          Overview
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Welcome back, Younes. Here is the status of your AI team.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Tasks Today"
          value={stats?.todayTasks || 0}
          icon={CheckCircle}
          trend={{ value: 12, isPositive: true }}
          color="success"
        />
        <StatCard
          label="Total Tasks"
          value={stats?.tasksCompleted?.toLocaleString() || 0}
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          label="Active Agents"
          value={stats?.activeAgents || 0}
          icon={Users}
          color="info"
        />
        <StatCard
          label="Uptime"
          value={`${stats?.uptime || 99.9}%`}
          icon={Clock}
          color="success"
        />
        <StatCard
          label="Total Messages"
          value={stats?.messagesExchanged?.toLocaleString() || 0}
          icon={MessageSquare}
          color="info"
        />
        <StatCard
          label="System Health"
          value={stats?.systemHealth === 'healthy' ? 'Good' : stats?.systemHealth === 'warning' ? 'Warn' : 'Critical'}
          icon={TrendingUp}
          trend={{ value: 0, isPositive: stats?.systemHealth === 'healthy' }}
          color={stats?.systemHealth === 'healthy' ? 'success' : stats?.systemHealth === 'warning' ? 'accent' : 'error'}
        />
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
              <p className="text-text-secondary text-sm">No agents registered yet.</p>
            ) : (
              agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} compact />
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
          <FeedList limit={4} />
        </div>
      </div>
    </div>
  );
}
