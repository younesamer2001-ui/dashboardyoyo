"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Brain,
  Activity,
  MessageSquare,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Oversikt", icon: LayoutDashboard },
  { href: "/agents", label: "Agenter", icon: Users },
  { href: "/brain", label: "Hjerne", icon: Brain },
  { href: "/feed", label: "Feed", icon: Activity },
  { href: "/chat", label: "Chat med Kimi", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border-main bg-bg-secondary flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border-main">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
          <Zap className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-text-primary">
            Dashboard YOYO
          </h1>
          <p className="text-[11px] text-text-secondary">Younes AI Co.</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent/15 text-accent-light glow-accent"
                  : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Status bar */}
      <div className="border-t border-border-main px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success pulse-dot" />
          <span className="text-xs text-text-secondary">
            System online
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-text-secondary">
            2 agenter aktive
          </span>
        </div>
      </div>
    </aside>
  );
}
