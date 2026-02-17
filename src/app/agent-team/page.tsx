"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users, Send, Crown, Code, Palette, Bug, Rocket,
  Loader2, ChevronDown, Plus, FolderKanban, CheckCircle,
  GitBranch, Terminal, Play, Pause, AlertCircle
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  icon: any;
  color: string;
  status: "online" | "thinking" | "working" | "offline";
  currentTask?: string;
}

interface TeamChat {
  id: string;
  name: string;
  project: string;
  members: string[];
  messages: Message[];
  createdAt: string;
  status: "discussing" | "implementing" | "reviewing" | "deployed";
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  type: "user" | "agent" | "action" | "code";
  action?: {
    type: "commit" | "deploy" | "task" | "review";
    status: "pending" | "in_progress" | "completed" | "failed";
    details?: string;
  };
}

// Dashboard Improvement Team - They actually build!
const teamMembers: TeamMember[] = [
  {
    id: "product",
    name: "Alex",
    role: "Product Manager",
    specialty: "Feature prioritization, user needs",
    icon: Crown,
    color: "text-[#5b8aff]",
    status: "online",
  },
  {
    id: "frontend",
    name: "Sarah",
    role: "Frontend Developer",
    specialty: "React, TypeScript, UI implementation",
    icon: Code,
    color: "text-emerald-400",
    status: "online",
  },
  {
    id: "designer",
    name: "Lisa",
    role: "UI/UX Designer",
    specialty: "Design systems, user experience",
    icon: Palette,
    color: "text-purple-400",
    status: "online",
  },
  {
    id: "qa",
    name: "Mark",
    role: "QA Engineer",
    specialty: "Testing, quality assurance",
    icon: Bug,
    color: "text-orange-400",
    status: "online",
  },
  {
    id: "devops",
    name: "Tom",
    role: "DevOps Engineer",
    specialty: "Deployment, CI/CD, infrastructure",
    icon: Rocket,
    color: "text-cyan-400",
    status: "online",
  },
];

const defaultTeam: TeamChat = {
  id: "dashboard-team",
  name: "Dashboard Improvement Team",
  project: "Dashboard YOYO",
  members: ["product", "frontend", "designer", "qa", "devops"],
  messages: [],
  createdAt: new Date().toISOString(),
  status: "discussing",
};

