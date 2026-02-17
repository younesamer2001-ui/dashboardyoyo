"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users, Send, Crown, TrendingUp, Megaphone, Calculator, 
  Code, Palette, Briefcase, Sparkles, Loader2,
  ChevronDown, Plus, FolderKanban, Hash, Settings,
  MoreHorizontal, Archive, Edit3, Trash2, X
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

interface TeamChat {
  id: string;
  name: string;
  project: string;
  description: string;
  members: string[]; // Agent IDs
  messages: Message[];
  createdAt: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  type: "user" | "agent" | "ceo-summary";
}

// Available agents
const availableAgents: TeamMember[] = [
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

// Default teams
const defaultTeams: TeamChat[] = [
  {
    id: "executive",
    name: "Executive Team",
    project: "All Projects",
    description: "Full team for strategic decisions",
    members: ["ceo", "marketing", "finance", "developer"],
    messages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "dashboard",
    name: "Dashboard YOYO Team",
    project: "Dashboard YOYO",
    description: "Product team for Dashboard development",
    members: ["ceo", "developer", "designer", "marketing"],
    messages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "siha",
    name: "Siha E-commerce",
    project: "Siha Shopify",
    description: "Marketing and design focus for Siha",
    members: ["ceo", "marketing", "social", "designer"],
    messages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "dev-only",
    name: "Dev Team",
    project: "Technical",
    description: "Technical discussions only",
    members: ["ceo", "developer"],
    messages: [],
    createdAt: new Date().toISOString(),
  },
];

export default function TeamChatPage() {
  const [teams, setTeams] = useState<TeamChat[]>(defaultTeams);
  const [activeTeamId, setActiveTeamId] = useState("executive");
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingAgents, setThinkingAgents] = useState<Set<string>>(new Set());
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamProject, setNewTeamProject] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["ceo"]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];
  const activeMembers = availableAgents.filter(a => activeTeam.members.includes(a.id));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTeam.messages]);

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

    // Add message to active team
    setTeams((prev) =>
      prev.map((team) =>
        team.id === activeTeamId
          ? { ...team, messages: [...team.messages, userMessage] }
          : team
      )
    );

    setInputText("");
    setIsProcessing(true);

    // Determine which agents in this team should respond
    const relevantAgents = determineRelevantAgents(inputText, activeTeam.members);

    setThinkingAgents(new Set(relevantAgents));

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputText,
          context: `Team: ${activeTeam.name}. Project: ${activeTeam.project}. Available specialists: ${activeMembers.map(m => m.name).join(", ")}`,
          availableAgents: activeTeam.members,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const newMessages: Message[] = [];

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

        newMessages.push({
          id: `ceo-${Date.now()}`,
          senderId: "ceo",
          senderName: "Kimi",
          senderRole: "AI CEO",
          text: data.ceoSummary,
          timestamp: new Date().toISOString(),
          type: "ceo-summary",
        });

        // Add all messages to active team
        setTeams((prev) =
          prev.map((team) =>
            team.id === activeTeamId
              ? { ...team, messages: [...team.messages, ...newMessages] }
              : team
          )
        );
      }
    } catch (error) {
      console.error("Team chat error:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        senderId: "ceo",
        senderName: "Kimi",
        senderRole: "AI CEO",
        text: "I apologize, I'm having trouble coordinating the team right now. Let me try again in a moment.",
        timestamp: new Date().toISOString(),
        type: "ceo-summary",
      };

      setTeams((prev) =
        prev.map((team) =>
          team.id === activeTeamId
            ? { ...team, messages: [...team.messages, errorMessage] }
            : team
        )
      );
    } finally {
      setIsProcessing(false);
      setThinkingAgents(new Set());
    }
  };

  const determineRelevantAgents = (message: string, available: string[]): string[] => {
    const lowerMsg = message.toLowerCase();
    const agents: string[] = ["ceo"];

    if (lowerMsg.match(/marketing|campaign|social|content|ad|promo|brand|seo|growth/)) {
      if (available.includes("marketing")) agents.push("marketing");
      if (available.includes("social")) agents.push("social");
    }
    if (lowerMsg.match(/budget|cost|price|money|finance|tax|revenue|profit/)) {
      if (available.includes("finance")) agents.push("finance");
    }
    if (lowerMsg.match(/code|develop|tech|software|app|website|build|api|database|bug/)) {
      if (available.includes("developer")) agents.push("developer");
    }
    if (lowerMsg.match(/design|ui|ux|brand|logo|visual|interface/)) {
      if (available.includes("designer")) agents.push("designer");
    }

    return [...new Set(agents)];
  };

  const createNewTeam = () => {
    if (!newTeamName.trim() || selectedMembers.length === 0) return;

    const newTeam: TeamChat = {
      id: `team-${Date.now()}`,
      name: newTeamName,
      project: newTeamProject || "General",
      description: `Custom team for ${newTeamProject || "general discussions"}`,
      members: selectedMembers,
      messages: [],
      createdAt: new Date().toISOString(),
    };

    setTeams((prev) => [...prev, newTeam]);
    setActiveTeamId(newTeam.id);
    setShowCreateModal(false);
    setNewTeamName("");
    setNewTeamProject("");
    setSelectedMembers(["ceo"]);
  };

  const deleteTeam = (teamId: string) => {
    if (teams.length <= 1) return;
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    if (activeTeamId === teamId) {
      setActiveTeamId(teams.find((t) => t.id !== teamId)?.id || teams[0].id);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      {/* Sidebar - Team Selector */}
      <div className="w-72 hidden lg:flex flex-col bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#5b8aff]" />
              <span className="font-semibold text-white">Teams</span>
            </div>
            <span className="text-xs text-[#5a5a6a]">{teams.length} teams</span>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-sm text-[#8a8a9a] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Team
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {teams.map((team) => {
            const isActive = team.id === activeTeamId;
            const memberCount = team.members.length;

            return (
              <button
                key={team.id}
                onClick={() => setActiveTeamId(team.id)}
                className={`w-full text-left p-3 rounded-lg transition-all group ${
                  isActive
                    ? "bg-[#5b8aff]/10 border border-[#5b8aff]/20"
                    : "hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-[#5b8aff]/20" : "bg-white/[0.04]"
                    }`}
                  >
                    <Hash
                      className={`w-5 h-5 ${
                        isActive ? "text-[#5b8aff]" : "text-[#5a5a6a]"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium truncate ${
                          isActive ? "text-white" : "text-[#f0f0f5]"
                        }`}
                      >
                        {team.name}
                      </span>
                      {team.id !== "executive" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTeam(team.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#5a5a6a] hover:text-red-400 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-[#5a5a6a] truncate">{team.project}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-1">
                        {team.members.slice(0, 3).map((memberId) => {
                          const member = availableAgents.find(
                            (a) => a.id === memberId
                          );
                          if (!member) return null;
                          const Icon = member.icon;
                          return (
                            <div
                              key={memberId}
                              className={`w-5 h-5 rounded-full flex items-center justify-center border border-[#13131f] ${member.color}`}
                            >
                              <Icon className="w-2.5 h-2.5" />
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-xs text-[#5a5a6a]">{memberCount} members</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header with Team Selector */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <button
                onClick={() => setShowTeamSelector(!showTeamSelector)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] rounded-lg text-sm"
              >
                <span className="text-white">{activeTeam.name}</span>
                <ChevronDown className="w-4 h-4 text-[#5a5a6a]" />
              </button>

              {showTeamSelector && (
                <div className="absolute top-16 left-4 right-4 bg-[#1c1c28] border border-white/[0.08] rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setActiveTeamId(team.id);
                        setShowTeamSelector(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-white/[0.04] ${
                        team.id === activeTeamId ? "bg-[#5b8aff]/10" : ""
                      }`}
                    >
                      <p className="text-white font-medium">{team.name}</p>
                      <p className="text-xs text-[#5a5a6a]">{team.project}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b8aff]/20 to-[#5b8aff]/5 border border-[#5b8aff]/20 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-[#5b8aff]" />
                </div>

                <div>
                  <h2 className="font-semibold text-white">{activeTeam.name}</h2>
                  <p className="text-xs text-[#8a8a9a]">{activeTeam.project}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {activeMembers.slice(0, 4).map((member) => {
                const Icon = member.icon;
                return (
                  <div
                    key={member.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#13131f] ${member.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                );
              })}
            </div>

            <button className="p-2 rounded-lg hover:bg-white/[0.04] text-[#5a5a6a]">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTeam.messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-[#5b8aff]/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#5b8aff]" />
              </div>
              <p className="text-white font-medium mb-2">{activeTeam.name}</p>
              <p className="text-sm text-[#8a8a9a] max-w-md mx-auto mb-6">
                {activeTeam.description}
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "What's our strategy?",
                  "How do we improve this?",
                  "What's the timeline?",
                  "Any blockers?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputText(suggestion)}
                    className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-sm text-[#8a8a9a] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTeam.messages.map((message) => {
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
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>

                <div className={`max-w-[75%] ${isUser ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{message.senderName}</span>
                    <span className="text-xs text-[#5a5a6a]">{message.senderRole}</span>
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
              <span>Kimi is consulting with the team...</span>
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
                placeholder={isProcessing ? "Kimi is coordinating..." : `Ask ${activeTeam.name}...`}
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
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13131f] border border-white/[0.08] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Create New Team</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#5a5a6a] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#8a8a9a] mb-2 block">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Marketing Team"
                  className="w-full bg-[#0a0a0f] border border-white/[0.06] rounded-lg px-4 py-2.5 text-white placeholder-[#5a5a6a] focus:outline-none focus:border-[#5b8aff]/30"
                />
              </div>

              <div>
                <label className="text-sm text-[#8a8a9a] mb-2 block">Project (optional)</label>
                <input
                  type="text"
                  value={newTeamProject}
                  onChange={(e) => setNewTeamProject(e.target.value)}
                  placeholder="e.g. Q1 Campaign"
                  className="w-full bg-[#0a0a0f] border border-white/[0.06] rounded-lg px-4 py-2.5 text-white placeholder-[#5a5a6a] focus:outline-none focus:border-[#5b8aff]/30"
                />
              </div>

              <div>
                <label className="text-sm text-[#8a8a9a] mb-2 block">Select Members</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableAgents.map((agent) => {
                    const Icon = agent.icon;
                    const isSelected = selectedMembers.includes(agent.id);

                    return (
                      <button
                        key={agent.id}
                        onClick={() => {
                          if (agent.id === "ceo") return; // CEO always included
                          setSelectedMembers((prev) =
                            isSelected
                              ? prev.filter((id) => id !== agent.id)
                              : [...prev, agent.id]
                          );
                        }}
                        disabled={agent.id === "ceo"}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-white/[0.08] border-white/[0.15]"
                            : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"
                        } ${agent.id === "ceo" ? "opacity-70" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agent.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-white">{agent.name}</p>
                          <p className="text-xs text-[#5a5a6a]">{agent.role}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#5b8aff] ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={createNewTeam}
                disabled={!newTeamName.trim() || selectedMembers.length === 0}
                className="w-full py-2.5 bg-[#5b8aff] text-white rounded-lg font-medium hover:bg-[#5b8aff]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
