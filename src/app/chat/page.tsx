"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/types";
import { formatTime } from "@/lib/utils";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<string | null>(null);

  // Fetch messages from API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const url = lastFetchRef.current 
          ? `/api/chat?limit=50&after=${encodeURIComponent(lastFetchRef.current)}`
          : '/api/chat?limit=50';
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
          // Transform API format to component format
          const transformed = data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.sender === 'agent' ? 'assistant' : 'user',
            content: msg.text,
            timestamp: msg.timestamp,
            agentName: msg.agentName,
          }));
          
          if (transformed.length > 0) {
            setMessages(prev => {
              // Merge new messages, avoid duplicates
              const existingIds = new Set(prev.map(m => m.id));
              const newMessages = transformed.filter((m: ChatMessage) => !existingIds.has(m.id));
              return [...prev, ...newMessages];
            });
            lastFetchRef.current = new Date().toISOString();
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    // Poll every 3 seconds for new messages
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    
    // Optimistically add to UI
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Send to API
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sender: 'user',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      // Kimi will respond via Telegram integration (through separate endpoint)
      // For now, show typing indicator until real response comes through polling
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
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
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-accent" />
            Chat with Kimi
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Talk directly with Kimi - your AI CEO and coach.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-success pulse-dot" />
          <span className="text-text-secondary">Online via Telegram</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border-main bg-bg-card p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <Bot className="h-12 w-12 mb-4 opacity-20" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Bot className="h-4 w-4 text-accent" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-xl px-4 py-3",
                msg.role === "user"
                  ? "bg-accent/20 text-text-primary"
                  : "bg-bg-primary text-text-primary"
              )}
            >
              {msg.agentName && (
                <p className="text-[11px] font-medium text-accent mb-1">
                  {msg.agentName}
                </p>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
              <p className="text-[10px] text-text-secondary mt-1">
                {formatTime(msg.timestamp)}
              </p>
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-card-hover">
                <User className="h-4 w-4 text-text-secondary" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="rounded-xl bg-bg-primary px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message to Kimi..."
          className="flex-1 rounded-xl border border-border-main bg-bg-card px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="flex items-center justify-center rounded-xl bg-accent px-4 py-3 text-white transition-colors hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
