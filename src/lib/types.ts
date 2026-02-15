export type AgentStatus = "online" | "idle" | "offline" | "working";

export interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  status: AgentStatus;
  health: number; // 0-100
  lastActive: string;
  tasksCompleted: number;
  tasksToday: number;
  systemPrompt: string;
  model: string;
  evaluationTime?: string;
}

export interface FeedItem {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  type: "task" | "message" | "evaluation" | "error" | "system";
  content: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  agentName?: string;
}

export interface DashboardStats {
  totalTasks: number;
  tasksToday: number;
  activeAgents: number;
  uptime: number; // percentage
  messagesTotal: number;
  evolutionScore: number; // 0-100
}

export interface BrainEntry {
  id: string;
  category: string;
  content: string;
  addedBy: string;
  timestamp: string;
  tags: string[];
}
