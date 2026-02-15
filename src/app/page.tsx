"use client";

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
import { agents, feedItems, dashboardStats } from "@/lib/mock-data";

export default function OverviewPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-accent" />
          Oversikt
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Velkommen tilbake, Younes. Her er statusen til AI-teamet ditt.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Oppgaver i dag"
          value={dashboardStats.tasksToday}
          icon={CheckCircle}
          trend={{ value: 12, isPositive: true }}
          color="success"
        />
        <StatCard
          label="Totale oppgaver"
          value={dashboardStats.totalTasks.toLocaleString()}
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          label="Aktive agenter"
          value={dashboardStats.activeAgents}
          icon={Users}
          color="info"
        />
        <StatCard
          label="Uptime"
          value={`${dashboardStats.uptime}%`}
          icon={Clock}
          color="success"
        />
        <StatCard
          label="Meldinger totalt"
          value={dashboardStats.messagesTotal.toLocaleString()}
          icon={MessageSquare}
          color="info"
        />
        <StatCard
          label="Evolution Score"
          value={`${dashboardStats.evolutionScore}/100`}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
          color="accent"
        />
      </div>

      {/* Two-column layout: Agents + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent fleet */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Agent Fleet
          </h2>
          <div className="space-y-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} compact />
            ))}
          </div>
        </div>

        {/* Live feed */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            Live Feed
          </h2>
          <FeedList items={feedItems} limit={4} />
        </div>
      </div>
    </div>
  );
}
