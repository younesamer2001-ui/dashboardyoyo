"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare, Send, Bot, User, Plus, Paperclip, Upload, X,
  FileText, Image, File, Search, ArrowDown, Copy, Check,
  Mic, MicOff, Sparkles, Zap, ChevronDown, Clock, Hash,
  Code, Link2, Bold, Italic, List, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

/* ─── Types ─── */
interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "agent" | "kimi";
  agentName?: string;
  agentIcon?: string;
  timestamp: string;
  attachments?: AttachedFile[];
  reactions?: string[];
  streaming?: boolean;
}

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  url?: string;
  uploading?: boolean;
}

/* ─── Helpers ─── */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf") || type.includes("document") || type.includes("text")) return FileText;
  return File;
}

// Relative time formatter (e.g., "2 min ago")
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 30) return "Just now";
  if (diffMin < 1) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatTime(timestamp);
}

function getDateLabel(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/* ─── Markdown Renderer ─── */
function renderMarkdown(text: string): React.ReactElement[] {
  const lines = text.split("\n");
  const elements: React.ReactElement[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = "";

  lines.forEach((line, lineIdx) => {
    // Code block start/end
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${lineIdx}`} className="my-3 rounded-lg overflow-hidden border border-white/10">
            {codeLang && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
                <span className="text-[10px] font-mono text-accent/70 uppercase tracking-wider">{codeLang}</span>
                <CopyButton text={codeBuffer.join("\n")} size="sm" />
              </div>
            )}
            <pre className="p-3 overflow-x-auto bg-black/30">
              <code className="text-xs font-mono text-gray-300 leading-relaxed">{codeBuffer.join("\n")}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        codeLang = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={`br-${lineIdx}`} className="h-2" />);
      return;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(<h4 key={`h3-${lineIdx}`} className="text-sm font-bold text-white mt-3 mb-1">{renderInline(line.slice(4))}</h4>);
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={`h2-${lineIdx}`} className="text-base font-bold text-white mt-3 mb-1">{renderInline(line.slice(3))}</h3>);
      return;
    }
    if (line.startsWith("# ")) {
      elements.push(<h2 key={`h1-${lineIdx}`} className="text-lg font-bold text-white mt-3 mb-1">{renderInline(line.slice(2))}</h2>);
      return;
    }

    // Bullet list
    if (line.match(/^\s*[-*]\s/)) {
      const content = line.replace(/^\s*[-*]\s/, "");
      elements.push(
        <div key={`li-${lineIdx}`} className="flex gap-2 ml-2 my-0.5">
          <span className="text-accent mt-1.5 text-[8px]">●</span>
          <span className="text-sm leading-relaxed">{renderInline(content)}</span>
        </div>
      );
      return;
    }

    // Numbered list
    if (line.match(/^\s*\d+\.\s/)) {
      const match = line.match(/^\s*(\d+)\.\s(.*)/)!;
      elements.push(
        <div key={`ol-${lineIdx}`} className="flex gap-2 ml-2 my-0.5">
          <span className="text-accent/70 text-xs font-mono min-w-[18px]">{match[1]}.</span>
          <span className="text-sm leading-relaxed">{renderInline(match[2])}</span>
        </div>
      );
      return;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <div key={`bq-${lineIdx}`} className="border-l-2 border-accent/40 pl-3 my-1 text-sm text-gray-300 italic">
          {renderInline(line.slice(2))}
        </div>
      );
      return;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={`hr-${lineIdx}`} className="border-white/10 my-3" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${lineIdx}`} className="text-sm leading-relaxed my-0.5">{renderInline(line)}</p>
    );
  });

  // Handle unclosed code block
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <pre key="code-unclosed" className="my-3 p-3 rounded-lg bg-black/30 border border-white/10 overflow-x-auto">
        <code className="text-xs font-mono text-gray-300">{codeBuffer.join("\n")}</code>
      </pre>
    );
  }

  return elements;
}

