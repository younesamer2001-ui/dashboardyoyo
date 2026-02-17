"use client";

import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard, CheckCircle, Users, Clock, MessageSquare, 
  Send, Zap, Search, FileText, BarChart3, Bot, Sparkles, 
  Wifi, WifiOff, TrendingUp, Calendar, ArrowRight, 
  Command, Plus, Bell, ChevronRight
} from "lucide-react";

interface Stats {
  tasksPending: number;
  tasksCompleted: number;
  activeAgents: number;
  messagesToday: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  agent?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false 
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { 
    weekday: "long",
    month: "long", 
    day: "numeric" 
  });
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats>({
    tasksPending: 0,
    tasksCompleted: 0,
    activeAgents: 0,
    messagesToday: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [commandInput, setCommandInput] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, todosRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/todos"),
        ]);
        
        const statsData = await statsRes.json();
        const todosData = await todosRes.json();
        
        if (statsData.success) {
          setStats({
            tasksPending: todosData.todos?.filter((t: any) => t.status === 'pending').length || 0,
            tasksCompleted: statsData.stats?.tasksCompleted || 0,
            activeAgents: statsData.stats?.activeAgents || 0,
            messagesToday: statsData.stats?.messagesExchanged || 0
          });
        }
        
        if (todosData.success) {
          setTodos(todosData.todos?.slice(0, 3) || []);
        }
        
        // Mock activities for now
        setActivities([
          { id: '1', type: 'task', message: 'Completed deployment of Dashboard YOYO', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { id: '2', type: 'chat', message: 'Kimi fixed auto-scroll bug in Chat', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
          { id: '3', type: 'agent', message: 'X Poster Agent posted to Twitter', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
          { id: '4', type: 'system', message: 'System health check: All good', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
        ]);
        
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to fetch:", error);
        setIsConnected(false);
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0 max-w-6xl mx-auto space-y-6 pb-24">
      
      {/* ═══════════════════════════════════════════════════════════════
           HERO SECTION - Big clock, greeting, and quick actions
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bg-card via-bg-card to-accent/5 border border-white/[0.06] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          
          {/* Left: Greeting & Date */}
          <div className="space-y-1">
            <p className="text-sm text-gray-400 font-medium">{formatDate(currentTime)}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {getGreeting()}, <span className="text-accent">Younes</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-md">
              Welcome back to your AI Command Center. Here&apos;s what&apos;s happening today.
            </p>
          </div>
          
          {/* Right: Big Clock */}
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
              {formatTime(currentTime)}
            </span>
            <span className="text-lg text-gray-500">
              {currentTime.getSeconds().toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="relative z-10 mt-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10">
              <Bell className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Tasks</p>
              <p className="text-lg font-bold text-white">{stats.tasksPending}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-lg font-bold text-white">{stats.tasksCompleted}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Agents</p>
              <p className="text-lg font-bold text-white">{stats.activeAgents}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 ml-auto">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-400">All Systems Operational</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           TODAY'S FOCUS - What needs attention
          ═══════════════════════════════════════════════════════════════ */}
      
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Priority Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              Today&apos;s Focus
            </h2>
            <a href="/todos" className="text-xs text-accent hover:text-accent/80 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          
          <div className="space-y-3">
            {todos.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-accent/50" />
                </div>
                <p className="text-gray-400 text-sm">No tasks for today. You&apos;re all caught up!</p>
                <button 
                  onClick={() => window.location.href = '/todos'}
                  className="mt-4 px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors"
                >
                  Add Task
                </button>
              </div>
            ) : (
              todos.map((todo) => (
                <div 
                  key={todo.id}
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/20 transition-all"
                >
                  <button 
                    onClick={() => {/* toggle */}}
                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-600 hover:border-accent transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{todo.title}</p>
                    {todo.description && (
                      <p className="text-gray-500 text-sm truncate">{todo.description}</p>
                    )}
                  </div>
                  <span className={`
                    px-2 py-1 rounded-full text-[10px] font-medium uppercase
                    ${todo.priority === 'urgent' ? 'bg-red-500/10 text-red-400' : ''}
                    ${todo.priority === 'high' ? 'bg-orange-500/10 text-orange-400' : ''}
                    ${todo.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                    ${todo.priority === 'low' ? 'bg-gray-500/10 text-gray-400' : ''}
                  `}>
                    {todo.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Right: Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Recent Activity
          </h2>
          
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
            {activities.map((activity, i) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-2 h-2 rounded-full 
                    ${activity.type === 'task' ? 'bg-green-400' : ''}
                    ${activity.type === 'chat' ? 'bg-blue-400' : ''}
                    ${activity.type === 'agent' ? 'bg-purple-400' : ''}
                    ${activity.type === 'system' ? 'bg-gray-400' : ''}
                  `} />
                  {i < activities.length - 1 && (
                    <div className="w-px flex-1 bg-white/[0.06] my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-200">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{getRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           QUICK ACTIONS - Common tasks
          ═══════════════════════════════════════════════════════════════ */}
      
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Search, label: "Research", desc: "Find information", color: "text-blue-400", bg: "bg-blue-500/10" },
          { icon: FileText, label: "Create Doc", desc: "New document", color: "text-purple-400", bg: "bg-purple-500/10" },
          { icon: BarChart3, label: "Analytics", desc: "View stats", color: "text-amber-400", bg: "bg-amber-500/10" },
          { icon: MessageSquare, label: "Chat", desc: "Talk to Kimi", color: "text-green-400", bg: "bg-green-500/10" },
        ].map((action) => (
          <a
            key={action.label}
            href={action.label === 'Chat' ? '/chat' : '#'}
            className="group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/20 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
            </div>
            <p className="font-medium text-white">{action.label}</p>
            <p className="text-xs text-gray-500">{action.desc}</p>
          </a>
        ))}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           SPOTLIGHT COMMAND BAR - Fixed at bottom
          ═══════════════════════════════════════════════════════════════ */}
      
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-bg-card border border-white/[0.08] shadow-2xl shadow-black/50 group-focus-within:border-accent/30 transition-colors">
              <Command className="w-5 h-5 text-gray-500" />
              
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
                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
              />
              
              {commandInput ? (
                <button
                  onClick={sendCommand}
                  className="p-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:block px-2 py-1 rounded bg-white/[0.06] text-gray-500 text-xs">⌘K</kbd>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
