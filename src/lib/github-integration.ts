// GitHub API integration for automatic code implementation
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "younesamer2001-ui";
const REPO_NAME = "dashboardyoyo";

interface GitFile {
  path: string;
  content: string;
}

interface ImplementationTask {
  id: string;
  title: string;
  description: string;
  files: GitFile[];
  branchName: string;
}

// Create a new branch for the implementation
export async function createBranch(branchName: string, baseBranch = "main"): Promise<boolean> {
  try {
    // Get the SHA of the latest commit on base branch
    const baseResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${baseBranch}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!baseResponse.ok) throw new Error("Failed to get base branch");
    const baseData = await baseResponse.json();
    const baseSha = baseData.object.sha;

    // Create new branch
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Create branch error:", error);
    return false;
  }
}

// Get file content and SHA
export async function getFile(path: string, branch = "main"): Promise<{ content: string; sha: string } | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return {
      content: atob(data.content),
      sha: data.sha,
    };
  } catch (error) {
    console.error("Get file error:", error);
    return null;
  }
}

// Create or update a file
export async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
): Promise<boolean> {
  try {
    const body: any = {
      message,
      content: btoa(content),
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Create/update file error:", error);
    return false;
  }
}

// Create a pull request
export async function createPullRequest(
  title: string,
  body: string,
  head: string,
  base = "main"
): Promise<{ number: number; html_url: string } | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
          head,
          base,
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to create PR");
    return await response.json();
  } catch (error) {
    console.error("Create PR error:", error);
    return null;
  }
}

// Merge a pull request
export async function mergePullRequest(prNumber: number): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}/merge`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merge_method: "squash",
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Merge PR error:", error);
    return false;
  }
}

// Generate implementation code based on recommendation
export function generateImplementationCode(recommendation: any): ImplementationTask {
  const timestamp = Date.now();
  const branchName = `expert-review-${timestamp}`;
  
  const files: GitFile[] = [];
  
  // Generate code based on finding type
  switch (recommendation.id) {
    case "ui-1": // Loading skeletons
      files.push({
        path: "src/components/ui/Skeleton.tsx",
        content: generateSkeletonComponent(),
      });
      break;
      
    case "content-1": // Tooltips
      files.push({
        path: "src/components/ui/Tooltip.tsx",
        content: generateTooltipComponent(),
      });
      break;
      
    case "int-1": // API fallback
      files.push({
        path: "src/lib/api-fallback.ts",
        content: generateApiFallback(),
      });
      break;
      
    default:
      // Generic improvement
      files.push({
        path: `src/improvements/${recommendation.id}.ts`,
        content: generateGenericImprovement(recommendation),
      });
  }
  
  return {
    id: `task-${timestamp}`,
    title: recommendation.title,
    description: recommendation.description,
    files,
    branchName,
  };
}

// Component generators
function generateSkeletonComponent(): string {
  return `export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={\`animate-pulse bg-white/[0.04] rounded-lg \${className}\`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-[#13131f] border border-white/[0.06] space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
`;
}

function generateTooltipComponent(): string {
  return `import { useState } from "react";

export function Tooltip({ 
  children, 
  content 
}: { 
  children: React.ReactNode; 
  content: string;
}) {
  const [show, setShow] = useState(false);
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a24] text-white text-sm rounded-lg border border-white/[0.08] whitespace-nowrap z-50">
          {content}
        </div>
      )}
    </div>
  );
}
`;
}

function generateApiFallback(): string {
  return `// API fallback with caching
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: any;
  timestamp: number;
}

const cache: Record<string, CachedData> = {};

export async function fetchWithFallback(
  url: string,
  options?: RequestInit
): Promise<any> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    
    // Cache successful response
    cache[url] = {
      data,
      timestamp: Date.now(),
    };
    
    return data;
  } catch (error) {
    // Return cached data if available
    const cached = cache[url];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.warn("Using cached data due to API error");
      return {
        ...cached.data,
        _cached: true,
        _cachedAt: cached.timestamp,
      };
    }
    
    throw error;
  }
}

export function isCachedData(data: any): boolean {
  return data?._cached === true;
}
`;
}

function generateGenericImprovement(recommendation: any): string {
  return `// Implementation: \${recommendation.title}
// Generated by Expert Review Team

export function implement() {
  console.log("Implementing: \${recommendation.title}");
  // TODO: Implement \${recommendation.recommendation}
}

export default implement;
`;
}
