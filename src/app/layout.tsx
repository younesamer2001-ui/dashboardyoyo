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
    <html lang="no" className="dark">
      <body className="font-sans antialiased">
        <Sidebar />
        <main className="min-h-screen p-4 md:p-6 lg:ml-64 transition-all duration-300">
          {children}
        </main>
      </body>
    </html>
  );
}
