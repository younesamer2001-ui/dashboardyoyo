"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";
import AgentCard from "@/components/dashboard/AgentCard";
import { agents } from "@/lib/mock-data";
import { Agent } from "@/lib/types";

export default function AgentsPage() {
  const [selected, setSelected] = useState<Agent | null>(null);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-accent" />
          Agenter
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Administrer AI-agentene dine. Klikk pÃ¥ en agent for detaljer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent cards */}
        <div className="space-y-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => setSelected(agent)}
            />
          ))}
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <div className="rounded-xl border border-border-main bg-bg-card p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selected.emoji}</span>
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

              {/* System prompt */}
              <div className="mb-4">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  System Prompt
                </label>
                <textarea
                  defaultValue={selected.systemPrompt}
                  rows={5}
                  className="mt-2 w-full rounded-lg border border-border-main bg-bg-primary p-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent"
                />
              </div>

              {/* Model */}
              <div className="mb-4">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Model
                </label>
                <p className="mt-1 text-sm font-mono text-accent-light">{selected.model}</p>
              </div>

              {/* Evaluation time */}
              {selected.evaluationTime && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Daglig evaluering
                  </label>
                  <p className="mt-1 text-sm">{selected.evaluationTime}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button className="flex-1 rounded-lg bg-accent/15 text-accent py-2 text-sm font-medium hover:bg-accent/25 transition-colors">
                  Lagre endringer
                </button>
                <button className="rounded-lg border border-border-main px-4 py-2 text-sm text-text-secondary hover:bg-bg-card-hover transition-colors">
                  Restart
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border-main border-dashed bg-bg-card/50 p-12 flex flex-col items-center justify-center text-center">
              <Users className="h-10 w-10 text-text-secondary/40 mb-3" />
              <p className="text-sm text-text-secondary">
                Velg en agent for Ã¥ se detaljer og redigere prompt
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
