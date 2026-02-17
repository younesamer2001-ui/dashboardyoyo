"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban, Plus, GitBranch, ExternalLink,
  Clock, ArrowUpRight, Github, Star,
  GitCommit, AlertCircle, CheckCircle2
} from "lucide-react";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
  pushed_at: string;
  language: string;
  default_branch: string;
}

interface RepoStats {
  totalCommits: number;
  thisWeek: number;
  lastPush: string | null;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-500",
  Python: "bg-green-500",
  "Liquid": "bg-purple-500",
  CSS: "bg-pink-500",
  HTML: "bg-orange-500",
  default: "bg-gray-500"
};

export default function ProjectsPage() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [repoStats, setRepoStats] = useState<Record<string, RepoStats>>({});
  const [recentCommits, setRecentCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGitHubData();
    const interval = setInterval(fetchGitHubData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchGitHubData = async () => {
    try {
      setLoading(true);
      
      // Fetch repos
      const reposRes = await fetch("/api/github");
      const reposData = await reposRes.json();
      
      if (reposData.success) {
        setRepos(reposData.repos);
        
        // Fetch stats for each repo
        const stats: Record<string, RepoStats> = {};
        for (const repo of reposData.repos) {
          const statsRes = await fetch("/api/github", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo: repo.name, type: "stats" }),
          });
          const statsData = await statsRes.json();
          if (statsData.success) {
            stats[repo.name] = statsData.stats;
          }
          
          // Fetch recent commits for first repo
          if (repo.name === reposData.repos[0]?.name) {
            const commitsRes = await fetch("/api/github", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ repo: repo.name, type: "commits" }),
            });
            const commitsData = await commitsRes.json();
            if (commitsData.success) {
              setRecentCommits(commitsData.commits.slice(0, 5));
            }
          }
        }
        setRepoStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch GitHub data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    return `${diffDay}d ago`;
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
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <FolderKanban className="w-6 h-6 text-[#5b8aff]" />
            Projects
          </h1>
          <p className="text-[#8a8a9a] text-sm mt-1">Connected to GitHub • {repos.length} repositories</p>
        </div>
        
        <a
          href="https://github.com/new"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium transition-colors text-sm hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
          New Repo
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-medium text-[#8a8a9a] uppercase tracking-wider">Repositories</h2>
          
          <div className="space-y-3">
            {repos.map((repo) => {
              const stats = repoStats[repo.name];
              const langColor = languageColors[repo.language] || languageColors.default;
              
              return (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-5 rounded-xl bg-[#13131f] border border-white/[0.06] hover:border-white/[0.1] hover:bg-[#1c1c28] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Github className="w-5 h-5 text-[#5a5a6a]" />
                        <h3 className="font-semibold text-white group-hover:text-[#5b8aff] transition-colors">
                          {repo.name}
                        </h3>
                        <span className={`w-2 h-2 rounded-full ${langColor}`} />
                        <span className="text-xs text-[#5a5a6a]">{repo.language}</span>
                      </div>
                      
                      <p className="text-sm text-[#8a8a9a] mt-2">{repo.description || "No description"}</p>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#5a5a6a]">
                          <GitCommit className="w-3.5 h-3.5" />
                          {stats?.totalCommits || 0} commits
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-[#5a5a6a]">
                          <Star className="w-3.5 h-3.5" />
                          {repo.stargazers_count}
                        </div>
                        
                        {stats?.thisWeek > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {stats.thisWeek} this week
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1.5 text-xs text-[#5a5a6a]">
                          <Clock className="w-3.5 h-3.5" />
                          {getRelativeTime(repo.pushed_at)}
                        </div>
                      </div>
                    </div>
                    
                    <ExternalLink className="w-4 h-4 text-[#5a5a6a] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>                
                </a>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-[#8a8a9a] uppercase tracking-wider">Recent Activity</h2>
          
          <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-4">
            <div className="space-y-4">
              {recentCommits.map((commit, i) => (
                <div key={commit.sha} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[#5b8aff]" />
                    {i < recentCommits.length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.06] my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm text-white line-clamp-1">{commit.commit.message}</p>
                    <p className="text-xs text-[#5a5a6a] mt-0.5">
                      {commit.commit.author.name} • {getRelativeTime(commit.commit.author.date)}
                    </p>
                  </div>
                </div>
              ))}
              
              {recentCommits.length === 0 && (
                <p className="text-center text-[#5a5a6a] text-sm py-4">No recent activity</p>
              )}
            </div>          
          </div>

          {/* Quick Stats */}
          <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-4">Overview</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8a9a]">Total Repos</span>
                <span className="text-white">{repos.length}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8a9a]">This Week</span>
                <span className="text-emerald-400">
                  {Object.values(repoStats).reduce((acc, s) => acc + (s?.thisWeek || 0), 0)} commits
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8a9a]">Total Stars</span>
                <span className="text-white">
                  {repos.reduce((acc, r) => acc + r.stargazers_count, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
