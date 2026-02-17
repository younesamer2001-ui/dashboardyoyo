"use client";

import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard, CheckCircle, Users, Clock, MessageSquare, 
  Send, Zap, Search, FileText, BarChart3, Bot, Sparkles, 
  TrendingUp, Calendar, ArrowRight, Command, Plus,
  Activity, GitCommit, Rocket, CheckCircle2
} from "lucide-react";

interface Stats {
  tasksPending: number;
  tasksCompleted: number;
  activeAgents: number;
  messagesToday: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats>({
    tasksPending: 0,
    tasksCompleted: 0,
    activeAgents: 0,
    messagesToday: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [commandInput, setCommandInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.success) {
          setStats({
            tasksPending: data.stats?.todayTasks || 0,
            tasksCompleted: data.stats?.tasksCompleted || 0,
            activeAgents: data.stats?.activeAgents || 0,
            messagesToday: data.stats?.messagesExchanged || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = async () => {
    if (!commandInput.trim()) return;
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commandInput }),
      });
      setCommandInput("");
    } catch (error) {
      console.error("Command failed:", error);
    }
  };

  const quickActions = [
    { icon: Search, label: "Research", color: "text-blue-400" },
    { icon: FileText, label: "Create Doc", color: "text-purple-400" },
    { icon: BarChart3, label: "Analytics", color: "text-amber-400" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Hero - Linear style */}
      <section className="relative overflow-hidden rounded-2xl bg-[#13131f] border border-white/[0.06] p-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5b8aff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm text-[#8a8a9a] font-medium">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white">
              {getGreeting()}, <span className="text-[#5b8aff]">Younes</span>
            </h1>
            <p className="text-[#8a8a9a] text-sm max-w-md">
              Welcome to your AI Command Center. Here&apos;s what&apos;s happening today.
            </p>
          </div>
          
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-5xl sm:text-6xl font-semibold text-white tracking-tight">
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
            <span className="text-lg text-[#5a5a6a]">
              {currentTime.getSeconds().toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="relative z-10 mt-8 flex flex-wrap gap-3">
          {[
            { label: "Pending", value: stats.tasksPending, icon: CheckCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Done", value: stats.tasksCompleted, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Agents", value: stats.activeAgents, icon: Bot, color: "text-blue-400", bg: "bg-blue-500/10" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.06]">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{stat.value}</p>
                <p className="text-xs text-[#5a5a6a]">{stat.label}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 ml-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">All Systems Operational</span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <a
            key={action.label}
            href={action.href || "#"}
            className="group p-4 rounded-xl bg-[#13131f] border border-white/[0.06] hover:border-white/[0.1] hover:bg-[#1c1c28] transition-all"
          >
            <div className={`w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${action.color || 'text-white'}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <p className="font-medium text-white">{action.label}</p>
          </a>
        ))}
      </section>

      {/* Live Activity Widget */}
      <section className="bg-[#13131f] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#5b8aff]" />
            <span className="text-sm font-medium text-white">Live Activity</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <a href="/feed" className="text-xs text-[#5b8aff] hover:text-[#7ca4ff]">View all →</a>
        </div>
        
        <div className="space-y-3">
          {[
            { type: 'commit', icon: GitCommit, color: 'text-blue-400', message: 'Pushed 3 commits to dashboardyoyo', time: '2m ago' },
            { type: 'deploy', icon: Rocket, color: 'text-emerald-400', message: 'Deployed to production', time: '5m ago' },
            { type: 'task', icon: CheckCircle2, color: 'text-amber-400', message: 'Completed: File Browser', time: '15m ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-[#8a8a9a] flex-1">{item.message}</span>
              <span className="text-xs text-[#5a5a6a]">{item.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Command Bar - Linear style */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-40 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#5b8aff]/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-[#13131f] border border-white/[0.08] shadow-2xl shadow-black/50 group-focus-within:border-[#5b8aff]/30 transition-colors">
              <Command className="w-5 h-5 text-[#5a5a6a]" />
              
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask Kimi anything... (⌘K)"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendCommand();
                  if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    inputRef.current?.focus();
                  }
                }}
                className="flex-1 bg-transparent text-white placeholder-[#5a5a6a] focus:outline-none text-sm"
              />
              
              {commandInput ? (
                <button
                  onClick={sendCommand}
                  className="p-2 rounded-lg bg-[#5b8aff] text-white hover:bg-[#5b8aff]/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:block px-2 py-1 rounded bg-white/[0.06] text-[#5a5a6a] text-xs">⌘K</kbd>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
