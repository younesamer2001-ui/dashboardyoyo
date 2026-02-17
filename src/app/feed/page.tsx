"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Activity, GitCommit, GitPullRequest, GitBranch, 
  Rocket, AlertCircle, CheckCircle2, Clock, RefreshCw,
  Github, Server, MessageSquare, Zap
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'commit' | 'deploy' | 'pr' | 'issue' | 'task' | 'chat';
  title: string;
  message: string;
  timestamp: string;
  repo?: string;
  url?: string;
  status?: 'success' | 'pending' | 'error';
}

const activityIcons = {
  commit: GitCommit,
  deploy: Rocket,
  pr: GitPullRequest,
  issue: AlertCircle,
  task: CheckCircle2,
  chat: MessageSquare,
};

const activityColors = {
  commit: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  deploy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pr: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  issue: "text-red-400 bg-red-500/10 border-red-500/20",
  task: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  chat: "text-[#5b8aff] bg-[#5b8aff]/10 border-[#5b8aff]/20",
};

// Generate mock activities for demo
function generateMockActivities(): ActivityItem[] {
  const now = Date.now();
  return [
    {
      id: "1",
      type: "commit",
      title: "Dashboard YOYO",
      message: "Add GitHub Integration with live API",
      timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
      repo: "dashboardyoyo",
      url: "https://github.com/younesamer2001-ui/dashboardyoyo/commit/abc123",
    },
    {
      id: "2",
      type: "deploy",
      title: "Production Deploy",
      message: "Successfully deployed to Vercel",
      timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
      status: "success",
    },
    {
      id: "3",
      type: "task",
      title: "Task Updated",
      message: "File Browser marked as completed",
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      type: "commit",
      title: "Dashboard YOYO",
      message: "Redesign to Linear-style theme",
      timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
      repo: "dashboardyoyo",
      url: "https://github.com/younesamer2001-ui/dashboardyoyo/commit/def456",
    },
    {
      id: "5",
      type: "pr",
      title: "Siha Shopify",
      message: "New PR: Update product page layout",
      timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
      repo: "siha-shopify",
      url: "https://github.com/younesamer2001-ui/siha-shopify/pull/5",
    },
    {
      id: "6",
      type: "chat",
      title: "Kimi",
      message: "Completed: Build File Browser component",
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin === 1) return "1m ago";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour === 1) return "1h ago";
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

export default function FeedPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ActivityItem['type']>('all');
  const [isLive, setIsLive] = useState(true);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);

  const fetchActivities = async () => {
    try {
      // In production, this would fetch from API
      // For now, use mock data
      const mockData = generateMockActivities();
      
      // Check for new activities
      const currentIds = new Set(activities.map(a => a.id));
      const newActivities = mockData.filter(a => !currentIds.has(a.id));
      
      if (newActivities.length > 0 && activities.length > 0) {
        setNewActivityCount(prev => prev + newActivities.length);
      }
      
      setActivities(mockData);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    if (isLive) {
      const interval = setInterval(fetchActivities, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [isLive]);

  // Fetch real GitHub activity
  useEffect(() => {
    const fetchGitHubActivity = async () => {
      try {
        // Get recent commits from dashboardyoyo
        const commitsRes = await fetch('/api/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo: 'dashboardyoyo', type: 'commits' }),
        });
        
        if (commitsRes.ok) {
          const data = await commitsRes.json();
          if (data.commits) {
            const githubActivities: ActivityItem[] = data.commits.slice(0, 3).map((commit: any, i: number) => ({
              id: `github-${commit.sha}`,
              type: 'commit' as const,
              title: 'Dashboard YOYO',
              message: commit.commit.message.split('\n')[0],
              timestamp: commit.commit.author.date,
              repo: 'dashboardyoyo',
              url: commit.html_url,
            }));
            
            // Merge with existing activities
            setActivities(prev => {
              const existingIds = new Set(prev.map(a => a.id));
              const newItems = githubActivities.filter(a => !existingIds.has(a.id));
              return [...newItems, ...prev].slice(0, 20);
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch GitHub activity:', error);
      }
    };

    fetchGitHubActivity();
  }, []);

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  const handleNewActivities = () => {
    setNewActivityCount(0);
    fetchActivities();
    feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#5b8aff]" />
            Activity Feed
          </h1>
          <p className="text-[#8a8a9a] text-sm mt-1">Real-time updates from GitHub, tasks, and more</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Live toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isLive 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-white/[0.04] text-[#8a8a9a] border border-white/[0.06]"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            {isLive ? 'Live' : 'Paused'}
          </button>
          
          <button
            onClick={() => fetchActivities()}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8a8a9a] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Activity Banner */}
      {newActivityCount > 0 && (
        <button
          onClick={handleNewActivities}
          className="w-full py-3 bg-[#5b8aff]/10 border border-[#5b8aff]/20 rounded-xl text-[#5b8aff] font-medium text-sm hover:bg-[#5b8aff]/20 transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {newActivityCount} new {newActivityCount === 1 ? 'activity' : 'activities'}
        </button>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All', count: activities.length },
          { key: 'commit', label: 'Commits', count: activities.filter(a => a.type === 'commit').length },
          { key: 'deploy', label: 'Deploys', count: activities.filter(a => a.type === 'deploy').length },
          { key: 'task', label: 'Tasks', count: activities.filter(a => a.type === 'task').length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-white/[0.08] text-white border border-white/[0.1]"
                : "bg-white/[0.02] text-[#8a8a9a] border border-white/[0.04] hover:bg-white/[0.04]"
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-[#5a5a6a]">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <div ref={feedRef} className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-[#5a5a6a]" />
            </div>
            <p className="text-[#8a8a9a]">No recent activity</p>
          </div>
        ) : (
          filteredActivities.map((activity, i) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];
            
            return (
              <div
                key={activity.id}
                className="flex gap-4 p-4 rounded-xl bg-[#13131f] border border-white/[0.06] hover:border-white/[0.1] transition-all group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{activity.title}</p>
                    {activity.repo && (
                      <span className="text-xs text-[#5a5a6a]">{activity.repo}</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-[#8a8a9a] mt-0.5 line-clamp-2">{activity.message}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-[#5a5a6a]">{getRelativeTime(activity.timestamp)}</span>
                    
                    {activity.url && (
                      <a
                        href={activity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#5b8aff] hover:text-[#7ca4ff] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View
                        <Github className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                
                {/* Status indicator */}
                {activity.status && (
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-emerald-500' :
                    activity.status === 'error' ? 'bg-red-500' :
                    'bg-amber-500'
                  }`} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/[0.06]">
        {[
          { label: "Today", value: activities.filter(a => new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length },
          { label: "This Week", value: activities.filter(a => new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length },
          { label: "Commits", value: activities.filter(a => a.type === 'commit').length },
          { label: "Deploys", value: activities.filter(a => a.type === 'deploy').length },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs text-[#5a5a6a]">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
