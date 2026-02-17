"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users, Send, Bot, Crown, TrendingUp, Megaphone, Calculator, 
  Code, Palette, Briefcase, Sparkles, Loader2, CheckCircle2,
  Clock, MessageSquare
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  icon: any;
  color: string;
  status: "online" | "thinking" | "offline";
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  type: "user" | "agent" | "ceo-summary";
  isThinking?: boolean;
}

const teamMembers: TeamMember[] = [
  {
    id: "ceo",
    name: "Kimi",
    role: "AI CEO",
    specialty: "Strategy, Planning, Oversight",
    icon: Crown,
    color: "text-[#5b8aff] bg-[#5b8aff]/10",
    status: "online",
  },
  {
    id: "marketing",
    name: "Markus",
    role: "Marketing Lead",
    specialty: "Campaigns, Analytics, Growth",
    icon: TrendingUp,
    color: "text-emerald-400 bg-emerald-500/10",
    status: "offline",
  },
  {
    id: "social",
    name: "Sarah",
    role: "Social Media Manager",
    specialty: "Content, Engagement, Brand",
    icon: Megaphone,
    color: "text-pink-400 bg-pink-500/10",
    status: "offline",
  },
  {
    id: "finance",
    name: "Erik",
    role: "Accountant",
    specialty: "Tax, Bookkeeping, Finance",
    icon: Calculator,
    color: "text-amber-400 bg-amber-500/10",
    status: "offline",
  },
  {
    id: "developer",
    name: "Alex",
    role: "Developer",
    specialty: "Code, Architecture, DevOps",
    icon: Code,
    color: "text-purple-400 bg-purple-500/10",
    status: "offline",
  },
  {
    id: "designer",
    name: "Lisa",
    role: "Designer",
    specialty: "UI/UX, Branding, Assets",
    icon: Palette,
    color: "text-cyan-400 bg-cyan-500/10",
    status: "offline",
  },
];

