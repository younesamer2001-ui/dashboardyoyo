"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Plus, Trash2, Calendar } from "lucide-react";

interface Todo {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  priority: "urgent" | "high" | "medium" | "low";
  createdAt: string;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState("");
  const [showAdd, setShowAdd] = useState(false);

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
        body: JSON.stringify({ title: newTodo, priority: "medium" }),
      });
      setNewTodo("");
      setShowAdd(false);
      fetchTodos();
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const toggleTodo = async (id: string, current: string) => {
    const newStatus = current === "completed" ? "pending" : "completed";
    try {
      await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0 max-w-3xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-gray-400">{todos.filter(t => t.status === "pending").length} pending</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={addTodo} className="px-4 py-1.5 bg-accent rounded text-sm">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tasks yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 p-3 bg-gray-800 rounded-lg ${
                todo.status === "completed" ? "opacity-50" : ""
              }`}
            >
              <button onClick={() => toggleTodo(todo.id, todo.status)}>
                {todo.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-500" />
                )}
              </button>
              <span className={`flex-1 ${todo.status === "completed" ? "line-through text-gray-500" : ""}`}>
                {todo.title}
              </span>
              <button onClick={() => deleteTodo(todo.id)} className="text-gray-500 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
