"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Plus,
  Paperclip,
  Upload,
  X,
  FileText,
  Image,
  File,
  ChevronDown,
  Zap,
  Brain,
  Search,
  Globe,
  Sparkles,
  Clock,
  CheckCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "agent" | "kimi";
  agentName?: string;
  agentIcon?: string;
  timestamp: string;
  attachments?: AttachedFile[];
}

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  url?: string;
  uploading?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf") || type.includes("document") || type.includes("text"))
    return FileText;
  return File;
}

// Simple markdown-ish renderer for Kimi responses
function renderMessageText(text: string) {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    // Code blocks
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      const newlineIdx = inner.indexOf("\n");
      const code = newlineIdx >= 0 ? inner.slice(newlineIdx + 1) : inner;
      return (
        <pre
          key={i}
          className="my-2 rounded-lg bg-black/30 border border-white/5 p-3 text-xs font-mono overflow-x-auto"
        >
          <code>{code}</code>
        </pre>
      );
    }

    // Inline formatting
    const lines = part.split("\n");
    return (
      <span key={i}>
        {lines.map((line, j) => {
          // Bold
          let formatted: React.ReactNode = line;
          const boldParts = line.split(/(\*\*.*?\*\*)/g);
          if (boldParts.length > 1) {
            formatted = boldParts.map((bp, k) =>
              bp.startsWith("**") && bp.endsWith("**") ? (
                <strong key={k} className="font-semibold text-white">
                  {bp.slice(2, -2)}
                </strong>
              ) : (
                <span key={k}>{bp}</span>
              )
            );
          }

          // Check marks from command processing
          if (line.startsWith("\u2705 ")) {
            return (
              <span key={j} className="flex items-center gap-1.5 text-green-400 text-xs mt-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                {line.slice(2)}
                {j < lines.length - 1 && <br />}
              </span>
            );
          }

          return (
            <span key={j}>
              {formatted}
              {j < lines.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
}

// Relative time that auto-updates
function RelativeTime({ timestamp }: { timestamp: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  let text: string;
  if (seconds < 30) text = "just now";
  else if (minutes < 1) text = seconds + "s ago";
  else if (minutes < 60) text = minutes + "m ago";
  else if (hours < 24) text = hours + "h ago";
  else text = formatTime(timestamp);

  return <span>{text}</span>;
}

const SUGGESTIONS = [
  { icon: Brain, label: "Show ideas", desc: "See pending improvements" },
  { icon: Search, label: "Check monitors", desc: "View active watchers" },
  { icon: Zap, label: "Create an agent", desc: "Build a new AI agent" },
  { icon: Globe, label: "System status", desc: "Dashboard health check" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploadingToStorage, setUploadingToStorage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState<number>(Date.now());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const storageFileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMsgCountRef = useRef(0);

  // Scroll detection
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const distFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distFromBottom > 150);
    if (distFromBottom < 50) setNewMsgCount(0);
  }, []);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
      setNewMsgCount(0);
    },
    []
  );

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat?limit=50");
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          setIsConnected(true);
          setLastPollTime(Date.now());

          // Track new messages when scrolled up
          if (data.messages.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
            const container = chatContainerRef.current;
            if (container) {
              const distFromBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight;
              if (distFromBottom > 150) {
                setNewMsgCount((c) => c + (data.messages.length - prevMsgCountRef.current));
              }
            }
          }
          prevMsgCountRef.current = data.messages.length;
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll on new messages (only if near bottom)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const distFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distFromBottom < 200) {
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Upload success toast
  useEffect(() => {
    if (uploadSuccess) {
      const t = setTimeout(() => setUploadSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [uploadSuccess]);

  const isUserMessage = (msg: ChatMessage) => msg.sender === "user";
  const isBotMessage = (msg: ChatMessage) =>
    msg.sender === "agent" || msg.sender === "kimi";

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: AttachedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      uploading: false,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    setShowMenu(false);
    e.target.value = "";
  };

  const handleStorageFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setShowMenu(false);
    setUploadingToStorage(true);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setUploadSuccess(
          `Uploaded ${files.length} file${files.length > 1 ? "s" : ""} to storage`
        );
        const fileNames = Array.from(files)
          .map((f) => f.name)
          .join(", ");
        const text = `[Uploaded to storage: ${fileNames}]`;
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
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

  const sendMessage = async (overrideText?: string) => {
    const rawText = overrideText ?? input;
    if (!rawText.trim() && attachedFiles.length === 0) return;

    const text = rawText.trim();
    const files = [...attachedFiles];
    setInput("");
    setAttachedFiles([]);
    setIsTyping(true);
    inputRef.current?.focus();

    let fullText = text;
    if (files.length > 0) {
      const fileList = files
        .map((f) => `${f.name} (${formatFileSize(f.size)})`)
        .join(", ");
      if (fullText) {
        fullText += `\n\n[Attached: ${fileList}]`;
      } else {
        fullText = `[Attached: ${fileList}]`;
      }
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: fullText,
      sender: "user",
      timestamp: new Date().toISOString(),
      attachments: files,
    };
    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullText }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const data = await res.json();

      if (data.reply) {
        const kimiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: "agent",
          agentName: "Kimi",
          timestamp: data.timestamp || new Date().toISOString(),
        };
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

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3rem)] gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-accent/20 flex items-center justify-center">
            <Bot className="h-6 w-6 text-accent animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0a0a1a]" />
        </div>
        <p className="text-sm text-gray-400 animate-pulse">Connecting to Kimi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-accent/20 flex items-center justify-center border border-white/5">
              <Bot className="h-5 w-5 text-accent" />
            </div>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0a1a] transition-colors",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              Chat with Kimi
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                AI CEO
              </span>
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-green-500/80">Online</span>
                  <span className="text-gray-600">via Telegram + OpenRouter</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-400" />
                  <span className="text-red-400">Reconnecting...</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <Clock className="h-3 w-3" />
          <span>{messages.length} messages</span>
        </div>
      </div>

      {/* Upload success toast */}
      {uploadSuccess && (
        <div className="mb-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400 flex items-center gap-2 animate-in slide-in-from-top">
          <Upload className="h-4 w-4" />
          {uploadSuccess}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 scroll-smooth relative"
      >
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-purple-500/10 to-accent/10 flex items-center justify-center border border-white/5">
                <Sparkles className="h-8 w-8 text-accent/40" />
              </div>
            </div>
            <p className="text-gray-400 font-medium mb-1">Hey Younes!</p>
            <p className="text-gray-600 text-sm mb-6">
              What would you like to work on?
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.label.toLowerCase())}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3 text-left transition-all hover:bg-white/[0.06] hover:border-accent/20 group"
                >
                  <s.icon className="h-4 w-4 text-gray-500 group-hover:text-accent transition-colors shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                      {s.label}
                    </p>
                    <p className="text-[10px] text-gray-600">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => {
          const isUser = isUserMessage(msg);
          const isBot = isBotMessage(msg);
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const sameSender = prevMsg && prevMsg.sender === msg.sender;
          const showAvatar = !sameSender;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5",
                isUser ? "justify-end" : "justify-start",
                sameSender ? "mt-0.5" : "mt-3",
                idx === messages.length - 1 && "animate-in fade-in slide-in-from-bottom-2 duration-300"
              )}
            >
              {/* Bot avatar */}
              {isBot && (
                <div className={cn("shrink-0 w-7", !showAvatar && "invisible")}>
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-purple-500/15 to-accent/15 flex items-center justify-center border border-white/5">
                    <Bot className="h-3.5 w-3.5 text-accent" />
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 relative group",
                  isUser
                    ? "bg-accent/15 border border-accent/10 text-white"
                    : "bg-white/[0.05] border border-white/[0.06] text-gray-200",
                  isUser && !sameSender && "rounded-tr-md",
                  !isUser && !sameSender && "rounded-tl-md"
                )}
              >
                {/* Agent name */}
                {msg.agentName && showAvatar && (
                  <p className="text-[10px] font-semibold text-accent mb-1 tracking-wide uppercase">
                    {msg.agentName}
                  </p>
                )}

                {/* File attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {msg.attachments.map((file, i) => {
                      const FileIcon = getFileIcon(file.type);
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs border border-white/5"
                        >
                          <FileIcon className="h-3.5 w-3.5 text-accent" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-gray-500 shrink-0">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Message text */}
                <div className="text-[13px] leading-relaxed">
                  {isBot ? renderMessageText(msg.text) : (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  )}
                </div>

                {/* Timestamp */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 mt-1.5",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <span className="text-[10px] text-gray-600">
                    <RelativeTime timestamp={msg.timestamp} />
                  </span>
                  {isUser && (
                    <CheckCheck className="h-3 w-3 text-accent/50" />
                  )}
                </div>
              </div>

              {/* User avatar */}
              {isUser && (
                <div className={cn("shrink-0 w-7", !showAvatar && "invisible")}>
                  <div className="h-7 w-7 rounded-xl bg-white/[0.08] flex items-center justify-center border border-white/5">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-purple-500/15 to-accent/15 flex items-center justify-center border border-white/5 shrink-0">
              <Bot className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="rounded-2xl rounded-tl-md bg-white/[0.05] border border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce"
                    style={{ animationDelay: "0ms", animationDuration: "0.8s" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce"
                    style={{ animationDelay: "150ms", animationDuration: "0.8s" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce"
                    style={{ animationDelay: "300ms", animationDuration: "0.8s" }}
                  />
                </div>
                <span className="text-[10px] text-gray-600">Kimi is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <div className="relative">
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-[#1a1a2e]/90 border border-white/10 px-3 py-1.5 text-xs text-gray-300 shadow-lg backdrop-blur-sm hover:bg-white/10 transition-all z-10"
          >
            <ChevronDown className="h-3 w-3" />
            {newMsgCount > 0 ? `${newMsgCount} new message${newMsgCount > 1 ? "s" : ""}` : "Scroll to bottom"}
          </button>
        </div>
      )}

      {/* Attachment preview bar */}
      {attachedFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachedFiles.map((file, i) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white"
              >
                <FileIcon className="h-3.5 w-3.5 text-accent" />
                <span className="truncate max-w-[120px]">{file.name}</span>
                <span className="text-gray-500">{formatFileSize(file.size)}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="ml-1 rounded p-0.5 hover:bg-white/10 transition-colors"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input area */}
      <div className="mt-3 flex gap-2 items-end">
        {/* Plus menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-white transition-all hover:bg-white/[0.06] hover:border-accent/30",
              showMenu && "bg-white/[0.06] border-accent/30"
            )}
            title="Add files & more"
          >
            <Plus
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                showMenu && "rotate-45"
              )}
            />
          </button>

          {showMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-white/[0.08] bg-[#12122a]/95 shadow-xl overflow-hidden z-50 backdrop-blur-xl">
              <button
                onClick={() => chatFileRef.current?.click()}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/[0.06] transition-colors"
              >
                <Paperclip className="h-4 w-4 text-accent" />
                <div className="text-left">
                  <p className="font-medium text-[13px]">Attach to chat</p>
                  <p className="text-[11px] text-gray-500">
                    Send files with your message
                  </p>
                </div>
              </button>
              <div className="border-t border-white/5" />
              <button
                onClick={() => storageFileRef.current?.click()}
                disabled={uploadingToStorage}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4 text-green-400" />
                <div className="text-left">
                  <p className="font-medium text-[13px]">Upload to storage</p>
                  <p className="text-[11px] text-gray-500">
                    {uploadingToStorage
                      ? "Uploading..."
                      : "Save files to dashboard"}
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={chatFileRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChatFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.zip,.tar,.gz"
        />
        <input
          ref={storageFileRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleStorageFileSelect}
        />

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={
            attachedFiles.length > 0
              ? "Add a message or just send..."
              : "Message Kimi..."
          }
          className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/40 focus:bg-white/[0.04] transition-all"
        />

        {/* Send button */}
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() && attachedFiles.length === 0}
          className={cn(
            "flex items-center justify-center rounded-xl px-4 py-3 text-white transition-all",
            input.trim() || attachedFiles.length > 0
              ? "bg-accent hover:bg-accent/80 shadow-lg shadow-accent/20"
              : "bg-white/[0.05] text-gray-600 cursor-not-allowed"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Footer hint */}
      <p className="text-center text-[10px] text-gray-700 mt-2 mb-1">
        Kimi connects to Telegram, remembers context, and can execute commands
      </p>
    </div>
  );
}
