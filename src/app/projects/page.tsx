"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban, Plus, MoreHorizontal, GitBranch, ExternalLink,
  MessageSquare, Rocket, PauseCircle, AlertCircle, CheckCircle2,
  Clock, Calendar, ArrowUpRight, TrendingUp, Activity, Code2,
  Terminal, RefreshCw, Trash2, Edit3, ArrowRight
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "blocked" | "completed";
  progress: number;
  category: string;
  tech: string[];
  repoUrl?: string;
  liveUrl?: string;
  lastActivity: string;
  tasksTotal: number;
  tasksDone: number;
  createdAt: string;
  priority: "high" | "medium" | "low";
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Dashboard YOYO",
    description: "AI Command Center for agent management, tasks, and real-time monitoring",
    status: "active",
    progress: 75,
    category: "Productivity",
    tech: ["Next.js", "TypeScript", "Tailwind", "Supabase"],
    repoUrl: "https://github.com/younesamer2001-ui/dashboardyoyo",
    liveUrl: "https://dashboardyoyo.com",
    lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tasksTotal: 24,
    tasksDone: 18,
    createdAt: "2025-02-15",
    priority: "high"
  },
  {
    id: "2",
    name: "Siha Shopify",
    description: "E-commerce platform for Siha with Tekla-inspired theme",
    status: "active",
    progress: 60,
    category: "E-commerce",
    tech: ["Shopify", "Liquid", "CSS"],
    liveUrl: "https://siha.no",
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tasksTotal: 15,
    tasksDone: 9,
    createdAt: "2025-01-20",
    priority: "high"
  },
  {
    id: "3",
    name: "X/Twitter Agent",
    description: "Automated content creation and posting system for X/Twitter",
    status: "active",
    progress: 85,
    category: "Automation",
    tech: ["n8n", "X API", "OpenAI"],
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    tasksTotal: 12,
    tasksDone: 10,
    createdAt: "2025-02-01",
    priority: "medium"
  },
  {
    id: "4",
    name: "AI Receptionist",
    description: "Voice AI system for plumbers and tradespeople",
    status: "paused",
    progress: 30,
    category: "AI Service",
    tech: ["Vapi", "n8n", "Voice AI"],
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    tasksTotal: 20,
    tasksDone: 6,
    createdAt: "2025-02-10",
    priority: "medium"
  }
];

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

function StatusBadge({ status }: { status: Project["status"] }) {
  const config = {
    active: { icon: Rocket, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Active" },
    paused: { icon: PauseCircle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Paused" },
    blocked: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Blocked" },
    completed: { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Completed" },
  };
  
  const { icon: Icon, color, bg, border, label } = config[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${color} border ${border}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Project["priority"] }) {
  const colors = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border ${colors[priority]}`}>
      {priority}
    </span>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<"all" | Project["status"]>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - later connect to real API
    setTimeout(() => {
      setProjects(mockProjects);
      setLoading(false);
    }, 500);
  }, []);

  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(p => p.status === filter);

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    blocked: projects.filter(p => p.status === "blocked").length,
    avgProgress: Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) || 0,
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-accent" />
            </div>
            Projects
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage and track all your active projects</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: stats.total, icon: FolderKanban, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Active", value: stats.active, icon: Rocket, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Avg Progress", value: `${stats.avgProgress}%`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All Projects", count: stats.total },
          { key: "active", label: "Active", count: stats.active },
          { key: "paused", label: "Paused", count: projects.filter(p => p.status === "paused").length },
          { key: "blocked", label: "Blocked", count: stats.blocked },
          { key: "completed", label: "Completed", count: stats.completed },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
              ${filter === f.key 
                ? "bg-accent/20 text-accent border border-accent/30" 
                : "bg-white/[0.02] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]"
              }
            `}
          >
            {f.label}
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[10px]">
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProjects.map((project) => (
          <div 
            key={project.id}
            className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-accent/20 hover:bg-white/[0.04] transition-all p-5"
          >
            {/* Top Row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/10 flex items-center justify-center text-xl">
                  {project.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-accent transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{project.category}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <PriorityBadge priority={project.priority} />
                <StatusBadge status={project.status} />
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-500">Progress</span>
                <span className="text-white font-medium">{project.progress}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tech.map((t) => (
                <span 
                  key={t}
                  className="px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-gray-400 border border-white/[0.06]"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {getRelativeTime(project.lastActivity)}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {project.tasksDone}/{project.tasksTotal} tasks
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {project.repoUrl && (
                  <a 
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors"
                    title="View Code"
                  >
                    <GitBranch className="w-4 h-4" />
                  </a>
                )}
                {project.liveUrl && (
                  <a 
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors"
                    title="Open Live"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button className="p-2 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-white font-medium mb-1">No projects found</p>
          <p className="text-gray-500 text-sm">Create your first project to get started</p>
        </div>
      )}
    </div>
  );
}
