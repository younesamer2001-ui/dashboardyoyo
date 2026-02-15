"use client";
import { useState, useEffect, useRef } from "react";
import { Users, X, Activity, Check, RotateCcw } from "lucide-react";
import AgentCard from "@/components/dashboard/AgentCard";
import { Agent } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        if (data.success) {
          setAgents(data.agents);
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    if (!selected || !promptRef.current) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          systemPrompt: promptRef.current.value,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = async () => {
    if (!selected) return;
    setRestarting(true);
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          status: 'active',
          currentTask: 'Restarting...',
          lastActive: new Date().toISOString(),
        }),
      });
      // Brief visual feedback
      setTimeout(() => setRestarting(false), 1500);
    } catch (error) {
      console.error('Failed to restart:', error);
      setRestarting(false);
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-accent" />
          Agents
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your AI agents. Click on an agent for details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent cards */}
        <div className="space-y-4">
          {agents.length === 0 ? (
            <div className="rounded-xl border border-border-main border-dashed bg-bg-card/50 p-12 flex flex-col items-center justify-center text-center">
              <Activity className="h-10 w-10 text-text-secondary/40 mb-3" />
              <p className="text-sm text-text-secondary">
                No agents registered yet. Agents will appear here when they connect.
              </p>
            </div>
          ) : (
            agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => setSelected(agent)}
              />
            ))
          )}
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <div className="rounded-xl border border-border-main bg-bg-card p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selected.icon || selected.emoji || 'K'}</span>
                  <div>
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    <p className="text-sm text-text-secondary">{selected.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-bg-card-hover text-text-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    selected.status === 'active' ? 'bg-success animate-pulse' :
                    selected.status === 'idle' ? 'bg-warning' : 'bg-error'
                  }`} />
                  <span className="text-sm capitalize">{selected.status || 'idle'}</span>
                </div>
              </div>

              {/* Current Task */}
              {selected.currentTask && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Current Task
                  </label>
                  <p className="mt-1 text-sm text-text-primary">{selected.currentTask}</p>
                </div>
              )}

              {/* System prompt */}
              {selected.systemPrompt && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    System Prompt
                  </label>
                  <textarea
                    ref={promptRef}
                    defaultValue={selected.systemPrompt}
                    rows={5}
                    className="mt-2 w-full rounded-lg border border-border-main bg-bg-primary p-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {/* Model */}
              {selected.model && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Model
                  </label>
                  <p className="mt-1 text-sm font-mono text-accent-light">{selected.model}</p>
                </div>
              )}

              {/* Last Active */}
              {selected.lastActive && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Last Active
                  </label>
                  <p className="mt-1 text-sm">
                    {new Date(selected.lastActive).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Metrics */}
              {selected.metrics && Object.keys(selected.metrics).length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Metrics
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(selected.metrics).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-bg-primary p-2">
                        <p className="text-[10px] text-text-secondary uppercase">{key}</p>
                        <p className="text-sm font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-accent/15 text-accent py-2 text-sm font-medium hover:bg-accent/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saveSuccess ? (
                    <><Check className="h-4 w-4" /> Saved!</>
                  ) : saving ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  onClick={handleRestart}
                  disabled={restarting}
                  className="rounded-lg border border-border-main px-4 py-2 text-sm text-text-secondary hover:bg-bg-card-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${restarting ? 'animate-spin' : ''}`} />
                  {restarting ? 'Restarting...' : 'Restart'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border-main border-dashed bg-bg-card/50 p-12 flex flex-col items-center justify-center text-center">
              <Users className="h-10 w-10 text-text-secondary/40 mb-3" />
              <p className="text-sm text-text-secondary">
                Select an agent to view details and edit prompt
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

