import { NextRequest } from 'next/server';

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

interface GitHubPR {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

// Mock data for demo (until GitHub token is added)
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
  {
    id: 2,
    name: "siha-shopify",
    full_name: "younesamer2001-ui/siha-shopify",
    description: "E-commerce platform for Siha",
    html_url: "https://github.com/younesamer2001-ui/siha-shopify",
    stargazers_count: 3,
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    pushed_at: new Date(Date.now() - 86400000).toISOString(),
    language: "Liquid",
    default_branch: "main"
  },
  {
    id: 3,
    name: "x-agent",
    full_name: "younesamer2001-ui/x-agent",
    description: "Automated X/Twitter posting system",
    html_url: "https://github.com/younesamer2001-ui/x-agent",
    stargazers_count: 8,
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    pushed_at: new Date(Date.now() - 172800000).toISOString(),
    language: "JavaScript",
    default_branch: "main"
  }
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
      author: { login: "younesamer2001-ui", avatar_url: "" }
    },
    {
      sha: "def456",
      commit: {
        message: "Redesign to Linear-style theme",
        author: { name: "Younes", date: new Date(Date.now() - 3600000).toISOString() }
      },
      html_url: "https://github.com/younesamer2001-ui/dashboardyoyo/commit/def456",
      author: { login: "younesamer2001-ui", avatar_url: "" }
    }
  ],
  "siha-shopify": [
    {
      sha: "ghi789",
      commit: {
        message: "Update product page layout",
        author: { name: "Younes", date: new Date(Date.now() - 86400000).toISOString() }
      },
      html_url: "https://github.com/younesamer2001-ui/siha-shopify/commit/ghi789",
      author: { login: "younesamer2001-ui", avatar_url: "" }
    }
  ],
  "x-agent": [
    {
      sha: "jkl012",
      commit: {
        message: "Fix API rate limiting",
        author: { name: "Younes", date: new Date(Date.now() - 172800000).toISOString() }
      },
      html_url: "https://github.com/younesamer2001-ui/x-agent/commit/jkl012",
      author: { login: "younesamer2001-ui", avatar_url: "" }
    }
  ]
};

// GET /api/github/repos - Get user's repos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner') || 'younesamer2001-ui';
    
    // In production, this would call GitHub API with token
    // For now, return mock data
    
    return Response.json({
      success: true,
      repos: mockRepos,
    });
  } catch (error) {
    console.error('GitHub API error:', error);
    return Response.json({ success: false, error: 'Failed to fetch repos' }, { status: 500 });
  }
}

// GET commits for a repo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, type } = body;
    
    if (type === 'commits') {
      const commits = mockCommits[repo] || [];
      return Response.json({ success: true, commits });
    }
    
    if (type === 'stats') {
      const commits = mockCommits[repo] || [];
      return Response.json({
        success: true,
        stats: {
          totalCommits: commits.length + Math.floor(Math.random() * 50),
          thisWeek: commits.filter(c => 
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
