"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users, Send, MoreHorizontal, Phone, Video, 
  Crown, TrendingUp, Megaphone, Calculator, 
  Code, Palette, Briefcase, Bot, Plus,
  PhoneCall, Mail, ChevronDown, X, Sparkles
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "online" | "away" | "busy" | "offline";
  specialty: string;
  icon: any;
  color: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  type: "text" | "system";
}

const teamMembers: TeamMember[] = [
  {
    id: "kimi",
    name: "Kimi",
    role: "AI CEO",
    avatar: "K",
    status: "online",
    specialty: "Strategy, Planning, Oversight",
    icon: Crown,
    color: "text-[#5b8aff] bg-[#5b8aff]/10 border-[#5b8aff]/20",
  },
  {
    id: "markus",
    name: "Markus",
    role: "Marketing Lead",
    avatar: "M",
    status: "online",
    specialty: "Campaigns, Analytics, Growth",
    icon: TrendingUp,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "sarah",
    name: "Sarah",
    role: "Social Media Manager",
    avatar: "S",
    status: "online",
    specialty: "Content, Engagement, Brand",
    icon: Megaphone,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  },
  {
    id: "erik",
    name: "Erik",
    role: "Accountant",
    avatar: "E",
    status: "away",
    specialty: "Tax, Bookkeeping, Finance",
    icon: Calculator,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "alex",
    name: "Alex",
    role: "Developer",
    avatar: "A",
    status: "online",
    specialty: "Code, Architecture, DevOps",
    icon: Code,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "lisa",
    name: "Lisa",
    role: "Designer",
    avatar: "L",
    status: "busy",
    specialty: "UI/UX, Branding, Assets",
    icon: Palette,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    id: "younes",
    name: "Younes",
    role: "Founder",
    avatar: "Y",
    status: "online",
    specialty: "Vision, Decisions, Leadership",
    icon: Briefcase,
    color: "text-white bg-white/10 border-white/20",
  },
];

const initialMessages: Message[] = [
  {
    id: "1",
    senderId: "kimi",
    text: "God morgen team! Jeg har gått gjennom tallene for denne måneden. Vi ser en 15% økning i leads fra sosiale medier. Bra jobba, Sarah! 📈",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: "text",
  },
  {
    id: "2",
    senderId: "sarah",
    text: "Takk! Den nye TikTok-strategien fungerer virkelig. Jeg planlegger å øke posting til 2x daglig neste uke. Noen innvendinger?",
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    type: "text",
  },
  {
    id: "3",
    senderId: "markus",
    text: "Høres bra ut! Men husk å A/B teste først. Jeg kan sette opp tracking for å måle engasjement per post. @Alex - kan du hjelpe med dashboard?",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    type: "text",
  },
  {
    id: "4",
    senderId: "alex",
    text: "Selvfølgelig! Jeg skal integrere det med vår eksisterende analytics. Skal ha det klart innen fredag.",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    type: "text",
  },
  {
    id: "5",
    senderId: "kimi",
    text: "Perfekt. @Erik - kan du sjekke om vi har budsjett for økt annonsering? Jeg vil gjerne skalere det som fungerer.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    type: "text",
  },
  {
    id: "6",
    senderId: "erik",
    text: "Ser på det nå. Vi har ca 25k igjen i Q1-budsjettet. Kan omprioritere fra tradisjonell annonsering til sosiale medier hvis dere ønsker.",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: "text",
  },
];

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour === 1) return "1h ago";
  return `${diffHour}h ago`;
}

