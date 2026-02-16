"use client";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  CheckCircle,
  Users,
  Clock,
  MessageSquare,
  TrendingUp,
  Activity,
  Send,
  Zap,
  Globe,
  GitBranch,
  Terminal,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  FileText,
  BarChart3,
  Bot,
  Sparkles,
  ArrowRight,
  ChevronRight,
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

// Quick action buttons for commanding Kimi
const quickActions = [
  { label: "Research", icon: Search, command: "Research the latest AI trends and summarize", color: "text-blue-400" },
  { label: "Deploy", icon: GitBranch, command: "Check the latest Vercel deployment status", color: "text-green-400" },
  { label: "Report", icon: FileText, command: "Generate a daily status report", color: "text-purple-400" },
  { label: "Analyze", icon: BarChart3, command: "Analyze dashboard performance metrics", color: "text-amber-400" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Working late";
}

function getTimeAgo(dateStr: string): string {
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

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [commandInput, setCommandInput] = useState("");
  const [commandSending, setCommandSending] = useState(false);
  const [commandResponse, setCommandResponse] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
        if (statsData.success) setStats(statsData.stats);
        if (agentsData.success) setAgents(agentsData.agents);
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

  // Send command to Kimi
  const sendCommand = async (msg: string) => {
    if (!msg.trim()) return;
    setCommandSending(true);
    setCommandResponse(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sender: "user" }),
      });
      const data = await res.json();
      if (data.success) {
        setCommandResponse("Command sent to Kimi!");
        setCommandInput("");
      } else {
        setCommandResponse("Failed to send.");
      }
    } catch {
      setCommandResponse("Error sending command.");
    } finally {
      setCommandSending(false);
      setTimeout(() => setCommandResponse(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const kimiAgent = agents.find(a => a.name.toLowerCase() === "kimi");
  const kimiOnline = kimiAgent?.status === "active";

  const statItems = [
    { label: "Tasks Today", value: stats?.todayTasks || 0, icon: CheckCircle, color: "success" as const, trend: { value: 12, isPositive: true } },
    { label: "Total Tasks", value: stats?.tasksCompleted || 0, icon: TrendingUp, color: "accent" as const },
    { label: "Active Agents", value: stats?.activeAgents || 0, icon: Users, color: "info" as const },
    { label: "Uptime", value: `${stats?.uptime || 99.9}%`, icon: Clock, color: "success" as const },
    { label: "Messages", value: stats?.messagesExchanged || 0, icon: MessageSquare, color: "info" as const, trend: { value: 8, isPositive: true } },
    {
      label: "Health",
      value: stats?.systemHealth === "healthy" ? "Good" : stats?.systemHealth === "warning" ? "Warn" : "Critical",
      icon: Activity,
      color: (stats?.systemHealth === "healthy" ? "success" : stats?.systemHealth === "warning" ? "warning" : "info") as "success" | "warning" | "info",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border-main bg-gradient-to-br from-bg-card via-bg-card to-accent/5 p-6">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-accent" />
              {getGreeting()}, Younes
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {" \u00b7 "}
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${kimiOnline ? "bg-success/10 text-success" : "bg-gray-700 text-gray-400"}`}>
              {kimiOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              Kimi {kimiOnline ? "Online" : "Offline"}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
              <Sparkles className="h-3 w-3" />
              OpenClaw Active
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Quick Command Bar */}
      <div className="rounded-xl border border-border-main bg-bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">Quick Command</span>
          <span className="text-xs text-gray-500">Send instructions to Kimi</span>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-bg-main border border-border-main rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
            placeholder='Tell Kimi what to do... (e.g. "Research competitor pricing")'
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendCommand(commandInput)}
            disabled={commandSending}
          />
          <button
            onClick={() => sendCommand(commandInput)}
            disabled={commandSending || !commandInput.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {commandSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>
        {commandResponse && (
          <p className="mt-2 text-xs text-success animate-pulse">{commandResponse}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => sendCommand(action.command)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-main border border-border-main hover:border-accent/30 hover:bg-accent/5 text-xs text-gray-300 transition-all group"
            >
              <action.icon className={`h-3 w-3 ${action.color} group-hover:scale-110 transition-transform`} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            Agent Fleet
            <span className="ml-auto text-xs text-gray-500 font-normal">{agents.length} agents</span>
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

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-300">
              <Activity className="h-4 w-4 text-accent" />
              System Status
            </h3>
            <div className="rounded-xl border border-border-main bg-bg-card p-4 space-y-3">
              {[
                { label: "OpenClaw Gateway", status: true, detail: "v2026.2.3" },
                { label: "Telegram Bot", status: kimiOnline, detail: "@testkimiiibot" },
                { label: "Vercel Deploy", status: true, detail: "Production" },
                { label: "OpenRouter API", status: true, detail: "Kimi K2.5" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${item.status ? "bg-success animate-pulse" : "bg-gray-600"}`} />
                    <span className="text-xs text-gray-300">{item.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            Activity Feed
            <span className="ml-auto text-xs text-gray-500 font-normal">Real-time</span>
          </h2>
          <FeedList limit={8} />
        </div>
      </div>

      {/* Kimi Capabilities Showcase */}
      <div className="rounded-xl border border-border-main bg-bg-card p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          What Kimi Can Do
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: GitBranch, label: "Edit & Deploy Site", desc: "Push code changes to GitHub, auto-deploy via Vercel" },
            { icon: Globe, label: "Web Research", desc: "Search the web, summarize findings into reports" },
            { icon: MessageSquare, label: "Telegram Bot", desc: "Chat via Telegram, execute commands remotely" },
            { icon: BarChart3, label: "Manage Dashboard", desc: "Update agents, data, and dashboard settings" },
          ].map((cap) => (
            <div
              key={cap.label}
              className="rounded-lg border border-border-main bg-bg-main p-3 hover:border-accent/30 transition-colors group"
            >
              <cap.icon className="h-5 w-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium text-gray-200">{cap.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cap.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
