"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Circle, Plus, Trash2, Calendar, 
  Bot, ChevronDown, Clock, Play, HelpCircle,
  Filter, Sparkles, AlertTriangle, ArrowRight, Bell
} from "lucide-react";

// Task Templates
const taskTemplates = [
  { icon: AlertTriangle, label: "Bug Fix", title: "Fix ", priority: "high" as const, tags: ["bug"] },
  { icon: Sparkles, label: "Feature", title: "Build ", priority: "medium" as const, tags: ["feature"] },
  { icon: Clock, label: "Polish", title: "Improve ", priority: "low" as const, tags: ["ui"] },
];

interface Todo {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  priority: "urgent" | "high" | "medium" | "low";
  assignee: "user" | "kimi";
  workStatus: "pending" | "working" | "next" | "blocked" | "completed";
  dueDate?: string;
  tags: string[];
  createdAt: string;
}

const statusConfig = {
  working: { 
    label: "Working", 
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_10px_rgba(52,211,153,0.5)]",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  next: { 
    label: "Next", 
    dot: "bg-amber-400",
    glow: "",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  blocked: { 
    label: "Blocked", 
    dot: "bg-red-500",
    glow: "shadow-[0_0_10px_rgba(239,68,68,0.5)]",
    badge: "bg-red-500/10 text-red-400 border-red-500/20"
  },
};

