"use client";

import { Activity } from "lucide-react";
import FeedList from "@/components/dashboard/FeedList";

export default function FeedPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-accent" />
          Live Feed
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Real-time activity from all agents.
        </p>
      </div>

      <FeedList />
    </div>
  );
}
