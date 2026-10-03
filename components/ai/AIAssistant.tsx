"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, RotateCcw, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useUserSession } from "@/context/UserContext";
import Image from "next/image";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS: Record<string, string[]> = {
  STUDENT: [
    "Do I have any pending assignments?",
    "What do I need to submit?",
    "Have I submitted DBMS?",
    "What subjects do I have?",
    "What is my attendance status?",
  ],
  CR: [
    "Do I have any pending assignments?",
    "What do I need to submit?",
    "Have I submitted DBMS?",
    "What subjects do I have?",
    "What is my attendance status?",
  ],
  FACULTY: [
    "Which submissions need evaluation?",
    "Show my assigned subjects.",
    "How many submissions are pending?",
    "Show my active assignments.",
  ],
  ADMIN: [
    "Give me an academic overview.",
    "How many students are registered?",
    "How many faculty members are active?",
    "What is the subject allocation status?",
  ],
};

export default function AIAssistant() {
  const { user, role, isAuthenticated } = useUserSession();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentRole = role || "STUDENT";
  const starterPrompts = STARTER_PROMPTS[currentRole] || STARTER_PROMPTS.STUDENT;

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, scrollToBottom]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // If user is unauthenticated, do not render floating AI assistant
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Build lightweight conversation history for context
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to receive response from assistant.");
      }

      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: data.message || "I don't have enough data to answer that.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: err.message || "Sorry, I couldn't process your request right now.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const firstName = user.name ? user.name.split(" ")[0] : "Student";

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        type="button"
        aria-label="Open AcademiaOS AI Assistant"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-20 right-6 z-50 flex h-20 w-20 items-center pointer justify-center overflow-hidden rounded-full border border-cyan-300/40 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.24),transparent_48%),linear-gradient(145deg,#172033,#050914)] text-amber-400 shadow-[0_0_18px_rgba(34,211,238,0.32),0_0_42px_rgba(245,158,11,0.18),inset_0_0_18px_rgba(125,211,252,0.16)] hover:border-cyan-200/80 hover:shadow-[0_0_24px_rgba(34,211,238,0.48),0_0_52px_rgba(245,158,11,0.24),inset_0_0_20px_rgba(125,211,252,0.2)] focus:outline-none focus:ring-2 focus:ring-cyan-300/70 focus:ring-offset-2 focus:ring-offset-slate-900 transition-[border-color,box-shadow] sm:bottom-22"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-10 w-10 text-slate-200" />
            </motion.div>
          ) : (
            <motion.div
              key="sparkles"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative flex h-16 w-16 items-center justify-center pointer"
            >
              <span
                aria-hidden="true"
                className="absolute inset-2 rounded-full bg-cyan-300/25 blur-xl"
              />
              <Image
                src="/bot.png"
                alt=""
                width={72}
                height={72}
                aria-hidden="true"
                className="relative h-[4.5rem] w-[4.5rem] object-contain drop-shadow-[0_0_7px_rgba(34,211,238,0.95)]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.93, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-22 right-6 z-50 flex flex-col w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] max-h-[82vh] rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white tracking-wide">
                      Academia<span className="text-amber-400">OS</span> AI
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-800 text-amber-300/90 border border-slate-700">
                      {currentRole}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Your academic assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title="Clear conversation"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close assistant"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.length === 0 ? (
                /* Role-Aware Empty State */
                <div className="flex flex-col h-full justify-between py-2">
                  <div className="text-center pt-4">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Bot className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      Hello, {firstName}!
                    </h4>
                    <p className="mt-1 text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                      I can help you check assignments, syllabus topics, submissions, and course schedules.
                    </p>
                  </div>

                  {/* Starter Prompts */}
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Suggested questions
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {starterPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="text-left text-xs px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between group"
                        >
                          <span className="truncate">{prompt}</span>
                          <span className="text-slate-500 group-hover:text-amber-400 text-xs ml-2">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Message List */
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-amber-600 text-white rounded-tr-xs shadow-md"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs shadow-sm"
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.content}</div>
                      </div>

                      {msg.role === "user" && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-600/30 text-amber-300 mt-0.5">
                          <User className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Thinking Indicator */}
                  {isLoading && (
                    <div className="flex items-center gap-2.5 justify-start">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="rounded-2xl rounded-tl-xs bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                        <span>Querying academic records...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Footer Input Area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="border-t border-slate-800/80 p-3 bg-slate-900/70"
            >
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about assignments, subjects, submissions..."
                  disabled={isLoading}
                  maxLength={600}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  title="Send message"
                  className="absolute right-1.5 p-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span>Read-only academic assistant</span>
                <span>Powered by Groq</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
