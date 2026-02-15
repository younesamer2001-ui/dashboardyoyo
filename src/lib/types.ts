export type AgentStatus = "active" | "idle" | "error" | "online" | "offline" | "working";

export interface Agent {
  id: string;
  name: string;
  role: string;
  icon?: string;
  emoji?: string;
  status: AgentStatus;
  health?: number; // 0-100
  lastActive?: string;
  tasksCompleted?: number;
  tasksToday?: number;
  currentTask?: string | null;
  systemPrompt?: string;
  model?: string;
  evaluationTime?: string;
  metrics?: Record<string, any>;
  updatedAt?: string;
}

export interface FeedItem {
  id: string;
  agentId?: string;
  agentName: string;
  agentEmoji: string;
  type: "task" | "message" | "evaluation" | "error" | "system" | "success" | "info" | "warning";
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
  uptime: number; // percentage
  messagesTotal: number;
  evolutionScore: number; // 0-100
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
