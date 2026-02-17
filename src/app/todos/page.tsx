"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Circle, Plus, Trash2, Calendar, 
  User, Bot, ChevronDown, AlertCircle, Clock, 
  Play, Pause, HelpCircle, Filter, Sparkles,
  AlertTriangle, ArrowRight, Bell, FileText, Zap
} from "lucide-react";

// Task Templates
const taskTemplates = [
  {
    icon: Zap,
    label: "Bug Fix",
    title: "Fix bug in ",
    description: "Investigate and fix the issue",
    priority: "high" as const,
    tags: ["bug"]
  },
  {
    icon: FileText,
    label: "New Feature",
    title: "Build ",
    description: "Implement new functionality",
    priority: "medium" as const,
    tags: ["feature"]
  },
  {
    icon: Sparkles,
    label: "UI Polish",
    title: "Improve UI for ",
    description: "Enhance visual design and UX",
    priority: "low" as const,
    tags: ["ui", "polish"]
  },
  {
    icon: AlertTriangle,
    label: "Urgent Fix",
    title: "URGENT: Fix ",
    description: "Critical issue needs immediate attention",
    priority: "urgent" as const,
    tags: ["urgent", "bug"]
  }
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
  hasAgent?: boolean;
}

const workStatusConfig = {
  working: { 
    label: "Working on it", 
    color: "bg-green-500", 
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    icon: Play
  },
  next: { 
    label: "Up next", 
    color: "bg-yellow-500", 
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10", 
    borderColor: "border-yellow-500/20",
    icon: Clock
  },
  blocked: { 
    label: "Blocked - Need help", 
    color: "bg-red-500", 
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    icon: HelpCircle
  },
  pending: { 
    label: "Pending", 
    color: "bg-gray-500", 
    textColor: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    icon: Pause
  },
  completed: { 
    label: "Completed", 
    color: "bg-blue-500", 
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    icon: CheckCircle2
  },
};

