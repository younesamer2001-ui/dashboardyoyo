"use client";

import { useState, useEffect, useRef } from "react";
import { Users, X, Activity, Check, RotateCcw, Upload, FileText, Trash2, Paperclip } from "lucide-react";
import AgentCard from "@/components/dashboard/AgentCard";
import { Agent } from "@/lib/types";

interface AgentFile {
  name: string;
  url: string;
  size: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [agentFiles, setAgentFiles] = useState<AgentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Update local state when agent is selected
  useEffect(() => {
    if (selected) {
      setPromptValue(selected.systemPrompt || "");
      setAgentFiles(selected.files || []);
    }
  }, [selected]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selected.id,
          status: selected.status || 'active',
          systemPrompt: promptValue,
          files: agentFiles,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        // Update local selected agent
        setSelected(prev => prev ? { ...prev, systemPrompt: promptValue, files: agentFiles } : null);
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
          agentId: selected.id,
          status: 'active',
          currentTask: 'Restarting...',
          lastActive: new Date().toISOString(),
        }),
      });
      setTimeout(() => setRestarting(false), 1500);
    } catch (error) {
      console.error('Failed to restart:', error);
      setRestarting(false);
    }
  };rrent Task
                  </label>
                  <p className="mt-1 text-sm text-text-primary">{selected.currentTask}</p>
                </div>
              )}

              {/* System Prompt - ALWAYS VISIBLE */}
              <div className="mb-4">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  System Prompt
                </label>
                <textarea
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="Enter a system prompt for this agent... e.g. 'You are a research assistant that finds and summarizes web articles.'"
                  rows={6}
                  className="mt-2 w-full rounded-lg border border-border-main bg-bg-primary p-3 text-sm text-text-primary resize-y focus:outline-none focus:border-accent placeholder:text-text-secondary/50"
                />
              </div>

              {/* Attached Skills / Files */}
              <div className="mb-4">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="h-3 w-3" />
                  Attached Skills &amp; Files
                </label>

                {/* File list */}
                {agentFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {agentFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-lg border border-border-main bg-bg-primary p-2.5 group"
                      >
                        <FileText className="h-4 w-4 text-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-text-primary hover:text-accent truncate block"
                          >
                            {file.name}
                          </a>
                          <p className="text-[10px] text-text-secondary">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="p-1 rounded hover:bg-red-500/20 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.md,.pdf,.json,.csv,.js,.ts,.py,.html,.css,.yaml,.yml,.xml,.doc,.docx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2 w-full rounded-lg border border-dashed border-border-main bg-bg-primary/50 p-3 text-sm text-text-secondary hover:text-accent hover:border-accent/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Add files (skills, docs, prompts...)
                    </>
                  )}
                </button>
              </div>

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
                Select an agent to edit prompt and attach skills
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
