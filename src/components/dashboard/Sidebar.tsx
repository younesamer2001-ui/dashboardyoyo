"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard, Users, Brain, Activity, MessageSquare,
    Zap, FileText, BarChart3, Menu, X, FolderKanban,
    CheckCircle, Bell, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
    LayoutDashboard, Users, Brain, Activity, MessageSquare,
    Zap, FileText, BarChart3, FolderKanban, CheckCircle, Bell,
};

const fallbackNavItems = [
  { href: "/", label: "Overview", icon: "LayoutDashboard" },
  { href: "/todos", label: "Tasks", icon: "CheckCircle" },
  { href: "/projects", label: "Projects", icon: "FolderKanban" },
  { href: "/files", label: "Files", icon: "FileText" },
  { href: "/agents", label: "Agents", icon: "Users" },
  { href: "/brain", label: "Brain", icon: "Brain" },
  { href: "/feed", label: "Feed", icon: "Activity" },
  { href: "/chat", label: "Chat", icon: "MessageSquare" },
];

interface DashboardConfig {
    title: string;
    subtitle: string;
    navItems: Array<{
      id: string;
      href: string;
      label: string;
      icon: string;
      order: number;
      protected?: boolean;
    }>;
}

export default function Sidebar() {
    const pathname = usePathname();
    const [config, setConfig] = useState<DashboardConfig | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/v2/dashboard", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard config:", e);
      }
    };
    fetchConfig();
    const interval = setInterval(fetchConfig, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const title = config?.title || "Dashboard YOYO";

  const rawNavItems = config?.navItems?.length
    ? config.navItems.sort((a, b) => a.order - b.order)
    : fallbackNavItems.map((item, i) => ({ ...item, id: item.label, order: i }));

  const hasTasks = rawNavItems.some((item) => item.href === '/todos');
  let navItems = rawNavItems;
  if (!hasTasks) {
    navItems = [
      ...rawNavItems,
      { id: 'todos', href: '/todos', label: 'Tasks', icon: 'CheckCircle', order: 1 }
    ].sort((a, b) => a.order - b.order);
  }

  const seen = new Set<string>();
  navItems = navItems.filter((item) => {
    const key = item.href;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <>
      {/* Mobile Header - Linear style */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#5b8aff]/20 to-[#5b8aff]/5 border border-[#5b8aff]/20">
            <Zap className="h-3.5 w-3.5 text-[#5b8aff]" />
          </div>
          <h1 className="text-sm font-semibold text-white">{title}</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4 text-gray-400" /> : <Menu className="h-4 w-4 text-gray-400" />}
        </button>
      </header>

      {/* Sidebar - Linear style */}
      <aside
        className={cn(
          "fixed z-40 bg-[#0a0a0f] border-r border-white/[0.06] flex flex-col transition-transform duration-300 ease-in-out",
          "w-60 h-screen",
          "lg:translate-x-0 lg:left-0 lg:top-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "top-14 lg:top-0 h-[calc(100vh-3.5rem)] lg:h-screen"
        )}
      >
        {/* Logo - Desktop only */}
        <div className="hidden lg:flex items-center gap-3 p-5 border-b border-white/[0.06]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#5b8aff]/20 to-[#5b8aff]/5 border border-[#5b8aff]/20">
            <Zap className="h-4 w-4 text-[#5b8aff]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">{title}</h1>
          </div>
        </div>

        {/* Navigation - Linear style */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const IconComponent = iconMap[item.icon] || FileText;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id || item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-white/[0.06] text-white"
                    : "text-[#8a8a9a] hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <IconComponent className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-[#5b8aff]" : "text-[#5a5a6a] group-hover:text-[#8a8a9a]"
                )} />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#5b8aff]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section - Linear style */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#5b8aff] to-[#3b82f6] flex items-center justify-center text-white text-xs font-bold">
              Y
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">Younes</p>
              <p className="text-[10px] text-[#5a5a6a] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Online
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ top: '3.5rem' }}
        />
      )}
    </>
  );
}
