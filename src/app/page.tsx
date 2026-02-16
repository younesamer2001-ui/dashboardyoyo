"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  LayoutDashboard, CheckCircle, Users, Clock, MessageSquare, TrendingUp, Activity,
  Send, Zap, Globe, GitBranch, Terminal, Wifi, WifiOff, RefreshCw, Search,
  FileText, BarChart3, Bot, Sparkles, Radio, Circle,
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

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [commandInput, setCommandInput] = useState("");
  const [commandSending, setCommandSending] = useState(false);
  const [commandResponse, setCommandResponse] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [fetchCount, setFetchCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live clock - update every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data every 3 seconds
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
        setLastFetch(new Date());
        setIsConnected(true);
        setFetchCount((c) => c + 1);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

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
        setCommandResponse("Sent to Kimi!");
        setCommandInput("");
      } else {
        setCommandResponse("Failed to send.");
      }
    } catch {
      setCommandResponse("Error sending command.");
    } finally {
      setCommandSending(false);
      setTimeout(() => setCommandResponse(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const kimiAgent = agents.find((a) => a.name.toLowerCase() === "kimi");
  const kimiOnline = kimiAgent?.status === "active";
  const kimiTask = kimiAgent?.currentTask;

  const secondsAgo = lastFetch ? Math.floor((currentTime.getTime() - lastFetch.getTime()) / 1000) : 0;

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
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border-main bg-gradient-to-br from-bg-card via-bg-card to-accent/5 p-5">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-accent" />
              {getGreeting()}, Younes
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {" · "}
              <span className="font-mono text-gray-300">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </p>
            {kimiTask && (
              <p className="mt-1.5 text-xs text-accent/70 flex items-center gap-1.5">
                <Bot className="h-3 w-3" />
                Kimi: {kimiTask}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Connection status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${isConnected ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              <span className="relative flex h-1.5 w-1.5">
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
              </span>
              {isConnected ? `Live · ${secondsAgo}s` : "Disconnected"}
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${kimiOnline ? "bg-success/10 text-success" : "bg-gray-700 text-gray-400"}`}>
              {kimiOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              Kimi {kimiOnline ? "Online" : "Offline"}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-accent/10 text-accent">
              <Sparkles className="h-3 w-3" />
              OpenClaw
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Quick Command Bar */}
      <div className="rounded-xl border border-border-main bg-bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">Quick Command</span>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-bg-main border border-border-main rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
            placeholder='Tell Kimi what to do...'
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendCommand(commandInput)}
            disabled={commandSending}
          />
          <button
            onClick={() => sendCommand(commandInput)}
            disabled={commandSending || !commandInput.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {commandSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>
        {commandResponse && (
          <p className="mt-2 text-xs text-success animate-pulse">{commandResponse}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => sendCommand(action.command)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-main border border-border-main hover:border-accent/30 hover:bg-accent/5 text-[11px] text-gray-300 transition-all group"
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
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} trend={stat.trend} />
        ))}
      </div>

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          {/* Agent Fleet */}
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent" />
              Agent Fleet
              <span className="ml-auto text-[10px] text-gray-500 font-normal">{agents.length} agents</span>
            </h2>
            <div className="space-y-2">
              {agents.length === 0 ? (
                <p className="text-gray-400 text-sm">No agents registered.</p>
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
                      currentTask: agent.currentTask,
                    }}
                    compact
                  />
                ))
              )}
            </div>
          </div>

          {/* System Status */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-300">
              <Activity className="h-4 w-4 text-accent" />
              System Status
            </h3>
            <div className="rounded-xl border border-border-main bg-bg-card p-3 space-y-2.5">
              {[
                { label: "OpenClaw Gateway", status: true, detail: "v2026.2.3" },
                { label: "Telegram Bot", status: kimiOnline, detail: "@testkimiiibot" },
                { label: "Vercel Deploy", status: true, detail: "Production" },
                { label: "OpenRouter API", status: true, detail: "Kimi K2.5" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      {item.status && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${item.status ? "bg-green-500" : "bg-gray-600"}`}></span>
                    </span>
                    <span className="text-xs text-gray-300">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            Activity Feed
          </h2>
          <FeedList limit={10} />
        </div>
      </div>

      {/* Kimi Capabilities */}
      <div className="rounded-xl border border-border-main bg-bg-card p-4">
        <h2 className="text-xs font-semibold mb-3 flex items-center gap-2 uppercase tracking-wider text-gray-400">
          <Zap className="h-3.5 w-3.5 text-accent" />
          Kimi Capabilities
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: GitBranch, label: "Edit & Deploy", desc: "Push code to GitHub, auto-deploy via Vercel" },
            { icon: Globe, label: "Web Research", desc: "Search the web, summarize into reports" },
            { icon: MessageSquare, label: "Telegram Bot", desc: "Chat via Telegram, execute commands" },
            { icon: BarChart3, label: "Dashboard", desc: "Update agents, data, and settings" },
          ].map((cap) => (
            <div key={cap.label} className="rounded-lg border border-border-main bg-bg-main p-2.5 hover:border-accent/30 transition-colors group">
              <cap.icon className="h-4 w-4 text-accent mb-1.5 group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-medium text-gray-200">{cap.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{cap.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
