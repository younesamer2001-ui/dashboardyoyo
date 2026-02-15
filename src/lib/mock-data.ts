import { Agent, FeedItem, DashboardStats, BrainEntry, ChatMessage } from "./types";

export const agents: Agent[] = [
  {
    id: "kimi",
    name: "Kimi",
    role: "CEO / Coach",
    emoji: "\u{1F9E0}",
    status: "online",
    health: 98,
    lastActive: new Date().toISOString(),
    tasksCompleted: 1247,
    tasksToday: 14,
    systemPrompt: "You are Kimi, the CEO and Coach of Younes AI Co. You evaluate performance daily at 21:00, provide strategic guidance, and coordinate the agent team.",
    model: "claude-sonnet-4-5-20250929",
    evaluationTime: "21:00",
  },
  {
    id: "content-creator",
    name: "Content Creator",
    role: "X/Twitter Content",
    emoji: "\u270D\uFE0F",
    status: "idle",
    health: 85,
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    tasksCompleted: 523,
    tasksToday: 3,
    systemPrompt: "You are the Content Creator agent. You generate engaging social media content for X/Twitter, focusing on AI, tech, and entrepreneurship topics.",
    model: "claude-sonnet-4-5-20250929",
  },
];

export const feedItems: FeedItem[] = [
  {
    id: "1",
    agentId: "kimi",
    agentName: "Kimi",
    agentEmoji: "\u{1F9E0}",
    type: "evaluation",
    content: "Daily evaluation complete. Team performance: 92/100. Content output increased by 15% this week.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "2",
    agentId: "content-creator",
    agentName: "Content Creator",
    agentEmoji: "\u270D\uFE0F",
    type: "task",
    content: "Published 3 posts to X/Twitter. Top performing: 'The future of AI agents...' -- 2.4k impressions.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    agentId: "kimi",
    agentName: "Kimi",
    agentEmoji: "\u{1F9E0}",
    type: "message",
    content: "Younes, I've prepared the weekly report. Revenue pipeline looks strong. Check the brain for details.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "4",
    agentId: "kimi",
    agentName: "Kimi",
    agentEmoji: "\u{1F9E0}",
    type: "system",
    content: "Agent system restarted. All agents online and healthy.",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
];

export const dashboardStats: DashboardStats = {
  totalTasks: 1770,
  tasksToday: 17,
  activeAgents: 2,
  uptime: 99.7,
  messagesTotal: 8432,
  evolutionScore: 87,
};

export const brainEntries: BrainEntry[] = [
  {
    id: "1",
    category: "Strategy",
    content: "Focus on building MRR through AI automation services. Target: 50k NOK/month by Q3.",
    addedBy: "Kimi",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    tags: ["revenue", "strategy", "goals"],
  },
  {
    id: "2",
    category: "Content",
    content: "Best performing content themes: AI agent workflows, personal branding, building in public.",
    addedBy: "Content Creator",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    tags: ["content", "analytics", "social"],
  },
  {
    id: "3",
    category: "Technical",
    content: "Telegram bot integration working. Next: add webhook support for real-time dashboard updates.",
    addedBy: "Kimi",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    tags: ["technical", "integration", "telegram"],
  },
];

export const chatHistory: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Good morning, Younes! I've completed the daily review. All systems are running smoothly. Want me to walk you through today's priorities?",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    agentName: "Kimi",
  },
  {
    id: "2",
    role: "user",
    content: "Yes, what's on the agenda?",
    timestamp: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: "3",
    role: "assistant",
    content: "Here's your day:\n\n1. Review Content Creator's draft posts for X\n2. Check the weekly analytics report in Brain\n3. Approve the new system prompt for the Sales agent\n\nShall I prioritize any of these?",
    timestamp: new Date(Date.now() - 3400000).toISOString(),
    agentName: "Kimi",
  },
];