export default function TeamChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingAgents, setThinkingAgents] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState(teamMembers);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      senderId: "younes",
      senderName: "Younes",
      senderRole: "Founder",
      text: inputText,
      timestamp: new Date().toISOString(),
      type: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsProcessing(true);

    // Determine which agents should respond
    const relevantAgents = determineRelevantAgents(inputText);
    
    // Set agents to "thinking" state
    setThinkingAgents(new Set(relevantAgents));
    setAgents((prev) =
      prev.map((agent) =
        relevantAgents.includes(agent.id) 
          ? { ...agent, status: "thinking" } 
          : agent
      )
    );

    try {
      // Call API to spawn sub-agents
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputText,
          context: "Younes is the founder and wants input from the team.",
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Add team responses
        const newMessages: Message[] = [];

        // Add individual agent responses
        data.teamResponses.forEach((response: any) => {
          if (response.agentId !== "ceo") {
            newMessages.push({
              id: `agent-${response.agentId}-${Date.now()}`,
              senderId: response.agentId,
              senderName: response.name,
              senderRole: response.role,
              text: response.response,
              timestamp: new Date().toISOString(),
              type: "agent",
            });
          }
        });

        // Add CEO summary last
        newMessages.push({
          id: `ceo-${Date.now()}`,
          senderId: "ceo",
          senderName: "Kimi",
          senderRole: "AI CEO",
          text: data.ceoSummary,
          timestamp: new Date().toISOString(),
          type: "ceo-summary",
        });

        setMessages((prev) => [...prev, ...newMessages]);
      }
    } catch (error) {
      console.error("Team chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          senderId: "ceo",
          senderName: "Kimi",
          senderRole: "AI CEO",
          text: "I apologize, I'm having trouble coordinating the team right now. Let me try again in a moment.",
          timestamp: new Date().toISOString(),
          type: "ceo-summary",
        },
      ]);
    } finally {
      setIsProcessing(false);
      setThinkingAgents(new Set());
      setAgents((prev) =
        prev.map((agent) =
          agent.status === "thinking" 
            ? { ...agent, status: "online" } 
            : agent
        )
      );
    }
  };

  const determineRelevantAgents = (message: string): string[] => {
    const lowerMsg = message.toLowerCase();
    const agents: string[] = ["ceo"];

    if (lowerMsg.match(/marketing|campaign|social|content|ad|promo|brand|seo|growth/)) {
      agents.push("marketing", "social");
    }
    if (lowerMsg.match(/budget|cost|price|money|finance|tax|revenue|profit/)) {
      agents.push("finance");
    }
    if (lowerMsg.match(/code|develop|tech|software|app|website|build|api|database|bug/)) {
      agents.push("developer");
    }
    if (lowerMsg.match(/design|ui|ux|brand|logo|visual|interface/)) {
      agents.push("designer");
    }

    return [...new Set(agents)];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "thinking":
        return <Loader2 className="w-3 h-3 animate-spin text-[#5b8aff]" />;
      case "online":
        return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500" />;
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      {/* Sidebar - Team Members */}
      <div className="w-64 hidden lg:flex flex-col bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#5b8aff]" />
            <span className="font-semibold text-white">Your Team</span>
          </div>
          <p className="text-xs text-[#5a5a6a]">AI Agents with specialized roles</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agents.map((member) => {
            const Icon = member.icon;
            const isThinking = member.status === "thinking";

            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isThinking ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                }`}
              >
                <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center ${member.color}`}
003e
                  <Icon className="w-5 h-5" />
                  {member.id === "ceo" && (
                    <Bot className="absolute -top-1 -right-1 w-3 h-3 text-[#5b8aff] bg-[#0a0a0f] rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{member.name}</span>
                    {getStatusIcon(member.status)}
                  </div>
                  <p className="text-xs text-[#5a5a6a] truncate">{member.role}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs text-[#8a8a9a]">
            <Sparkles className="w-3 h-3 text-[#5b8aff]" />
            <span>AI-powered team coordination</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b8aff]/20 to-[#5b8aff]/5 border border-[#5b8aff]/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#5b8aff]" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Executive Team</h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-[#8a8a9a]">Kimi coordinating {thinkingAgents.size > 0 ? `${thinkingAgents.size} agents` : 'team'}</span>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5b8aff]/10 text-[#5b8aff] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Coordinating...</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-[#5b8aff]/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-[#5b8aff]" />
              </div>
              <p className="text-white font-medium mb-2">Welcome to your AI Executive Team</p>
              <p className="text-sm text-[#8a8a9a] max-w-md mx-auto mb-6">
                Ask any business question and Kimi (CEO) will coordinate the right specialists 
                to provide expert input.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Should we increase marketing spend?",
                  "What's our technical debt situation?",
                  "How can we improve cash flow?",
                  "Ideas for social media growth?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInputText(suggestion);
                    }}
                    className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-sm text-[#8a8a9a] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.type === "user";
            const isCEO = message.type === "ceo-summary";

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isUser
                      ? "bg-white text-black"
                      : isCEO
                      ? "bg-[#5b8aff]/20 text-[#5b8aff] border border-[#5b8aff]/30"
                      : "bg-white/[0.06] text-[#8a8a9a]"
                  }`}
                >
                  {isUser ? (
                    <Briefcase className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                <div className={`max-w-[75%] ${isUser ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{message.senderName}</span>
                    <span className="text-xs text-[#5a5a6a]">{message.senderRole}</span>
                    <span className="text-xs text-[#5a5a6a]">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl whitespace-pre-wrap ${
                      isUser
                        ? "bg-white text-black rounded-br-md"
                        : isCEO
                        ? "bg-[#5b8aff]/10 border border-[#5b8aff]/20 text-white rounded-bl-md"
                        : "bg-[#0a0a0f] border border-white/[0.06] text-[#f0f0f5] rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {thinkingAgents.size > 0 && (
            <div className="flex items-center gap-3 text-sm text-[#5a5a6a]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Kimi is consulting with the team...</u003e/span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isProcessing && sendMessage()}
                placeholder={isProcessing ? "Kimi is coordinating..." : "Ask your executive team..."}
                disabled={isProcessing}
                className="w-full bg-[#0a0a0f] border border-white/[0.06] rounded-xl px-4 py-3 pr-12 text-white placeholder-[#5a5a6a] focus:outline-none focus:border-[#5b8aff]/30 disabled:opacity-50"
              />

              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#5b8aff] text-white rounded-lg hover:bg-[#5b8aff]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-[#5a5a6a] mt-2">
            Kimi (CEO) will route your question to the appropriate specialists and provide an executive summary.
          </p>
        </div>
      </div>
    </div>
  );
}