const priorityConfig = {
  urgent: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Urgent" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "High" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Medium" },
  low: { color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", label: "Low" },
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"urgent" | "high" | "medium" | "low">("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "working" | "next" | "blocked" | "completed">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notify?unread=true");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchTodos();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchTodos();
      fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: newTodo,
          description: newDescription,
          priority: newPriority,
          dueDate: newDueDate || null,
          tags: newTags,
          assignee: "kimi",
          workStatus: "next"
        }),
      });
      setNewTodo("");
      setNewDescription("");
      setNewPriority("medium");
      setNewDueDate("");
      setNewTags([]);
      setShowAdd(false);
      fetchTodos();
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const spawnAgent = async (todo: Todo) => {
    try {
      // First update status to working
      await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: todo.id, 
          workStatus: "working",
        }),
      });
      
      // Then spawn the sub-agent
      await fetch("/api/spawn-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: todo.id,
          taskTitle: todo.title,
          taskDescription: todo.description,
          priority: todo.priority,
        }),
      });
      
      fetchTodos();
    } catch (error) {
      console.error("Failed to spawn agent:", error);
    }
  };

  const updateWorkStatus = async (id: string, newStatus: string, todo?: Todo) => {
    try {
      await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, workStatus: newStatus }),
      });
      
      // Send notification if status is "blocked"
      if (newStatus === "blocked" && todo) {
        try {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "blocked_task",
              title: "🚨 Task Blocked - Need Your Help",
              message: `Kimi needs help with: "${todo.title}"`,
              taskId: todo.id,
              priority: todo.priority,
            }),
          });
        } catch (notifyError) {
          console.error("Failed to send notification:", notifyError);
        }
      }
      
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
        body: JSON.stringify({ 
          id, 
          status: newStatus,
          workStatus: newStatus === "completed" ? "completed" : "next"
        }),
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await fetch(`/api/todos?id=${id}`, { method: "DELETE" });
      fetchTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const filteredTodos = (() => {
    let result = todos.filter(t => t.status !== "completed");
    
    if (filter !== "all") {
      result = result.filter(t => t.workStatus === filter);
    }
    
    if (tagFilter) {
      result = result.filter(t => t.tags?.includes(tagFilter));
    }
    
    return result;
  })();

  const completedTodos = todos.filter(t => t.status === "completed");

  // Get all unique tags from incomplete tasks
  const allUniqueTags = Array.from(new Set(
    todos
      .filter(t => t.status !== "completed")
      .flatMap(t => t.tags || [])
  )).sort();

  const stats = {
    working: todos.filter(t => t.workStatus === "working").length,
    next: todos.filter(t => t.workStatus === "next").length,
    blocked: todos.filter(t => t.workStatus === "blocked").length,
    completed: completedTodos.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0 max-w-4xl mx-auto p-4 space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-accent" />
            Kimi&apos;s Tasks
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Everything starts as "Next" → moves to "Working" or "Blocked"
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Notification Bell - Improved */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
              }}
              className={`relative p-3 rounded-xl border transition-all duration-200 ${
                showNotifications 
                  ? "bg-accent/20 border-accent/40 text-accent" 
                  : "bg-white/[0.06] border-white/[0.12] hover:bg-white/[0.1] hover:border-white/[0.2] text-gray-300"
              }`}
            >
              <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-accent' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#0a0a0a] animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Backdrop */}
            {showNotifications && (
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
            )}
            
            {/* Notifications Dropdown - Improved */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-[#111118] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-white">Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-gray-500 text-sm">No notifications yet</p>
                      <p className="text-gray-600 text-xs mt-1">You&apos;ll get notified when tasks are blocked</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-colors ${
                          notif.type === 'blocked_task' ? 'border-l-[3px] border-l-red-500 bg-red-500/[0.02]' : ''
                        }`}
                        onClick={() => {
                          fetch('/api/notify', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: notif.id }),
                          });
                          setShowNotifications(false);
                          fetchNotifications();
                          // Filter to blocked tasks
                          if (notif.type === 'blocked_task') {
                            setFilter('blocked');
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {notif.type === 'blocked_task' && (
                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-white truncate">{notif.title}</p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-600 mt-2">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="h-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-3">
        <button 
          onClick={() => setFilter("working")}
          className={`p-4 rounded-2xl border transition-all ${filter === "working" ? "bg-green-500/10 border-green-500/30" : "bg-green-500/5 border-green-500/10"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Working</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.working}</p>
        </button>
        
        <button 
          onClick={() => setFilter("next")}
          className={`p-4 rounded-2xl border transition-all ${filter === "next" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-500/5 border-yellow-500/10"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs font-medium text-yellow-400">Next</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.next}</p>
        </button>
        
        <button 
          onClick={() => setFilter("blocked")}
          className={`p-4 rounded-2xl border transition-all ${filter === "blocked" ? "bg-red-500/10 border-red-500/30" : "bg-red-500/5 border-red-500/10"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-400">Blocked</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.blocked}</p>
        </button>
        
        <button 
          onClick={() => setFilter("completed")}
          className={`p-4 rounded-2xl border transition-all ${filter === "completed" ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-500/5 border-blue-500/10"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-blue-400">Done</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.completed}</p>
        </button>
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-4">
          
          {/* Templates */}
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Quick Templates</label>
            <div className="flex gap-2 flex-wrap">
              {taskTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.label}
                    onClick={() => {
                      setNewTodo(template.title);
                      setNewDescription(template.description);
                      setNewPriority(template.priority);
                      setNewTags(template.tags);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-sm text-gray-300 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-accent" />
                    {template.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="h-px bg-white/[0.06]" />
          
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Task Title</label>
            <input
              type="text"
              placeholder="What should Kimi do?"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addTodo()}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent/30"
              autoFocus
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Description (optional)</label>
            <textarea
              placeholder="Add more details..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent/30 resize-none"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Priority</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "urgent", label: "🔴 Urgent", desc: "Fix immediately" },
                { key: "high", label: "🟠 High", desc: "Do today" },
                { key: "medium", label: "🟡 Medium", desc: "Do this week" },
                { key: "low", label: "⚪ Low", desc: "When possible" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setNewPriority(p.key as any)}
                  className={newPriority === p.key
                    ? "px-4 py-2 rounded-xl bg-accent/20 text-accent border border-accent/30 text-sm text-left"
                    : "px-4 py-2 rounded-xl bg-white/[0.04] text-gray-400 border border-white/[0.08] text-sm hover:bg-white/[0.06] text-left"
                  }
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="block text-xs opacity-70 mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-2 block">Due Date (optional)</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/30"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-500 mb-2 block">Tags (optional)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newTags.map((tag) => (
                  <span 
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 text-accent text-xs"
                  >
                    #{tag}
                    <button 
                      onClick={() => setNewTags(newTags.filter(t => t !== tag))}
                      className="hover:text-white ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      if (!newTags.includes(tagInput.trim())) {
                        setNewTags([...newTags, tagInput.trim()]);
                      }
                      setTagInput("");
                    }
                  }}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent/30 text-sm"
                />
                <button
                  onClick={() => {
                    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
                      setNewTags([...newTags, tagInput.trim()]);
                      setTagInput("");
                    }
                  }}
                  className="px-3 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button 
              onClick={addTodo} 
              className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Assign to Kimi
            </button>
            <button 
              onClick={() => {
                setShowAdd(false);
                setNewTodo("");
                setNewDescription("");
                setNewPriority("medium");
                setNewDueDate("");
                setNewTags([]);
              }} 
              className="px-4 py-2.5 text-gray-400 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Tasks */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            {filter === "all" ? "Active Tasks" : filter.charAt(0).toUpperCase() + filter.slice(1)}
            {tagFilter && <span className="ml-2 text-accent">· #{tagFilter}</span>}
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Tag Filter */}
            {allUniqueTags.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto">
                <span className="text-xs text-gray-500 mr-1">Filter:</span>
                {allUniqueTags.slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                      tagFilter === tag
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:bg-white/[0.08]"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                {allUniqueTags.length > 5 && (
                  <span className="text-xs text-gray-500">+{allUniqueTags.length - 5}</span>
                )}
              </div>
            )}
            
            {(filter !== "all" || tagFilter) && (
              <button 
                onClick={() => {
                  setFilter("all");
                  setTagFilter(null);
                }}
                className="text-sm text-accent hover:text-accent/80 whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              {filter === "blocked" ? (
                <AlertCircle className="w-8 h-8 text-red-400" />
              ) : filter === "working" ? (
                <Play className="w-8 h-8 text-green-400" />
              ) : (
                <Clock className="w-8 h-8 text-yellow-400" />
              )}
            </div>
            <p className="text-gray-500">
              {filter === "all" ? "No active tasks. Add one above!" : `No ${filter} tasks.`}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const config = workStatusConfig[todo.workStatus] || workStatusConfig.next;
            const StatusIcon = config.icon;
            const prio = priorityConfig[todo.priority];
            
            return (
              <div
                key={todo.id}
                className="group flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all"
              >
                {/* Complete Toggle */}
                <button 
                  onClick={() => toggleComplete(todo.id, todo.status)}
                  className="flex-shrink-0 mt-0.5"
                >
                  <Circle className="h-5 w-5 text-gray-500 hover:text-accent transition-colors" />
                </button>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white truncate">{todo.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${prio.bg} ${prio.color} ${prio.border}`}>
                      {prio.label}
                    </span>
                  </div>
                  
                  {todo.description && (
                    <p className="text-sm text-gray-500 mb-2">{todo.description}</p>
                  )}
                  
                  {/* Tags */}
                  {todo.tags && todo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {todo.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            tagFilter === tag
                              ? "bg-accent/20 text-accent border-accent/30"
                              : "bg-white/[0.04] text-gray-400 border-white/[0.08] hover:bg-white/[0.08]"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-accent">
                      <Bot className="w-3 h-3" />
                      Kimi
                    </span>
                    
                    {/* Due Date with Overdue Warning */}
                    {todo.dueDate && (
                      <span className={`flex items-center gap-1 text-xs ${
                        new Date(todo.dueDate) < new Date() && todo.status !== "completed"
                          ? "text-red-400 font-medium"
                          : "text-gray-500"
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(todo.dueDate) < new Date() && todo.status !== "completed" ? (
                          <>
                            Overdue: {new Date(todo.dueDate).toLocaleDateString()}
                          </>
                        ) : (
                          new Date(todo.dueDate).toLocaleDateString()
                        )}
                      </span>
                    )}
                    
                    {todo.hasAgent && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Sparkles className="w-3 h-3" />
                        Agent
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Spawn Agent Button */}
                  {todo.workStatus === "next" && (
                    <button
                      onClick={() => spawnAgent(todo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors"
                      title="Spawn sub-agent to work on this"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Start
                    </button>
                  )}

                  {/* Status Dropdown */}
                  <div className="relative"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === todo.id ? null : todo.id);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} hover:opacity-80 transition-opacity`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{config.label}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === todo.id ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openDropdown === todo.id && (
                      <div className="absolute right-0 top-full mt-1 w-52 bg-bg-card border border-white/[0.08] rounded-xl shadow-xl z-50 py-1"
                      >
                        {Object.entries(workStatusConfig).map(([key, conf]) => {
                          if (key === "completed" || key === "pending") return null;
                          const Icon = conf.icon;
                          return (
                            <button
                              key={key}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateWorkStatus(todo.id, key, todo);
                                setOpenDropdown(null);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/[0.04] transition-colors ${
                                todo.workStatus === key ? 'bg-white/[0.04]' : ''
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${conf.textColor}`} />
                              <div>
                                <p className="text-gray-200">{conf.label}</p>
                                <p className="text-[10px] text-gray-500">
                                  {key === "working" && "Kimi is actively working on this"}
                                  {key === "next" && "Waiting to be worked on"}
                                  {key === "blocked" && "Need your input to continue"}
                                </p>
                              </div>
                              {todo.workStatus === key && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-accent ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <button 
                    onClick={() => deleteTodo(todo.id)} 
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completed Tasks */}
      {completedTodos.length > 0 && filter === "all" && (
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <h2 className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completed ({completedTodos.length})
          </h2>
          
          <div className="space-y-2 opacity-60">
            {completedTodos.slice(0, 3).map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <button onClick={() => toggleComplete(todo.id, todo.status)}>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </button>
                <p className="flex-1 text-gray-400 line-through">{todo.title}</p>
              </div>
            ))}
            {completedTodos.length > 3 && (
              <p className="text-sm text-gray-500 pl-2">+{completedTodos.length - 3} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