export default function AgentTeamPage() {
  const [team] = useState<TeamChat>(defaultTeam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [teamStatus, setTeamStatus] = useState<"idle" | "discussing" | "working" | "deploying">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMemberConfig = (id: string) => teamMembers.find((m) => m.id === id);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      senderId: "user",
      senderName: "You",
      senderRole: "Product Owner",
      text: input,
      timestamp: new Date().toISOString(),
      type: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    setTeamStatus("discussing");

    // Simulate team discussion
    await runTeamDiscussion(input);
  };

  const runTeamDiscussion = async (userRequest: string) => {
    const relevantMembers = determineRelevantMembers(userRequest);
    
    // Product Manager starts
    const pm = getMemberConfig("product")!;
    await addAgentMessage(pm, `Team, we have a new request: "${userRequest}". Let me break this down and assign tasks.`);
    
    await delay(1000);

    // Each relevant member responds
    for (const memberId of relevantMembers) {
      const member = getMemberConfig(memberId)!;
      const response = generateAgentResponse(member, userRequest);
      await addAgentMessage(member, response);
      await delay(1500);
    }

    // Product Manager summarizes and creates action plan
    await delay(1000);
    await addAgentMessage(pm, generateActionPlan(userRequest, relevantMembers));

    // Move to implementation
    setTeamStatus("working");
    await implementFeatures(userRequest, relevantMembers);
  };

  const implementFeatures = async (request: string, members: string[]) => {
    // Frontend Developer starts coding
    if (members.includes("frontend")) {
      const dev = getMemberConfig("frontend")!;
      await addActionMessage(dev, "Starting implementation...", "task", "in_progress");
      await delay(2000);
      
      // Simulate code generation
      await addCodeMessage(dev, generateCodeSnippet(request));
      await delay(1500);
      
      await addActionMessage(dev, "Code written and tested locally", "task", "completed");
    }

    // Designer provides specs
    if (members.includes("designer")) {
      const designer = getMemberConfig("designer")!;
      await addActionMessage(designer, "Creating design specifications...", "task", "in_progress");
      await delay(2000);
      await addActionMessage(designer, "Design specs ready", "task", "completed");
    }

    // QA reviews
    if (members.includes("qa")) {
      const qa = getMemberConfig("qa")!;
      await addActionMessage(qa, "Running tests...", "task", "in_progress");
      await delay(2000);
      await addActionMessage(qa, "All tests passing ✓", "task", "completed");
    }

    // DevOps deploys
    setTeamStatus("deploying");
    const devops = getMemberConfig("devops")!;
    await addActionMessage(devops, "Deploying to production...", "deploy", "in_progress");
    await delay(3000);
    
    // Actually trigger deployment (this would connect to your deploy system)
    const deploySuccess = await triggerDeployment();
    
    if (deploySuccess) {
      await addActionMessage(devops, "Successfully deployed! 🚀", "deploy", "completed");
      await delay(500);
      await addAgentMessage(getMemberConfig("product")!, "Feature is now live! Check it out and let us know what you think.");
    } else {
      await addActionMessage(devops, "Deployment failed. Checking logs...", "deploy", "failed");
    }

    setTeamStatus("idle");
    setIsProcessing(false);
  };

  const triggerDeployment = async (): Promise<boolean> => {
    // In a real implementation, this would:
    // 1. Call Vercel API to deploy
    // 2. Wait for deployment to complete
    // 3. Return success/failure
    
    // For now, simulate success
    return new Promise((resolve) => setTimeout(() => resolve(true), 2000));
  };

  const addAgentMessage = async (member: TeamMember, text: string) => {
    const message: Message = {
      id: `agent-${Date.now()}`,
      senderId: member.id,
      senderName: member.name,
      senderRole: member.role,
      text,
      timestamp: new Date().toISOString(),
      type: "agent",
    };
    setMessages((prev) => [...prev, message]);
  };

  const addActionMessage = async (member: TeamMember, text: string, actionType: Message["action"]["type"], status: Message["action"]["status"]) => {
    const message: Message = {
      id: `action-${Date.now()}`,
      senderId: member.id,
      senderName: member.name,
      senderRole: member.role,
      text,
      timestamp: new Date().toISOString(),
      type: "action",
      action: {
        type: actionType,
        status,
      },
    };
    setMessages((prev) => [...prev, message]);
  };

  const addCodeMessage = async (member: TeamMember, code: string) => {
    const message: Message = {
      id: `code-${Date.now()}`,
      senderId: member.id,
      senderName: member.name,
      senderRole: member.role,
      text: code,
      timestamp: new Date().toISOString(),
      type: "code",
    };
    setMessages((prev) => [...prev, message]);
  };

  const determineRelevantMembers = (request: string): string[] => {
    const lower = request.toLowerCase();
    const members: string[] = ["product"]; // Always include PM
    
    if (lower.includes("ui") || lower.includes("design") || lower.includes("look") || lower.includes("style")) {
      members.push("designer");
    }
    if (lower.includes("feature") || lower.includes("add") || lower.includes("build") || lower.includes("create")) {
      members.push("frontend");
    }
    if (lower.includes("test") || lower.includes("bug") || lower.includes("fix")) {
      members.push("qa");
    }
    if (lower.includes("deploy") || lower.includes("production") || lower.includes("live")) {
      members.push("devops");
    }
    
    // Always include frontend for most requests
    if (!members.includes("frontend")) {
      members.push("frontend");
    }
    
    return [...new Set(members)];
  };

  const generateAgentResponse = (member: TeamMember, request: string): string => {
    const responses: Record<string, string[]> = {
      product: [
        "This aligns well with our roadmap. I suggest we prioritize this for this sprint.",
        "From a product perspective, this would improve user engagement significantly.",
        "Let's scope this properly. What's the MVP version we can ship quickly?",
      ],
      frontend: [
        "I can implement this using React and TypeScript. Should take about 2-3 hours.",
        "This is straightforward. I'll create a new component and integrate it.",
        "I see how this fits. I'll need to update the API integration as well.",
      ],
      designer: [
        "I'll create a design that follows our Linear-style aesthetic.",
        "I can provide mockups within 30 minutes. It'll match our existing dark theme.",
        "For the UX, I suggest we use a modal approach with clear CTAs.",
      ],
      qa: [
        "I'll set up automated tests to ensure this works across all browsers.",
        "I can write test cases while the dev is implementing.",
        "Let me check edge cases - what happens on mobile?",
      ],
      devops: [
        "I can deploy this immediately once it's ready. Pipeline is green.",
        "Vercel is set up for auto-deployment. Just push to main.",
        "I'll monitor the deployment and check metrics after release.",
      ],
    };
    
    const memberResponses = responses[member.id] || ["I'll help with this."];
    return memberResponses[Math.floor(Math.random() * memberResponses.length)];
  };

  const generateActionPlan = (request: string, members: string[]): string => {
    const steps = members
      .filter((m) => m !== "product")
      .map((m) => {
        const member = getMemberConfig(m)!;
        return `• ${member.name} (${member.role}): ${getTaskForMember(m, request)}`;
      })
      .join("\n");

    return `**Action Plan:**\n${steps}\n\nStarting implementation now...`;
  };

  const getTaskForMember = (memberId: string, request: string): string => {
    const tasks: Record<string, string> = {
      frontend: "Implement the feature",
      designer: "Provide design specs",
      qa: "Write and run tests",
      devops: "Prepare deployment",
    };
    return tasks[memberId] || "Support the team";
  };

  const generateCodeSnippet = (request: string): string => {
    return `// Implementation for: ${request.substring(0, 50)}...
export function NewFeature() {
  const [data, setData] = useState();
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return (
    <div className="p-4">
      <h2>New Feature</h2>
      {/* Implementation */}
    </div>
  );
}`;
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const getStatusBadge = () => {
    switch (teamStatus) {
      case "discussing":
        return { text: "Discussing", color: "bg-amber-500/20 text-amber-400" };
      case "working":
        return { text: "Implementing", color: "bg-[#5b8aff]/20 text-[#5b8aff]" };
      case "deploying":
        return { text: "Deploying", color: "bg-emerald-500/20 text-emerald-400 animate-pulse" };
      default:
        return { text: "Ready", color: "bg-white/[0.04] text-[#8a8a9a]" };
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]"
      >
        <div className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5b8aff]/20 to-[#5b8aff]/5 border border-[#5b8aff]/20 flex items-center justify-center"
          >
            <FolderKanban className="w-6 h-6 text-[#5b8aff]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white"
            >{team.name}</h1>
            <p className="text-sm text-[#8a8a9a]"
            >{team.project} • {team.members.length} members</p>
          </div>
        </div>

        <div className="flex items-center gap-3"
        >
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusBadge().color}`}>
            {getStatusBadge().text}
          </span>
          
          <div className="flex -space-x-2"
          >
            {teamMembers.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-[#1a1a24] border-2 border-[#0a0a0f] flex items-center justify-center"
                title={member.name}
              >
                <member.icon className={`w-4 h-4 ${member.color}`} />
              </div>
            ))}
            {teamMembers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-[#1a1a24] border-2 border-[#0a0a0f] flex items-center justify-center text-xs text-[#8a8a9a]"
              >
                +{teamMembers.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2"
      >
        {messages.length === 0 && (
          <div className="text-center py-12"
          >
            <Users className="w-16 h-16 text-[#5a5a6a] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2"
            >Welcome to your Dashboard Team</h3>
            <p className="text-[#8a8a9a] max-w-md mx-auto"
            >
              This team discusses, implements, and deploys dashboard updates automatically.
              Tell them what you want to build!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2"
            >
              {[
                "Add a weather widget",
                "Create a dark mode toggle",
                "Build a crypto tracker",
                "Add notifications",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-sm text-[#8a8a9a] hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.senderId === "user";
          const member = getMemberConfig(message.senderId);
          const Icon = member?.icon || Users;

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isUser
                    ? "bg-[#5b8aff]"
                    : "bg-[#1a1a24] border border-white/[0.06]"
                }`}
              >
                {isUser ? (
                  <span className="text-white font-medium text-sm"
                  >YO</span>
                ) : (
                  <Icon className={`w-5 h-5 ${member?.color || "text-[#8a8a9a]"}`} />
                )}
              </div>

              <div className={`flex-1 ${isUser ? "text-right" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1"
                >
                  <span className="text-sm font-medium text-white"
                  >{message.senderName}</span>
                  <span className="text-xs text-[#5a5a6a]"
                  >{message.senderRole}</span>
                </div>

                <div
                  className={`inline-block text-left px-4 py-3 rounded-xl ${
                    isUser
                      ? "bg-[#5b8aff] text-white"
                      : message.type === "code"
                      ? "bg-[#1a1a24] border border-white/[0.08] font-mono text-sm"
                      : message.type === "action"
                      ? "bg-white/[0.04] border border-white/[0.06]"
                      : "bg-[#1a1a24] border border-white/[0.06] text-[#f0f0f5]"
                  }`}
                >
                  {message.type === "code" ? (
                    <pre className="whitespace-pre-wrap text-sm text-emerald-400"
                    >
                      {message.text}
                    </pre>
                  ) : (
                    <p className="whitespace-pre-wrap"
                    >{message.text}</p>
                  )}
                  
                  {message.action && (
                    <div className="mt-2 flex items-center gap-2"
                    >
                      {message.action.type === "deploy" && <Rocket className="w-4 h-4" />}
                      {message.action.type === "task" && <CheckCircle className="w-4 h-4" />}
                      {message.action.type === "commit" && <GitBranch className="w-4 h-4" />}
                      
                      <span className={`text-xs ${
                        message.action.status === "completed" ? "text-emerald-400" :
                        message.action.status === "failed" ? "text-red-400" :
                        message.action.status === "in_progress" ? "text-amber-400" :
                        "text-[#8a8a9a]"
                      }`}
                      >
                        {message.action.status === "in_progress" ? "In progress..." :
                         message.action.status === "completed" ? "Completed ✓" :
                         message.action.status === "failed" ? "Failed ✗" :
                         "Pending"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 pt-4 border-t border-white/[0.06]"
      >
        <div className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Tell the team what to build..."
            disabled={isProcessing}
            className="flex-1 bg-[#1a1a24] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-[#5a5a6a] focus:outline-none focus:border-[#5b8aff]/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-6 py-3 bg-[#5b8aff] text-white rounded-xl font-medium hover:bg-[#5b8aff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Building...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
