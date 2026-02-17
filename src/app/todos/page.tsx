"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Circle, Plus, Trash2, Calendar, 
  User, Bot, ChevronDown, AlertCircle, Clock, 
  Play, Pause, HelpCircle, Filter
} from "lucide-react";

interface Todo {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  priority: "urgent" | "high" | "medium" | "low";
  assignee: "user" | "kimi";
  workStatus: "pending" | "working" | "next" | "blocked" | "completed";
  createdAt: string;
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

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState("");
  const [newAssignee, setNewAssignee] = useState<"kimi" | "user">("kimi");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "kimi" | "user">("all");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  // Close dropdown when clicking outside
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
          priority: "medium",
          assignee: newAssignee,
          workStatus: "pending"
        }),
      });
      setNewTodo("");
      setShowAdd(false);
      fetchTodos();
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const updateWorkStatus = async (id: string, workStatus: string) => {
    try {
      await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, workStatus }),
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
        body: JSON.stringify({ 
          id, 
          status: newStatus,
          workStatus: newStatus === "completed" ? "completed" : "pending"
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

  const filteredTodos = filter === "all" 
    ? todos 
    : todos.filter(t => t.assignee === filter);

  const kimisWorking = todos.filter(t => t.assignee === "kimi" && t.workStatus === "working");
  const kimisNext = todos.filter(t => t.assignee === "kimi" && t.workStatus === "next");
  const kimisBlocked = todos.filter(t => t.assignee === "kimi" && t.workStatus === "blocked");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0 max-w-4xl mx-auto p-4 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-accent" />
            Tasks
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {todos.filter(t => t.status === "pending").length} pending · {kimisWorking.length} in progress
          </p>
        </div>
        
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Kimi's Status Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-400">Working Now</span>
          </div>
          <p className="text-2xl font-bold text-white">{kimisWorking.length}</p>
        </div>
        
        <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs font-medium text-yellow-400">Up Next</span>
          </div>
          <p className="text-2xl font-bold text-white">{kimisNext.length}</p>
        </div>
        
        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-400">Need Help</span>
          </div>
          <p className="text-2xl font-bold text-white">{kimisBlocked.length}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={filter === "all" 
            ? "px-4 py-2 rounded-xl text-sm font-medium bg-accent/20 text-accent border border-accent/30"
            : "px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.02] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]"
          }
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter("kimi")}
          className={filter === "kimi"
            ? "px-4 py-2 rounded-xl text-sm font-medium bg-accent/20 text-accent border border-accent/30"
            : "px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.02] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]"
          }
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Kimi&apos;s Tasks
          </div>
        </button>
        <button
          onClick={() => setFilter("user")}
          className={filter === "user"
            ? "px-4 py-2 rounded-xl text-sm font-medium bg-accent/20 text-accent border border-accent/30"
            : "px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.02] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]"
          }
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Your Tasks
          </div>
        </button>
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent/30"
            autoFocus
          />
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Assign to:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setNewAssignee("kimi")}
                className={newAssignee === "kimi"
                  ? "px-3 py-1.5 rounded-lg bg-accent/20 text-accent border border-accent/30 text-sm"
                  : "px-3 py-1.5 rounded-lg bg-white/[0.04] text-gray-400 border border-white/[0.08] text-sm hover:bg-white/[0.06]"
                }
              >
                <div className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  Kimi
                </div>
              </button>
              <button
                onClick={() => setNewAssignee("user")}
                className={newAssignee === "user"
                  ? "px-3 py-1.5 rounded-lg bg-accent/20 text-accent border border-accent/30 text-sm"
                  : "px-3 py-1.5 rounded-lg bg-white/[0.04] text-gray-400 border border-white/[0.08] text-sm hover:bg-white/[0.06]"
                }
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  You
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={addTodo} 
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-medium"
            >
              Add Task
            </button>
            <button 
              onClick={() => setShowAdd(false)} 
              className="px-4 py-2 text-gray-400 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500">No tasks yet. Add one above!</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const config = workStatusConfig[todo.workStatus] || workStatusConfig.pending;
            const StatusIcon = config.icon;
            
            return (
              <div
                key={todo.id}
                className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  todo.status === "completed"
                    ? "bg-white/[0.02] border-white/[0.04] opacity-60"
                    : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1]"
                }`}
              >
                {/* Complete Toggle */}
                <button 
                  onClick={() => toggleComplete(todo.id, todo.status)}
                  className="flex-shrink-0"
                >
                  {todo.status === "completed" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-500 hover:text-accent transition-colors" />
                  )}
                </button>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    todo.status === "completed" ? "line-through text-gray-500" : "text-white"
                  }`}>
                    {todo.title}
                  </p>                  
                  <div className="flex items-center gap-2 mt-1">
                    {todo.assignee === "kimi" ? (
                      <span className="flex items-center gap-1 text-xs text-accent">
                        <Bot className="w-3 h-3" />
                        Kimi
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        You
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="relative">
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
                  
                  {/* Dropdown Menu */}
                  {openDropdown === todo.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-bg-card border border-white/[0.08] rounded-xl shadow-xl z-50 py-1">
                      {Object.entries(workStatusConfig).map(([key, conf]) => {
                        if (key === "completed") return null;
                        const Icon = conf.icon;
                        return (
                          <button
                            key={key}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateWorkStatus(todo.id, key);
                              setOpenDropdown(null);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/[0.04] transition-colors ${
                              todo.workStatus === key ? 'bg-white/[0.04]' : ''
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${conf.textColor}`} />
                            <span className="text-gray-300">{conf.label}</span>
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
            );
          })
        )}
      </div>
    </div>
  );
}
