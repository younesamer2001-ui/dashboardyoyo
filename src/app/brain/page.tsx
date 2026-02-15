"use client";

import { Brain, Plus, Tag, Search } from "lucide-react";
import { brainEntries } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";
import { useState } from "react";

export default function BrainPage() {
  const [search, setSearch] = useState("");

  const filtered = brainEntries.filter(
    (e) =>
      e.content.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            Shared Brain
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Shared knowledge and memory for the entire agent team. QMD-based.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-accent/15 text-accent px-4 py-2 text-sm font-medium hover:bg-accent/25 transition-colors">
          <Plus className="h-4 w-4" />
          New Entry
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <input
          type="text"
          placeholder="Search the brain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border-main bg-bg-card pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
        />
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {filtered.map((entry, index) => (
          <div
            key={entry.id}
            className="fade-in rounded-xl border border-border-main bg-bg-card p-5 hover:bg-bg-card-hover transition-colors"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center rounded-md bg-accent/10 text-accent px-2.5 py-0.5 text-xs font-medium">
                {entry.category}
              </span>
              <span className="text-[11px] text-text-secondary">
                {entry.addedBy} - {timeAgo(entry.timestamp)}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-text-primary">
              {entry.content}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Tag className="h-3 w-3 text-text-secondary" />
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] text-text-secondary bg-bg-primary px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary text-sm">
            No results found for &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
