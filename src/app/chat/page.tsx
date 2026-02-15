"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/types";
import { chatHistory } from "@/lib/mock-data";
import { formatTime } from "@/lib/utils";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(chatHistory);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate Kimi's response (will be replaced with real Telegram integration)
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "This is a placeholder response. Once the Telegram integration is connected, Kimi will respond here in real-time through your bot.",
        timestamp: new Date().toISOString(),
        agentName: "Kimi",
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-accent" />
            Chat med Kimi
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Snakk direkte med Kimi â din AI CEO og coach.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-success pulse-dot" />
          <span className="text-text-secondary">Online via Telegram</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border-main bg-bg-card p-4 space-y-4">
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
          placeholder="Skriv en melding til Kimi..."
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