const priorityConfig = {
  urgent: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Urgent" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "High" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Medium" },
  low: { color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", label: "Low" },
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState("");
  const [newPriority, setNewPriority] = useState<"urgent" | "high" | "medium" | "low">("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "working" | "next" | "blocked">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      if (data.success) setTodos(data.todos);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
    const interval = setInterval(fetchTodos, 5000);
    return () => clearInterval(interval);
  }, []);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: newTodo,
          priority: newPriority,
          dueDate: newDueDate || null,
          tags: newTags,
          assignee: "kimi",
          workStatus: "next"
        }),
      });
      setNewTodo("");
      setNewPriority("medium");
      setNewDueDate("");
      setNewTags([]);
      setShowAdd(false);
      fetchTodos();
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const updateWorkStatus = async (id: string, newStatus: string) => {
    try {
      await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, workStatus: newStatus }),
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const toggleComplete = async (id: string, current: string) => {
    const newStatus = current === "completed" ? "pending" : "completed";
    try {
      await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, workStatus: newStatus === "completed" ? "completed" : "next" }),
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to toggle:", error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await fetch(`/api/todos?id=${id}`, { method: "DELETE" });
      fetchTodos();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const filteredTodos = (() => {
    let result = todos.filter(t => t.status !== "completed");
    if (filter !== "all") result = result.filter(t => t.workStatus === filter);
    if (tagFilter) result = result.filter(t => t.tags?.includes(tagFilter));
    return result;
  })();

  const completedTodos = todos.filter(t => t.status === "completed");
  const allUniqueTags = Array.from(new Set(todos.filter(t => t.status !== "completed").flatMap(t => t.tags || []))).sort();

  const stats = {
    working: todos.filter(t => t.workStatus === "working").length,
    next: todos.filter(t => t.workStatus === "next").length,
    blocked: todos.filter(t => t.workStatus === "blocked").length,
    completed: completedTodos.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b8aff] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tasks</h1>
          <p className="text-[#8a8a9a] text-sm mt-1">Manage and track all your work</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Stats - Linear style */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: "working", label: "Working", value: stats.working, color: "emerald" },
          { key: "next", label: "Next", value: stats.next, color: "amber" },
          { key: "blocked", label: "Blocked", value: stats.blocked, color: "red" },
          { key: "completed", label: "Done", value: stats.completed, color: "gray" },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setFilter(stat.key === "completed" ? "all" : stat.key as any)}
            className={`p-4 rounded-xl bg-[#13131f] border transition-all text-left ${
              filter === stat.key 
                ? `border-${stat.color}-500/30 bg-${stat.color}-500/5` 
                : "border-white/[0.06] hover:border-white/[0.1]"
            }`}
          >
            <p className="text-xs font-medium text-[#5a5a6a] uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-semibold text-white mt-1">{stat.value}</p>
            <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div 
                className={`h-full bg-${stat.color}-500 rounded-full transition-all`}
                style={{ width: `${Math.min((stat.value / Math.max(todos.length, 1)) * 100, 100)}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <div className="p-5 bg-[#13131f] border border-white/[0.06] rounded-xl space-y-4">
          
          {/* Templates */}
          <div className="flex gap-2">
            {taskTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.label}
                  onClick={() => {
                    setNewTodo(template.title);
                    setNewPriority(template.priority);
                    setNewTags(template.tags);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-sm text-[#8a8a9a] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {template.label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="What should Kimi do?"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-[#5a5a6a] focus:outline-none focus:border-[#5b8aff]/50"
            autoFocus
          />

          <div className="flex gap-3 flex-wrap">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5b8aff]/50"
            >
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">⚪ Low</option>
            </select>

            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5b8aff]/50"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {newTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#5b8aff]/10 text-[#5b8aff] text-xs">
                #{tag}
                <button onClick={() => setNewTags(newTags.filter(t => t !== tag))} className="hover:text-white">×</button>
              </span>
            ))}
            <input
              type="text"
              placeholder="+ tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim()) {
                  if (!newTags.includes(tagInput.trim())) setNewTags([...newTags, tagInput.trim()]);
                  setTagInput("");
                }
              }}
              className="bg-transparent text-sm text-white placeholder-[#5a5a6a] focus:outline-none w-20"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={addTodo} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Assign to Kimi
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-[#8a8a9a] hover:text-white text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tag Filter */}
      {allUniqueTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#5a5a6a]">Filter:</span>
          {allUniqueTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`px-2 py-1 rounded-md text-xs transition-colors ${
                tagFilter === tag 
                  ? "bg-[#5b8aff]/20 text-[#5b8aff]" 
                  : "bg-white/[0.04] text-[#8a8a9a] hover:bg-white/[0.08]"
              }`}
            >
              #{tag}
            </button>
          ))}
          {tagFilter && (
            <button onClick={() => setTagFilter(null)} className="text-xs text-[#5a5a6a] hover:text-white">Clear</button>
          )}
        </div>
      )}

      {/* Task List - Linear style */}
      <div className="space-y-2">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#5a5a6a]" />
            </div>
            <p className="text-[#8a8a9a]">No tasks found</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const config = statusConfig[todo.workStatus as keyof typeof statusConfig];
            const prio = priorityConfig[todo.priority];
            const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && todo.status !== "completed";
            
            return (
              <div
                key={todo.id}
                className="group flex items-center gap-4 p-4 rounded-xl bg-[#13131f] border border-white/[0.06] hover:border-white/[0.1] transition-all"
              >
                <button onClick={() => toggleComplete(todo.id, todo.status)} className="flex-shrink-0">
                  <Circle className="h-5 w-5 text-[#5a5a6a] hover:text-[#5b8aff] transition-colors" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-white truncate">{todo.title}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${prio.bg} ${prio.color} ${prio.border}`}>
                      {prio.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-[#5b8aff]">
                      <Bot className="w-3 h-3" />
                      Kimi
                    </span>

                    {todo.dueDate && (
                      <span className={`text-xs ${isOverdue ? 'text-red-400 font-medium' : 'text-[#5a5a6a]'}`}>
                        {isOverdue ? 'Overdue: ' : ''}{new Date(todo.dueDate).toLocaleDateString()}
                      </span>
                    )}

                    {todo.tags?.map((tag) => (
                      <span key={tag} className="text-xs text-[#5a5a6a]">#{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="relative group/status">
                  <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${config?.badge || statusConfig.next.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config?.dot} ${todo.workStatus === 'working' ? 'animate-pulse' : ''}`} />
                    {config?.label}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-40 bg-[#1c1c28] border border-white/[0.08] rounded-lg shadow-xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-10">
                    {Object.entries(statusConfig).map(([key, conf]) => (
                      <button
                        key={key}
                        onClick={() => updateWorkStatus(todo.id, key)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#8a8a9a] hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                        {conf.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => deleteTodo(todo.id)} 
                  className="opacity-0 group-hover:opacity-100 p-2 text-[#5a5a6a] hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Completed */}
      {completedTodos.length > 0 && (
        <div className="pt-4 border-t border-white/[0.06]">
          <p className="text-xs text-[#5a5a6a] mb-3">Completed ({completedTodos.length})</p>
          <div className="space-y-2 opacity-50">
            {completedTodos.slice(0, 3).map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#13131f]/50">
                <button onClick={() => toggleComplete(todo.id, todo.status)}>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </button>
                <p className="text-[#8a8a9a] line-through">{todo.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