function renderInline(text: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = [];
  // Process inline markdown: **bold**, *italic*, `code`, [link](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      // Bold
      parts.push(<strong key={`b-${key++}`} className="font-semibold text-white">{match[2]}</strong>);
    } else if (match[3]) {
      // Italic
      parts.push(<em key={`i-${key++}`} className="italic text-gray-200">{match[4]}</em>);
    } else if (match[5]) {
      // Inline code
      parts.push(
        <code key={`c-${key++}`} className="px-1.5 py-0.5 rounded bg-white/10 text-accent text-xs font-mono">{match[6]}</code>
      );
    } else if (match[7]) {
      // Link
      parts.push(
        <a key={`a-${key++}`} href={match[9]} target="_blank" rel="noopener noreferrer"
          className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors">
          {match[8]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

/* ─── Copy Button ─── */
function CopyButton({ text, size = "md" }: { text: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className={cn(
        "rounded transition-all hover:bg-white/10",
        size === "sm" ? "p-1" : "p-1.5",
      )}>
      {copied
        ? <Check className={cn("text-green-400", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
        : <Copy className={cn("text-gray-500 hover:text-gray-300", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      }
    </button>
  );
}

/* ─── Streaming Text ─── */
function StreamingText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    let i = 0;
    const speed = Math.max(5, Math.min(20, 2000 / text.length));
    const interval = setInterval(() => {
      i += 1;
      // Skip ahead for long messages
      const step = text.length > 500 ? 3 : text.length > 200 ? 2 : 1;
      i = Math.min(i + step - 1, text.length);
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, done, onComplete]);

  if (done) return <>{renderMarkdown(text)}</>;

  return (
    <>
      {renderMarkdown(displayed)}
      <span className="inline-block w-1.5 h-4 bg-accent/70 animate-pulse ml-0.5 rounded-sm" />
    </>
  );
}

/* ─── Quick Reactions ─── */
const QUICK_REACTIONS = ["👍", "🔥", "💡", "✅", "❤️"];

function ReactionPicker({ onReact }: { onReact: (emoji: string) => void }) {
  return (
    <div className="flex gap-0.5 bg-[#1a1a2e]/90 backdrop-blur-sm border border-white/10 rounded-full px-1 py-0.5">
      {QUICK_REACTIONS.map((emoji) => (
        <button key={emoji} onClick={() => onReact(emoji)}
          className="hover:bg-white/10 rounded-full w-7 h-7 flex items-center justify-center text-sm transition-all hover:scale-110">
          {emoji}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Chat Page ─── */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploadingToStorage, setUploadingToStorage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const storageFileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ─── Fetch Messages ─── */
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat?limit=50");
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Auto Scroll ─── */
  useEffect(() => {
    if (!streamingMsgId) {
      // Only auto-scroll if user is already near bottom (within 100px)
      const container = chatContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [messages, streamingMsgId]);

  /* ─── Scroll Detection ─── */
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  /* ─── Click Outside Menu ─── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (showReactionPicker) setShowReactionPicker(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReactionPicker]);

  /* ─── Upload Success Toast ─── */
  useEffect(() => {
    if (uploadSuccess) {
      const t = setTimeout(() => setUploadSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [uploadSuccess]);

  /* ─── Keyboard Shortcuts ─── */
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, []);

  /* ─── Voice Input ─── */
  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => {
        const base = prev.endsWith(" ") ? prev : prev ? prev + " " : "";
        return base + transcript;
      });
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening]);

  /* ─── Filtered Messages ─── */
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.text.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  /* ─── Message Helpers ─── */
  const isUserMessage = (msg: ChatMessage) => msg.sender === "user";
  const isBotMessage = (msg: ChatMessage) => msg.sender === "agent" || msg.sender === "kimi";

  /* ─── File Handling ─── */
  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: AttachedFile[] = Array.from(files).map((f) => ({
      name: f.name, size: f.size, type: f.type, uploading: false,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    setShowMenu(false);
    e.target.value = "";
  };

  const handleStorageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setShowMenu(false);
    setUploadingToStorage(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("files", files[i]);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        setUploadSuccess(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""} to storage`);
        const fileNames = Array.from(files).map((f) => f.name).join(", ");
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `[Uploaded to storage: ${fileNames}]` }),
        });
      } else {
        setUploadSuccess("Upload failed. Try again.");
      }
    } catch (error) {
      console.error("Storage upload error:", error);
      setUploadSuccess("Upload failed. Try again.");
    } finally {
      setUploadingToStorage(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ─── Add Reaction ─── */
  const addReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, reactions: [...(m.reactions || []), emoji] }
          : m
      )
    );
    setShowReactionPicker(null);
  };

  /* ─── Send Message ─── */
  const sendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    const text = input.trim();
    const files = [...attachedFiles];
    setInput("");
    setAttachedFiles([]);
    setIsTyping(true);

    // Auto-resize textarea
    if (inputRef.current) inputRef.current.style.height = "44px";

    let fullText = text;
    if (files.length > 0) {
      const fileList = files.map((f) => `${f.name} (${formatFileSize(f.size)})`).join(", ");
      fullText = fullText ? `${fullText}\n\n[Attached: ${fileList}]` : `[Attached: ${fileList}]`;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: fullText,
      sender: "user",
      timestamp: new Date().toISOString(),
      attachments: files,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullText }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const data = await res.json();
      if (data.reply) {
        const kimiMsgId = (Date.now() + 1).toString();
        const kimiMsg: ChatMessage = {
          id: kimiMsgId,
          text: data.reply,
          sender: "agent",
          agentName: "Kimi",
          timestamp: data.timestamp || new Date().toISOString(),
          streaming: true,
        };
        setStreamingMsgId(kimiMsgId);
        setMessages((prev) => [...prev, kimiMsg]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process that. Please try again.",
        sender: "agent",
        agentName: "Kimi",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  /* ─── Auto-resize Textarea ─── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "44px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-accent animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-accent/10 animate-ping" />
          </div>
          <p className="text-sm text-gray-400 animate-pulse">Loading conversation...</p>
        </div>
      </div>
    );
  }

  /* ─── Date Separator Logic ─── */
  const getDateSeparators = (): Set<number> => {
    const indices = new Set<number>();
    let lastDate = "";
    filteredMessages.forEach((msg, i) => {
      const d = new Date(msg.timestamp).toDateString();
      if (d !== lastDate) {
        indices.add(i);
        lastDate = d;
      }
    });
    return indices;
  };
  const dateSepIndices = getDateSeparators();

  return (
    <div className="pt-16 lg:pt-0 max-w-4xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
      {/* ─── Professional Header ─── */}
      <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-bg-card to-transparent p-4 rounded-2xl border border-white/[0.06]">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent/30 to-purple-500/20 flex items-center justify-center border border-accent/20 shadow-lg shadow-accent/10 transition-transform group-hover:scale-105">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-[#0f0f1a] flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              Chat with Kimi
              <span className="text-[10px] font-medium bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/20">AI CEO</span>
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Online now
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-xs text-gray-500">
                {messages.length} messages
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowSearch(!showSearch); setTimeout(() => searchRef.current?.focus(), 100); }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all border",
              showSearch
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
            )}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden md:inline text-[10px] bg-white/10 px-1.5 py-0.5 rounded ml-1">⌘K</kbd>
          </button>
          
          <button
            onClick={() => {
              if (confirm('Clear all messages? This cannot be undone.')) {
                setMessages([]);
              }
            }}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      {showSearch && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 animate-in slide-in-from-top-2">
          <Search className="h-4 w-4 text-accent/50" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
          />
          {searchQuery && (
            <span className="text-[10px] text-gray-400">
              {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""}
            </span>
          )}
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}
            className="rounded p-1 hover:bg-white/10 transition-colors">
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      )}

      {/* ─── Upload Success Toast ─── */}
      {uploadSuccess && (
        <div className="mb-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400 flex items-center gap-2 animate-in slide-in-from-top-2">
          <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-3 w-3" />
          </div>
          {uploadSuccess}
        </div>
      )}

      {/* ─── Messages Area ─── */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-4 space-y-1 scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {/* Empty State - Professional */}
        {filteredMessages.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="relative mb-8">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-accent/20 via-purple-500/10 to-transparent flex items-center justify-center border border-white/10 shadow-xl shadow-accent/5">
                <Sparkles className="h-12 w-12 text-accent/60" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold text-white mb-2">Hey Younes! <span className="wave"></span></h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                I&apos;m Kimi, your AI CEO and command center. I can help you manage agents, 
                track projects, remember important details, or just have a conversation.
              </p>
              
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "🤖", text: "Create agent", desc: "Build a new AI agent" },
                    { icon: "📋", text: "View tasks", desc: "Check your todo list" },
                    { icon: "🧠", text: "Memory", desc: "What I remember" },
                    { icon: "⚡", text: "Quick help", desc: "Ask me anything" },
                  ].map((suggestion) => (
                    <button
                      key={suggestion.text}
                      onClick={() => { setInput(suggestion.text); inputRef.current?.focus(); }}
                      className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent/20 transition-all group text-left"
                    >
                      <span className="text-xl">{suggestion.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-200 group-hover:text-white">{suggestion.text}</p>
                        <p className="text-[10px] text-gray-500">{suggestion.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Search Results */}
        {filteredMessages.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Search className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">No messages matching &quot;{searchQuery}&quot;</p>
          </div>
        )}

        {/* Messages */}
        {filteredMessages.map((msg, idx) => (
          <div key={msg.id}>
            {/* Date Separator */}
            {dateSepIndices.has(idx) && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {getDateLabel(msg.timestamp)}
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={cn("flex gap-2.5 group py-1", isUserMessage(msg) ? "justify-end" : "justify-start")}
              onMouseEnter={() => setHoveredMsg(msg.id)}
              onMouseLeave={() => { setHoveredMsg(null); setShowReactionPicker(null); }}
            >
              {/* Bot Avatar */}
              {isBotMessage(msg) && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/10 border border-accent/10 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                </div>
              )}

              <div className="flex flex-col max-w-[75%]">
                {/* Message Content */}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 relative",
                    isUserMessage(msg)
                      ? "bg-accent/15 border border-accent/10 text-white rounded-tr-md"
                      : "bg-white/[0.06] border border-white/[0.06] text-gray-100 rounded-tl-md"
                  )}
                >
                  {msg.agentName && (
                    <p className="text-[10px] font-semibold text-accent mb-1.5 uppercase tracking-wider">
                      {msg.agentName}
                    </p>
                  )}

                  {/* File Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 space-y-1.5">
                      {msg.attachments.map((file, i) => {
                        const FileIcon = getFileIcon(file.type);
                        return (
                          <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.06] border border-white/[0.06] px-3 py-2 text-xs">
                            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                              <FileIcon className="h-3.5 w-3.5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-white/90 font-medium">{file.name}</p>
                              <p className="text-gray-500 text-[10px]">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Message Text */}
                  <div className="text-sm leading-relaxed">
                    {isBotMessage(msg) && msg.streaming && streamingMsgId === msg.id ? (
                      <StreamingText
                        text={msg.text}
                        onComplete={() => {
                          setStreamingMsgId(null);
                          setMessages((prev) =>
                            prev.map((m) => m.id === msg.id ? { ...m, streaming: false } : m)
                          );
                          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                      />
                    ) : isBotMessage(msg) ? (
                      renderMarkdown(msg.text)
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>

                {/* Timestamp + Actions Row */}
                <div className={cn(
                  "flex items-center gap-1.5 mt-1 px-1",
                  isUserMessage(msg) ? "justify-end" : "justify-start"
                )}>
                  <p className="text-[10px] text-gray-600" title={new Date(msg.timestamp).toLocaleString()}>
                    {formatRelativeTime(msg.timestamp)}
                  </p>

                  {/* Hover Actions */}
                  {hoveredMsg === msg.id && (
                    <div className="flex items-center gap-0.5 animate-in fade-in">
                      <CopyButton text={msg.text} size="sm" />
                      <button
                        onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                        className="rounded p-1 hover:bg-white/10 transition-all"
                      >
                        <span className="text-[11px]">😊</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 px-1">
                    {Object.entries(
                      msg.reactions.reduce((acc: Record<string, number>, r) => {
                        acc[r] = (acc[r] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => (
                      <span key={emoji} className="inline-flex items-center gap-1 text-xs bg-white/[0.06] border border-white/[0.06] rounded-full px-2 py-0.5">
                        {emoji} {(count as number) > 1 && <span className="text-gray-500">{count as number}</span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reaction Picker */}
                {showReactionPicker === msg.id && (
                  <div className={cn("mt-1", isUserMessage(msg) ? "self-end" : "self-start")}>
                    <ReactionPicker onReact={(emoji) => addReaction(msg.id, emoji)} />
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUserMessage(msg) && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/10 mt-0.5">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-2.5 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/10 border border-accent/10">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="rounded-2xl rounded-tl-md bg-white/[0.06] border border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[10px] text-gray-500">Kimi is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Scroll to Bottom ─── */}
      {showScrollBtn && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-accent/90 backdrop-blur-sm px-3 py-1.5 text-xs text-white shadow-lg shadow-accent/20 hover:bg-accent transition-all z-10"
          >
            <ArrowDown className="h-3 w-3" />
            New messages
          </button>
        </div>
      )}

      {/* ─── Attached Files Preview ─── */}
      {attachedFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachedFiles.map((file, i) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white group">
                <div className="h-6 w-6 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileIcon className="h-3 w-3 text-accent" />
                </div>
                <span className="truncate max-w-[120px]">{file.name}</span>
                <span className="text-gray-500">{formatFileSize(file.size)}</span>
                <button onClick={() => removeAttachment(i)} className="ml-1 rounded-full p-0.5 hover:bg-white/10 transition-colors opacity-50 group-hover:opacity-100">
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Input Area ─── */}
      <div className="mt-3 flex gap-2 items-end">
        {/* Plus Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "flex items-center justify-center rounded-xl border bg-white/5 w-11 h-11 text-white transition-all hover:bg-white/10",
              showMenu ? "bg-white/10 border-accent/30 rotate-45" : "border-white/10 hover:border-white/20"
            )}
            title="Add files & more"
          >
            <Plus className="h-5 w-5 transition-transform" />
          </button>
          {showMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-60 rounded-xl border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2">
              <button onClick={() => chatFileRef.current?.click()}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Paperclip className="h-4 w-4 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Attach to message</p>
                  <p className="text-[11px] text-gray-400">Send files with your message</p>
                </div>
              </button>
              <div className="border-t border-white/5" />
              <button onClick={() => storageFileRef.current?.click()} disabled={uploadingToStorage}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Upload to storage</p>
                  <p className="text-[11px] text-gray-400">{uploadingToStorage ? "Uploading..." : "Save files to dashboard"}</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input ref={chatFileRef} type="file" multiple className="hidden" onChange={handleChatFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.zip,.tar,.gz" />
        <input ref={storageFileRef} type="file" multiple className="hidden" onChange={handleStorageFileSelect} />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={attachedFiles.length > 0 ? "Add a message or just send..." : "Message Kimi..."}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 resize-none transition-all"
            rows={1}
            style={{ height: "44px", maxHeight: "160px" }}
          />
          {/* Voice Button inside input */}
          <button
            onClick={toggleVoice}
            className={cn(
              "absolute right-2 bottom-2 rounded-lg p-1.5 transition-all",
              isListening
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "hover:bg-white/10 text-gray-500 hover:text-gray-300"
            )}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={sendMessage}
          disabled={!input.trim() && attachedFiles.length === 0}
          className="flex items-center justify-center rounded-xl bg-accent w-11 h-11 text-white transition-all hover:bg-accent/80 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* ─── Footer ─── */}
      <div className="mt-2 mb-1 flex items-center justify-center">
        <p className="text-[10px] text-gray-600">
          Kimi K2 &bull; Memory-enhanced &bull; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
