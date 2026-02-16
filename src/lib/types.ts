export type AgentStatus = "active" | "idle" | "error" | "online" | "offline" | "working";

export interface Agent {
  id: string;
  name: string;
  role: string;
  icon?: string;
  emoji?: string;
  status: AgentStatus;
  health?: number;
  lastActive?: string;
  tasksCompleted?: number;
  tasksToday?: number;
  currentTask?: string | null;
  systemPrompt?: string;
  model?: string;
  evaluationTime?: string;
  metrics?: Record<string, any>;
  updatedAt?: string;
  capabilities?: AgentCapability[];
  tools?: AgentTool[];
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputs: { name: string; type: string; required: boolean }[];
  outputs: { name: string; type: string }[];
}

export interface AgentTool {
  name: string;
  type: "http" | "git" | "email" | "command" | "generate";
  config: Record<string, string>;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  taskId: string;
  capability: string;
  input: Record<string, any>;
  status: "queued" | "running" | "success" | "failed";
  output?: Record<string, any>;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface FeedItem {
  id: string;
  agentId?: string;
  agentName: string;
  agentEmoji: string;
  type: "task" | "message" | "evaluation" | "error" | "system" | "success" | "info" | "warning" | "alert" | "memory" | "scout";
  content: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  text?: string;
  timestamp: string;
  agentName?: string;
  agentIcon?: string;
  sender?: string;
}

export interface DashboardStats {
  totalTasks: number;
  tasksToday: number;
  activeAgents: number;
  uptime: number;
  messagesTotal: number;
  evolutionScore: number;
  tasksCompleted?: number;
  messagesExchanged?: number;
  systemHealth?: 'healthy' | 'warning' | 'critical';
}

export interface BrainEntry {
  id: string;
  category: string;
  content: string;
  addedBy: string;
  timestamp: string;
  tags: string[];
}

// ==========================================
// SECOND BRAIN TYPES
// ==========================================

// Memory Pillar
export interface MemoryFact {
  id: string;
  entity: string;
  predicate: string;
  object: string;
  source: "chat" | "user_input" | "system" | "extraction";
  confidence: number;
  extractedAt: string;
  lastMentioned: string;
}

export interface MemoryEntity {
  id: string;
  type: "person" | "project" | "company" | "tool" | "concept" | "preference";
  name: string;
  description?: string;
  properties: Record<string, string>;
  mentionCount: number;
  lastMentioned: string;
}

export interface MemoryPreference {
  id: string;
  category: "communication" | "ui" | "workflow" | "style";
  key: string;
  value: string;
  confidence: number;
  learnedAt: string;
  corrections: number;
}

export interface MemoryRelationship {
  id: string;
  from: string;
  type: "related_to" | "uses" | "manages" | "collaborates_with" | "part_of";
  to: string;
  context?: string;
}

export interface Memory {
  facts: MemoryFact[];
  entities: MemoryEntity[];
  preferences: MemoryPreference[];
  relationships: MemoryRelationship[];
}

// Scout Pillar
export interface ScoutMonitor {
  id: string;
  type: "github" | "web" | "rss";
  name: string;
  config: {
    repo?: string;
    url?: string;
    selector?: string;
    checkInterval?: number;
    lastCheck?: string;
    lastHash?: string;
  };
  enabled: boolean;
  createdAt: string;
}

export interface ScoutAlert {
  id: string;
  monitorId: string;
  monitorName: string;
  type: "change" | "new_issue" | "new_pr" | "new_commit" | "event";
  title: string;
  description: string;
  data: Record<string, any>;
  sentAt: string;
  read: boolean;
}

export interface Scouts {
  monitors: ScoutMonitor[];
  alerts: ScoutAlert[];
}

// Full data model
export interface DashboardData {
  dashboard: {
    title: string;
    subtitle: string;
    navItems: {
      id: string;
      href: string;
      label: string;
      icon: string;
      order: number;
      protected?: boolean;
    }[];
  };
  feed: FeedItem[];
  chat: {
    messages: any[];
    lastUpdate: string;
  };
  agents: Agent[];
  stats: {
    uptime: number;
    lastReset: string;
  };
  memory: Memory;
  scouts: Scouts;
  agent_executions: AgentExecution[];
}