export default function TeamChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberInfo, setShowMemberInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate team member responses
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const responders = teamMembers.filter(m => m.id !== "younes" && m.status === "online");
        const responder = responders[Math.floor(Math.random() * responders.length)];
        
        const responses = [
          "Godt poeng! Jeg ser på det.",
          "Enig. Skal vi planlegge et møte?",
          "Har dere sett de nye tallene?",
          "Jeg kan ta det videre.",
          "Flott arbeid alle sammen! 👏",
        ];
        
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: responder.id,
          text: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toISOString(),
          type: "text",
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "younes",
      text: inputText,
      timestamp: new Date().toISOString(),
      type: "text",
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText("");
    
    // Simulate AI response after 1-3 seconds
    setTimeout(() => {
      const aiResponses = [
        "Bra innspill, Younes! Jeg skal følge opp.",
        "Notert. Skal prioriteres.",
        "Enig med deg. Skal vi diskutere det på neste møte?",
        "Perfekt! Jeg tar det videre.",
        "God idé! Skal undersøke mulighetene.",
      ];
      
      const responder = teamMembers.find(m => m.id === "kimi") || teamMembers[1];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: responder.id,
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date().toISOString(),
        type: "text",
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, 1000 + Math.random() * 2000);
  };

  const onlineCount = teamMembers.filter(m => m.status === "online").length;

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      
      {/* Sidebar - Team Members */}
      <div className="w-64 hidden lg:flex flex-col bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#5b8aff]" />
            <span className="font-semibold text-white">Team</span>
          </div>
          <p className="text-xs text-[#5a5a6a]">{onlineCount} of {teamMembers.length} online</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {teamMembers.map((member) => {
            const Icon = member.icon;
            const lastMessage = messages
              .filter(m => m.senderId === member.id)
              .pop();
            
            return (
              <button
                key={member.id}
                onClick={() => {
                  setSelectedMember(member);
                  setShowMemberInfo(true);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
              >
                <div className="relative">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${member.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#13131f] ${
                    member.status === "online" ? "bg-emerald-500" :
                    member.status === "away" ? "bg-amber-500" :
                    member.status === "busy" ? "bg-red-500" :
                    "bg-gray-500"
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{member.name}</span>
                    {member.id === "kimi" && (
                      <Bot className="w-3 h-3 text-[#5b8aff]" />
                    )}
                  </div>
                  <p className="text-xs text-[#5a5a6a] truncate">{member.role}</p>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="p-3 border-t border-white/[0.06]">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-sm text-[#8a8a9a] transition-colors">
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b8aff]/20 to-[#5b8aff]/5 border border-[#5b8aff]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#5b8aff]" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Team Chat</h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-[#8a8a9a]">{onlineCount} online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/[0.04] text-[#5a5a6a] transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/[0.04] text-[#5a5a6a] transition-colors">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/[0.04] text-[#5a5a6a] transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center">
            <span className="text-xs text-[#5a5a6a] bg-[#0a0a0f] px-3 py-1 rounded-full">Today</span>
          </div>
          
          {messages.map((message, i) => {
            const sender = teamMembers.find(m => m.id === message.senderId);
            if (!sender) return null;
            
            const Icon = sender.icon;
            const isMe = sender.id === "younes";
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${sender.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className={`max-w-[70%] ${isMe ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{sender.name}</span>
                    <span className="text-xs text-[#5a5a6a]">{getRelativeTime(message.timestamp)}</span>
                  </div>
                  
                  <div className={`p-3 rounded-2xl ${
                    isMe 
                      ? "bg-[#5b8aff] text-white rounded-br-md" 
                      : "bg-[#0a0a0f] border border-white/[0.06] text-[#f0f0f5] rounded-bl-md"
                  }`}>
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
          
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
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Message the team..."
                className="w-full bg-[#0a0a0f] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-[#5a5a6a] focus:outline-none focus:border-[#5b8aff]/30 pr-12"
              />
              
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#5b8aff] text-white rounded-lg hover:bg-[#5b8aff]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-xs text-[#5a5a6a] mt-2">
            Tip: Mention @kimi, @markus, @sarah to notify specific team members
          </p>
        </div>
      </div>

      {/* Member Info Panel */}
      {showMemberInfo && selectedMember && (
        <div className="w-72 hidden xl:block bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="p-6 text-center border-b border-white/[0.06]">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${selectedMember.color}`}>
              <selectedMember.icon className="w-8 h-8" />
            </div>
            
            <h3 className="font-semibold text-white text-lg">{selectedMember.name}</h3>
            <p className="text-[#8a8a9a]">{selectedMember.role}</p>
            
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                selectedMember.status === "online" ? "bg-emerald-500/10 text-emerald-400" :
                selectedMember.status === "away" ? "bg-amber-500/10 text-amber-400" :
                selectedMember.status === "busy" ? "bg-red-500/10 text-red-400" :
                "bg-gray-500/10 text-gray-400"
              }`}>
                {selectedMember.status}
              </span>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-[#5a5a6a] uppercase tracking-wider mb-2">Specialty</p>
              <p className="text-sm text-[#8a8a9a]">{selectedMember.specialty}</p>
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-sm text-white transition-colors">
                <Mail className="w-4 h-4" />
                Message
              </button>
              
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-sm text-white transition-colors">
                <PhoneCall className="w-4 h-4" />
                Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
