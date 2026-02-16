"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "agent" | "kimi";
  agentName?: string;
  agentIcon?: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages every 5 seconds
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isUserMessage = (msg: ChatMessage) => msg.sender === "user";
  const isBotMessage = (msg: ChatMessage) => msg.sender === "agent" || msg.sender === "kimi";

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");
    setIsTyping(true);

    // Optimistically add user message to UI
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error("Failed to send");
      }

      const data = await res.json();

      // Add Kimi's reply to UI
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
      // Add error message
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
          <p className="mt-1 text-sm text-gray-400">
            Talk directly with Kimi - your AI CEO and coach.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-400">Online via Telegram</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot className="h-12 w-12 mb-4 opacity-20" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              isUserMessage(msg) ? "justify-end" : "justify-start"
            )}
          >
            {isBotMessage(msg) && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Bot className="h-4 w-4 text-accent" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-xl px-4 py-3",
                isUserMessage(msg)
                  ? "bg-accent/20 text-white"
                  : "bg-white/10 text-white"
              )}
            >
              {msg.agentName && (
                <p className="text-[11px] font-medium text-accent mb-1">{msg.agentName}</p>
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
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="flex items-center justify-center rounded-xl bg-accent px-4 py-3 text-white transition-colors hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
