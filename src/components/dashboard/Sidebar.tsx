"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Users,
    Brain,
    Activity,
    MessageSquare,
    Settings,
    Zap,
    FileText,
    BarChart3,
    Shield,
    Globe,
    Database,
    Folder,
    Bell,
    Calendar,
    Mail,
    Search,
    Star,
    Heart,
    Home,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard, Users, Brain, Activity, MessageSquare,
    Settings, Zap, FileText, BarChart3, Shield, Globe,
    Database, Folder, Bell, Calendar, Mail, Search, Star, Heart, Home,
};

const fallbackNavItems = [
  { href: "/", label: "Overview", icon: "LayoutDashboard" },
  { href: "/agents", label: "Agents", icon: "Users" },
  { href: "/brain", label: "Brain", icon: "Brain" },
  { href: "/feed", label: "Feed", icon: "Activity" },
  { href: "/chat", label: "Chat with Kimi", icon: "MessageSquare" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/agent-lab", label: "Agent Lab", icon: "Zap" },
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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
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

  const title = config?.title || "Dashboard YOYO";
  const subtitle = config?.subtitle || "Younes AI Co.";

  // Get nav items and deduplicate by href
  const rawNavItems = config?.navItems?.length
    ? config.navItems.sort((a, b) => a.order - b.order)
    : fallbackNavItems.map((item, i) => ({ ...item, id: item.label, order: i }));

  const seen = new Set<string>();
  const navItems = rawNavItems.filter((item) => {
    const key = item.href;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed inset-y-0 left-0 z-30">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon] || FileText;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id || item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <IconComponent className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            Y
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">Younes</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
