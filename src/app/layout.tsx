import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/dashboard/Sidebar";

export const metadata: Metadata = {
  title: "Dashboard YOYO — Younes AI Command Center",
  description: "AI agent command center powered by Kimi. Monitor, manage, and chat with your AI agents.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className="font-sans antialiased bg-[#0a0a0f] text-[#f0f0f5]">
        <Sidebar />
        <main className="min-h-screen p-4 md:p-6 lg:pl-64 pt-20 lg:pt-6 transition-all">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
