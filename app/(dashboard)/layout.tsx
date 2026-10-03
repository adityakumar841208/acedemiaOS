"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import AIAssistant from "@/components/ai/AIAssistant";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith("/resources/") && pathname !== "/resources") {
    return <div className="min-h-screen bg-slate-950">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f4ec]">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
            <div className="w-64 bg-slate-900 flex flex-col shadow-2xl relative">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
              <Sidebar />
            </div>
            <div
              className="flex-1"
              onClick={() => setMobileSidebarOpen(false)}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {/* Mobile menu toggle bar */}
          <div className="md:hidden bg-[#fffdf8] border-b border-[#e5ddcc] px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-4 h-4 text-amber-700" />
              <span>Menu & Navigation</span>
            </button>
            <span className="text-xs text-slate-400">CSE • 3rd Sem</span>
          </div>

          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Read-Only AI Assistant */}
      <AIAssistant />
    </div>
  );
}

