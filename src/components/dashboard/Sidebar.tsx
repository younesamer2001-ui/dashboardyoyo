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
    Zap,
    FileText,
    BarChart3,
    Menu,
    X,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard, Users, Brain, Activity, MessageSquare,
    Zap, FileText, BarChart3,
};

const fallbackNavItems = [
  { href: "/", label: "Overview", icon: "LayoutDashboard" },
  { href: "/todos", label: "Tasks", icon: "CheckCircle" },
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
        // Use v2 API to bypass cache issues
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const title = config?.title || "Dashboard YOYO";
  const subtitle = config?.subtitle || "Younes AI Co.";

  // Get nav items and deduplicate by href
  const rawNavItems = config?.navItems?.length
    ? config.navItems.sort((a, b) => a.order - b.order)
    : fallbackNavItems.map((item, i) => ({ ...item, id: item.label, order: i }));

  // FORCE add Tasks if missing
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
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20">
            <Zap className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white truncate">{title}</h1>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar - Desktop (fixed) / Mobile (overlay) */}
      <aside
        className={cn(
          "fixed z-40 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out",
          "w-64 h-screen",
          "lg:translate-x-0 lg:left-0 lg:top-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "top-16 lg:top-0 h-[calc(100vh-4rem)] lg:h-screen"
        )}
      >
        {/* Logo - Desktop only */}
        <div className="hidden lg:block p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>

        {/* Navigation */}
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

        {/* User section */}
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

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ top: '4rem' }}
        />
      )}
    </>
  );
}
