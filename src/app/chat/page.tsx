"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Plus, Paperclip, Upload, X, FileText, Image, File } from "lucide-react";
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
  if (type.includes("pdf") || type.includes("document") || type.includes("text")) return FileText;
  return File;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploadingToStorage, setUploadingToStorage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const storageFileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {        const res = await fetch("/api/chat?limit=50");
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (uploadSuccess) {
      const t = setTimeout(() => setUploadSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [uploadSuccess]);

  const isUserMessage = (msg: ChatMessage) => msg.sender === "user";
  const isBotMessage = (msg: ChatMessage) => msg.sender === "agent" || msg.sender === "kimi";

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
    if (!files || files.length === 0) return;    setShowMenu(false);
    setUploadingToStorage(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setUploadSuccess(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""} to storage`);
        const fileNames = Array.from(files).map((f) => f.name).join(", ");
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

  const sendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    const text = input.trim();
    const files = [...attachedFiles];
    setInput("");
    setAttachedFiles([]);
    setIsTyping(true);
    let fullText = text;
    if (files.length > 0) {
      const fileList = files.map((f) => `${f.name} (${formatFileSize(f.size)})`).join(", ");
      if (fullText) { fullText += `\n\n[Attached: ${fileList}]`; }
      else { fullText = `[Attached: ${fileList}]`; }
    }
    const userMsg: ChatMessage = {
      id: Date.now().toString(), text: fullText, sender: "user",      timestamp: new Date().toISOString(), attachments: files,
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
        const kimiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(), text: data.reply, sender: "agent",
          agentName: "Kimi", timestamp: data.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, kimiMsg]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process that. Please try again.",
        sender: "agent", agentName: "Kimi", timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally { setIsTyping(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-accent" />
            Chat with Kimi
          </h1>
          <p className="mt-1 text-sm text-gray-400">            Talk directly with Kimi - your AI CEO and coach.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-400">Online via Telegram</span>
        </div>
      </div>

      {uploadSuccess && (
        <div className="mb-2 rounded-lg bg-green-500/20 border border-green-500/30 px-4 py-2 text-sm text-green-400 flex items-center gap-2">
          <Upload className="h-4 w-4" />
          {uploadSuccess}
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot className="h-12 w-12 mb-4 opacity-20" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", isUserMessage(msg) ? "justify-end" : "justify-start")}>
            {isBotMessage(msg) && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Bot className="h-4 w-4 text-accent" />
              </div>
            )}
            <div className={cn("max-w-[75%] rounded-xl px-4 py-3", isUserMessage(msg) ? "bg-accent/20 text-white" : "bg-white/10 text-white")}>
              {msg.agentName && <p className="text-[11px] font-medium text-accent mb-1">{msg.agentName}</p>}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-2 space-y-1">
                  {msg.attachments.map((file, i) => {                    const FileIcon = getFileIcon(file.type);
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs">
                        <FileIcon className="h-3.5 w-3.5 text-accent" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-gray-500 shrink-0">{formatFileSize(file.size)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <p className="text-[10px] text-gray-400 mt-1">{formatTime(msg.timestamp)}</p>
            </div>
            {isUserMessage(msg) && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <User className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>        )}
        <div ref={messagesEndRef} />
      </div>

      {attachedFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachedFiles.map((file, i) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white">
                <FileIcon className="h-3.5 w-3.5 text-accent" />
                <span className="truncate max-w-[120px]">{file.name}</span>
                <span className="text-gray-500">{formatFileSize(file.size)}</span>
                <button onClick={() => removeAttachment(i)} className="ml-1 rounded p-0.5 hover:bg-white/10 transition-colors">
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex gap-2 items-end">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn("flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white transition-all hover:bg-white/10 hover:border-accent/50", showMenu && "bg-white/10 border-accent/50")}
            title="Add files & more"
          >
            <Plus className={cn("h-5 w-5 transition-transform", showMenu && "rotate-45")} />
          </button>

          {showMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-white/10 bg-[#1a1a2e] shadow-xl overflow-hidden z-50">              <button onClick={() => chatFileRef.current?.click()} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors">
                <Paperclip className="h-4 w-4 text-accent" />
                <div className="text-left">
                  <p className="font-medium">Attach to chat</p>
                  <p className="text-[11px] text-gray-400">Send files with your message</p>
                </div>
              </button>
              <div className="border-t border-white/5" />
              <button onClick={() => storageFileRef.current?.click()} disabled={uploadingToStorage} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50">
                <Upload className="h-4 w-4 text-green-400" />
                <div className="text-left">
                  <p className="font-medium">Upload to storage</p>
                  <p className="text-[11px] text-gray-400">{uploadingToStorage ? "Uploading..." : "Save files to dashboard"}</p>
                </div>
              </button>
            </div>
          )}
        </div>

        <input ref={chatFileRef} type="file" multiple className="hidden" onChange={handleChatFileSelect} accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.zip,.tar,.gz" />
        <input ref={storageFileRef} type="file" multiple className="hidden" onChange={handleStorageFileSelect} />

        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={attachedFiles.length > 0 ? "Add a message or just send..." : "Type a message to Kimi..."}          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() && attachedFiles.length === 0}
          className="flex items-center justify-center rounded-xl bg-accent px-4 py-3 text-white transition-colors hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
