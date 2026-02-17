import { NextRequest } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_API_BASE = 'https://api.github.com';

// Helper to fetch from GitHub API
async function fetchGitHub(endpoint: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  
  const res = await fetch(`${GITHUB_API_BASE}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

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

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
  author?: {
    login: string;
    avatar_url: string;
  };
}

// Mock data fallback
const mockRepos = [
  {
    id: 1,
    name: "dashboardyoyo",
    full_name: "younesamer2001-ui/dashboardyoyo",
    description: "AI Command Center for agent management",
    html_url: "https://github.com/younesamer2001-ui/dashboardyoyo",
    stargazers_count: 5,
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    language: "TypeScript",
    default_branch: "main"
  },
];

const mockCommits: Record<string, GitHubCommit[]> = {
  "dashboardyoyo": [
    {
      sha: "abc123",
      commit: {
        message: "Add File Browser component",
        author: { name: "Younes", date: new Date().toISOString() }
      },
      html_url: "https://github.com/younesamer2001-ui/dashboardyoyo/commit/abc123",
    }
  ],
};

// GET /api/github/repos - Get user's repos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner') || 'younesamer2001-ui';
    
    // If token exists, fetch from real GitHub API
    if (GITHUB_TOKEN) {
      try {
        const repos = await fetchGitHub(`/users/${owner}/repos?sort=updated&per_page=10`);
        return Response.json({
          success: true,
          repos: repos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            html_url: repo.html_url,
            stargazers_count: repo.stargazers_count,
            updated_at: repo.updated_at,
            pushed_at: repo.pushed_at,
            language: repo.language,
            default_branch: repo.default_branch,
          })),
        });
      } catch (apiError) {
        console.error('GitHub API error, falling back to mock:', apiError);
      }
    }
    
    // Fallback to mock data
    return Response.json({
      success: true,
      repos: mockRepos,
    });
  } catch (error) {
    console.error('GitHub API error:', error);
    return Response.json({ success: false, error: 'Failed to fetch repos' }, { status: 500 });
  }
}

// POST - Get commits or stats for a repo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, type, owner = 'younesamer2001-ui' } = body;
    
    if (type === 'commits') {
      // If token exists, fetch real commits
      if (GITHUB_TOKEN) {
        try {
          const commits = await fetchGitHub(`/repos/${owner}/${repo}/commits?per_page=10`);
          return Response.json({ 
            success: true, 
            commits: commits.map((c: any) => ({
              sha: c.sha,
              commit: {
                message: c.commit.message,
                author: {
                  name: c.commit.author.name,
                  date: c.commit.author.date,
                },
              },
              html_url: c.html_url,
              author: c.author ? {
                login: c.author.login,
                avatar_url: c.author.avatar_url,
              } : undefined,
            }))
          });
        } catch (apiError) {
          console.error('GitHub commits API error:', apiError);
        }
      }
      
      const commits = mockCommits[repo] || [];
      return Response.json({ success: true, commits });
    }
    
    if (type === 'stats') {
      // If token exists, fetch real stats
      if (GITHUB_TOKEN) {
        try {
          const commits = await fetchGitHub(`/repos/${owner}/${repo}/commits?per_page=100`);
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          
          return Response.json({
            success: true,
            stats: {
              totalCommits: commits.length,
              thisWeek: commits.filter((c: any) => 
                new Date(c.commit.author.date) > oneWeekAgo
              ).length,
              lastPush: commits[0]?.commit.author.date || null,
            }
          });
        } catch (apiError) {
          console.error('GitHub stats API error:', apiError);
        }
      }
      
      const commits = mockCommits[repo] || [];
      return Response.json({
        success: true,
        stats: {
          totalCommits: commits.length,
          thisWeek: commits.filter((c: any) => 
            new Date(c.commit.author.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
          lastPush: commits[0]?.commit.author.date || null,
        }
      });
    }
    
    return Response.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('GitHub API error:', error);
    return Response.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}
