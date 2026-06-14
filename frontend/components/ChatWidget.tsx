"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from "marked";
import { streamChat, getChatHistory, logAnalyticsEvent } from "@/lib/chatClient";
import { getVisitorInfo } from "@/lib/visitorInfo";
import { retrieveContext } from "@/lib/ragEngine";
import { buildDocumentTree } from "@/lib/documentTree";
import type { ChatMessage, VisitorInfo } from "@/lib/types";

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Build once — reused across all queries (pure data, no side effects)
const docTree = buildDocumentTree();

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What is Rohan's tech stack?",
  "Summarize his experience in Generative AI",
  "Has he led engineering teams?",
  "Is he open to relocation or remote work?",
  "Tell me about his projects in Agentic AI",
];

const WELCOME_MSG: UIMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Rohan's AI assistant 👋 Ask me anything about his experience, projects, or skills. I'll answer based on his professional profile.",
};

// Custom premium SVG Assistant Icon with animations
function AssistantIcon({ className = "w-6 h-6", animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-cyan)" />
          <stop offset="100%" stopColor="var(--accent-purple)" />
        </linearGradient>
      </defs>
      {/* Outer Glow Ring */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="url(#aiGrad)"
        strokeWidth="1"
        strokeDasharray="4 2"
        className={animated ? "animate-spin" : ""}
        style={{ transformOrigin: "center", animationDuration: "12s" }}
      />
      {/* Head shape */}
      <rect
        x="6"
        y="7"
        width="12"
        height="10"
        rx="2"
        stroke="url(#aiGrad)"
        strokeWidth="1.5"
        fill="rgba(10, 25, 47, 0.6)"
      />
      {/* Eyes */}
      <circle
        cx="9.5"
        cy="11.5"
        r="1.2"
        fill="var(--accent-cyan)"
        className={animated ? "animate-pulse" : ""}
      />
      <circle
        cx="14.5"
        cy="11.5"
        r="1.2"
        fill="var(--accent-cyan)"
        className={animated ? "animate-pulse" : ""}
      />
      {/* Mouth/Waveform */}
      <path
        d="M9 14.5C10 15 11 14.5 12 15C13 14.5 14 15 15 14.5"
        stroke="var(--accent-cyan)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Antennas */}
      <path
        d="M12 7V4M10 4H14"
        stroke="url(#aiGrad)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Glowing antenna tip */}
      <circle
        cx="12"
        cy="3.5"
        r="1"
        fill="var(--accent-cyan)"
        className={animated ? "animate-ping" : ""}
        style={{ animationDuration: "2s" }}
      />
    </svg>
  );
}

// Synchronously parse markdown to HTML with streaming cursor support
const getHtmlContent = (content: string, streaming?: boolean) => {
  try {
    let raw = content;
    if (streaming) {
      raw += ' <span class="streaming-cursor"></span>';
    }
    return marked.parse(raw) as string;
  } catch (e) {
    console.error("Markdown parsing error:", e);
    return content;
  }
};

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-4 py-3" style={{ width: "fit-content" }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{
            background: "var(--accent-cyan)",
            animation: `pulse-glow 1s ease-in-out ${delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function parseMessageContent(content: string) {
  let thinking = "";
  let mainContent = content;
  let isThinking = false;

  if (content.includes("<think>")) {
    const start = content.indexOf("<think>");
    const end = content.indexOf("</think>");
    if (end !== -1) {
      thinking = content.slice(start + 7, end).trim();
      mainContent = content.slice(end + 8).trim();
    } else {
      thinking = content.slice(start + 7).trim();
      mainContent = "";
      isThinking = true;
    }
  }
  return { thinking, mainContent, isThinking };
}

// Custom assistant message bubble that uses Avatar Sticker icon
function MessageBubble({ msg }: { msg: UIMessage }) {
  const isUser = msg.role === "user";
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const { thinking, mainContent, isThinking } = parseMessageContent(msg.content);

  // Auto-collapse accordion when thinking is done and main content starts streaming
  useEffect(() => {
    if (mainContent && !isThinking) {
      setIsAccordionOpen(false);
    }
  }, [mainContent, isThinking]);

  if (!isUser && !msg.content && msg.streaming) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-2 mt-0.5 overflow-hidden border border-slate-700 bg-slate-900"
        >
          <img src="/avatar_sticker.png" alt="AI Assistant" className="w-full h-full object-cover" />
        </div>
      )}
      <div
        className="max-w-[80%] text-sm leading-relaxed"
        style={{
          background: isUser
            ? "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(255,46,151,0.1))"
            : "var(--bg-card)",
          border: `1px solid ${isUser ? "rgba(0,240,255,0.3)" : "var(--border-subtle)"}`,
          color: "var(--text-primary)",
          padding: "0.625rem 0.875rem",
          borderRadius: "2px",
          borderTopRightRadius: isUser ? 0 : "2px",
          borderTopLeftRadius: isUser ? "2px" : 0,
          wordBreak: "break-word",
        }}
      >
        {/* Render Thinking Process if present */}
        {thinking && (
          <div className="mb-2">
            <button
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-400 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 rounded px-2 py-0.5 transition-colors cursor-pointer select-none"
              style={{ outline: "none", background: "transparent", border: "none" }}
            >
              <span className={`inline-block transition-transform duration-200 ${isAccordionOpen ? "rotate-90" : ""}`}>▶</span>
              <span>Thinking Process</span>
              {isThinking && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
            {isAccordionOpen && (
              <div className="mt-1.5 pl-2.5 border-l border-slate-700 text-[11px] text-slate-400 italic font-mono whitespace-pre-wrap leading-normal">
                {thinking}
                {isThinking && <span className="streaming-cursor"></span>}
              </div>
            )}
          </div>
        )}

        {/* Render Main Content */}
        {mainContent && (
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{
              __html: getHtmlContent(mainContent, msg.streaming && !isThinking),
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([WELCOME_MSG]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<"retrieving" | "reranking" | null>(null);
  const [sessionId, setSessionIdState] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animation flow step state:
  // - 'flying': Spaceship is landing at the bottom right corner (2.8s)
  // - 'avatar_emerging': Avatar starts coming out of the spaceship (1.0s)
  // - 'spaceship_fading': Spaceship fades out (0.8s)
  // - 'clouds_appearing': The cloud bubbles appear one by one from smaller to bigger (1.4s total)
  // - 'message_appearing': The text message appears in the big cloud bubble
  const [animationStep, setAnimationStep] = useState<
    'flying' | 'avatar_emerging' | 'spaceship_fading' | 'clouds_appearing' | 'message_appearing'
  >('flying');
  const [isStickerDismissed, setIsStickerDismissed] = useState(false);

  // Triggered when spaceship lands at bottom right corner
  const handleSpaceshipLanded = () => {
    setAnimationStep('avatar_emerging');
  };

  // Step-by-step sequential animation timers
  useEffect(() => {
    if (isStickerDismissed || isOpen) return;

    if (animationStep === 'avatar_emerging') {
      const timer = setTimeout(() => {
        setAnimationStep('clouds_appearing');
      }, 1000); // 1.0s avatar emerging duration, then proceed to clouds
      return () => clearTimeout(timer);
    }

    if (animationStep === 'spaceship_fading') {
      const timer = setTimeout(() => {
        setAnimationStep('clouds_appearing');
      }, 800); // 0.8s spaceship fade out duration
      return () => clearTimeout(timer);
    }

    if (animationStep === 'clouds_appearing') {
      const timer = setTimeout(() => {
        setAnimationStep('message_appearing');
      }, 1400); // 1.4s for cloud bubbles (smallest -> medium -> big) to finish scaling
      return () => clearTimeout(timer);
    }
  }, [animationStep, isStickerDismissed, isOpen]);

  // 15-second auto-collapse timer starting only after message is shown
  useEffect(() => {
    if (animationStep === 'message_appearing' && !isStickerDismissed && !isOpen) {
      const timer = setTimeout(() => {
        setIsStickerDismissed(true);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [animationStep, isStickerDismissed, isOpen]);

  const dismissSticker = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStickerDismissed(true);
    setAnimationStep('message_appearing'); // bypass step sequences safely
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setIsStickerDismissed(true);
    setAnimationStep('message_appearing'); // bypass step sequences safely
  };

  // Initialize session ID and fetch visitor info
  useEffect(() => {
    const stored = localStorage.getItem("portfolio_chat_session");
    const sid = stored || crypto.randomUUID();
    if (!stored) localStorage.setItem("portfolio_chat_session", sid);
    setSessionIdState(sid);

    // Fetch visitor info in background (non-blocking)
    getVisitorInfo().then(setVisitorInfo).catch(() => {});

    // Log page_view event to backend analytics
    logAnalyticsEvent("page_view", { url: window.location.pathname }).catch(() => {});

    // Retrieve backend history if backend is active
    getChatHistory().then((history) => {
      if (history && history.length > 0) {
        // Map chat messages to UIMessages
        const uiMsgs: UIMessage[] = history.map((m, index) => ({
          id: `hist-${index}`,
          role: m.role as "user" | "assistant",
          content: m.content
        }));
        setMessages([WELCOME_MSG, ...uiMsgs]);
        setChatHistory(history);
      }
    }).catch(() => {});
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      const query = text.trim();

      setShowSuggestions(false);
      setError(null);

      // Add user message
      const userMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: query },
      ]);
      setInput("");
      setIsLoading(true);
      setStatusText("retrieving");

      // RAG: retrieve relevant context from the document tree (client-side)
      const context = retrieveContext(query, docTree);

      // Create streaming assistant message
      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", streaming: true },
      ]);

      // Stream from OpenRouter
      await streamChat(context, chatHistory, query, {
        onStatus(status) {
          setStatusText(status);
        },

        onToken(token) {
          setStatusText(null);
          setMessages((prev) =>
              prev.map((m) =>
                  m.id === assistantMsgId
                      ? { ...m, content: m.content + token }
                      : m
              )
          );
        },

        onDone(fullText) {
          setStatusText(null);
          // Finalize the streaming message
          setMessages((prev) =>
              prev.map((m) =>
                  m.id === assistantMsgId
                      ? { ...m, content: fullText, streaming: false }
                      : m
              )
          );
          setIsLoading(false);

          // Update chat history for context
          const now = new Date().toISOString();
          const newMsgs: ChatMessage[] = [
            { role: "user", content: query, timestamp: now },
            { role: "assistant", content: fullText, timestamp: now },
          ];
          setChatHistory((prev) => [...prev, ...newMsgs]);
        },

        onError(errorMsg) {
          setStatusText(null);
          // Remove the empty streaming message
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
          setError(errorMsg);
          setIsLoading(false);
        },
      });
    },
    [isLoading, chatHistory, sessionId, visitorInfo]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
      <>
        {/* Chat Panel */}
        <AnimatePresence>
          {isOpen && (
              <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="fixed bottom-24 right-5 z-50 flex flex-col"
                  style={{
                    width: "min(380px, calc(100vw - 2.5rem))",
                    height: "520px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--accent-cyan)",
                    boxShadow:
                        "0 0 40px rgba(0,240,255,0.15), 0 20px 60px rgba(0,0,0,0.6)",
                    borderRadius: "4px",
                  }}
              >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                    style={{
                      background:
                          "linear-gradient(135deg, rgba(0,240,255,0.1), rgba(255,46,151,0.08))",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-700 bg-slate-900">
                      <img src="/avatar_sticker.png" alt="AI Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p
                          className="font-orbitron font-bold text-xs"
                          style={{ color: "var(--accent-cyan)" }}
                      >
                        Rohan&apos;s Portfolio Assistant
                      </p>
                    </div>
                  </div>
                  <button
                      onClick={() => setIsOpen(false)}
                      className="text-lg hover:opacity-70 transition-opacity"
                      style={{ color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer" }}
                      aria-label="Close chat"
                  >
                    ✕
                  </button>
                </div>

                {/* Messages */}
                <div
                    className="flex-1 overflow-y-auto p-4"
                    style={{ overscrollBehavior: "contain" }}
                >
                  {messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                  ))}

                  {isLoading && statusText && (
                      <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 mb-3"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-700 bg-slate-900">
                          <img src="/avatar_sticker.png" alt="AI Assistant" className="w-full h-full object-cover" />
                        </div>
                        <div
                            className="flex items-center gap-2 px-3 py-1.5"
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "2px",
                              color: "var(--text-muted)",
                              fontSize: "11px",
                              fontFamily: "'Fira Code', monospace",
                            }}
                        >
                          <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          <span>
                            {statusText === "retrieving" ? "Retrieving knowledge..." : "Reranking context..."}
                          </span>
                        </div>
                      </motion.div>
                  )}

                  {error && (
                      <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-center mb-3 px-3 py-2"
                          style={{
                            color: "var(--accent-pink)",
                            background: "rgba(255,46,151,0.08)",
                            border: "1px solid rgba(255,46,151,0.2)",
                          }}
                      >
                        ⚠ {error}
                      </motion.p>
                  )}

                  {/* Suggested questions */}
                  {showSuggestions && messages.length === 1 && (
                      <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2"
                      >
                        <p
                            className="text-xs mb-2"
                            style={{ color: "var(--text-muted)" }}
                        >
                          Try asking:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {SUGGESTED_QUESTIONS.map((q) => (
                              <button
                                  key={q}
                                  onClick={() => sendMessage(q)}
                                  className="text-xs px-3 py-1.5 transition-all hover:opacity-80"
                                  style={{
                                    background: "rgba(0,240,255,0.08)",
                                    border: "1px solid rgba(0,240,255,0.2)",
                                    color: "var(--accent-cyan)",
                                    borderRadius: "2px",
                                    cursor: "pointer",
                                    fontFamily: "'Fira Code', monospace",
                                  }}
                              >
                                {q}
                              </button>
                          ))}
                        </div>
                      </motion.div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    className="flex gap-2 p-3 flex-shrink-0"
                    style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about Rohan…"
                      disabled={isLoading}
                      className="flex-1 bg-transparent text-sm outline-none px-3 py-2"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        fontFamily: "'JetBrains Mono', monospace",
                        borderRadius: "2px",
                      }}
                  />
                  <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="px-4 py-2 text-sm font-bold transition-all disabled:opacity-40"
                      style={{
                        background:
                            "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                        color: "var(--bg-primary)",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "'Fira Code', monospace",
                        borderRadius: "2px",
                        minWidth: "52px",
                      }}
                  >
                    {isLoading ? "…" : "▶"}
                  </button>
                </form>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Tooltip (shown on badge hover) */}
        <AnimatePresence>
          {isHovered && !isOpen && isStickerDismissed && (
              <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="fixed bottom-[84px] right-5 z-50 px-3 py-1.5 text-xs font-orbitron font-semibold"
                  style={{
                    background: "rgba(10, 25, 47, 0.9)",
                    border: "1px solid var(--accent-cyan)",
                    color: "var(--accent-cyan)",
                    boxShadow: "0 0 15px rgba(0,240,255,0.2)",
                    borderRadius: "2px",
                    pointerEvents: "none",
                  }}
              >
                Rohan&apos;s Profile Assistant
              </motion.div>
          )}
        </AnimatePresence>

        {/* Flying Spaceship entrance & fade out */}
        <AnimatePresence>
          {!isStickerDismissed && !isOpen && (animationStep === 'flying' || animationStep === 'avatar_emerging' || animationStep === 'spaceship_fading') && (
            <motion.div
              initial={
                animationStep === 'flying'
                  ? { x: "-90vw", y: "-90vh", scale: 0.2, rotate: 45, opacity: 0 }
                  : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }
              }
              animate={
                (animationStep === 'spaceship_fading' || animationStep === 'avatar_emerging')
                  ? { opacity: 0, scale: 0.9, x: 0, y: 0, rotate: 0 }
                  : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }
              }
              exit={{ opacity: 0 }}
              transition={
                animationStep === 'flying'
                  ? { duration: 2.8, ease: "easeOut" }
                  : animationStep === 'avatar_emerging'
                  ? { duration: 1.0 }
                  : { duration: 0 }
              }
              onAnimationComplete={() => {
                if (animationStep === 'flying') {
                  handleSpaceshipLanded();
                }
              }}
              className="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-[51] pointer-events-none select-none w-[80px] h-[80px] md:w-[14vw] md:h-[14vw] md:min-w-[140px] md:min-h-[140px] md:max-w-[280px] md:max-h-[280px]"
            >
              <img
                src="/spaceship.png"
                alt="Spaceship"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waving Avatar & Cloud Bubbles Setup */}
        <AnimatePresence>
          {!isStickerDismissed && !isOpen && animationStep !== 'flying' && (
            <div
              className="fixed bottom-4 right-4 z-50 pointer-events-none select-none flex items-end justify-end"
              style={{
                width: "min(460px, calc(100vw - 2rem))",
                height: "320px",
              }}
            >
              <div className="relative w-full h-full">
                {/* Waving Avatar Sticker */}
                <motion.div
                    initial={{ scale: 0.1, y: -70, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    onClick={handleOpenChat}
                    className="absolute bottom-0 right-0 cursor-pointer pointer-events-auto w-[140px] h-[140px] md:w-[180px] md:h-[180px] z-[52]"
                >
                  <img
                      src="/avatar_sticker.png"
                      alt="Rohan's Waving Avatar Sticker"
                      className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,240,255,0.45)] hover:scale-105 transition-transform"
                  />
                </motion.div>

                {/* Cloud Bubbles */}
                <AnimatePresence>
                  {(animationStep === 'clouds_appearing' || animationStep === 'message_appearing') && (
                    <>
                      {/* Smallest tail cloud (starting just above the index finger of the avatar) */}
                      <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="absolute backdrop-blur-md z-10 right-[95px] bottom-[102px] md:right-[122px] md:bottom-[132px]"
                          style={{
                            width: "12px",
                            height: "10px",
                            background: "rgba(224, 252, 255, 0.95)",
                            borderRadius: "8px 10px 6px 8px / 8px 8px 6px 6px",
                            transformOrigin: "bottom left"
                          }}
                      />

                      {/* Medium tail cloud */}
                      <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
                          className="absolute backdrop-blur-md z-10 right-[110px] bottom-[118px] md:right-[141px] md:bottom-[152px]"
                          style={{
                            width: "18px",
                            height: "16px",
                            background: "rgba(224, 252, 255, 0.95)",
                            borderRadius: "14px 18px 10px 14px / 12px 14px 10px 12px",
                            transformOrigin: "bottom left"
                          }}
                      />

                      {/* Main Cloud Body & Puff Bumps */}
                      <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                          className="absolute z-10 right-[124px] bottom-[134px] md:right-[158px] md:bottom-[172px] w-[190px] md:w-[220px]"
                          style={{
                            transformOrigin: "bottom right",
                            filter: "drop-shadow(0 0 8px rgba(0, 240, 255, 0.35)) drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5))",
                          }}
                      >
                        {/* Main Cloud Box */}
                        <div
                            className="p-4 backdrop-blur-md relative z-10 cursor-pointer pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChat();
                            }}
                            style={{
                              background: "rgba(224, 252, 255, 0.95)",
                              borderRadius: "24px",
                              color: "#0a192f",
                              fontSize: "0.85rem",
                              lineHeight: "1.35",
                            }}
                        >
                          {/* Message content fades in only in message_appearing step */}
                          <motion.div
                              initial={{ opacity: 0 }}
                              animate={animationStep === 'message_appearing' ? { opacity: 1 } : { opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="relative z-20 w-full h-full"
                          >
                            <button
                                onClick={dismissSticker}
                                className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-[11px] hover:text-black transition-colors z-20"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#64748b",
                                  cursor: "pointer",
                                  padding: 0,
                                  margin: "4px"
                                }}
                                aria-label="Dismiss greeting"
                            >
                              ✕
                            </button>
                            <p className="pr-3 font-semibold relative z-10">Hi, how can I assist with Rohan&apos;s profile?</p>
                          </motion.div>
                        </div>

                        {/* Cloud Puff Bumps */}
                        <div
                            className="absolute rounded-full backdrop-blur-md z-0"
                            style={{
                              top: "-16px",
                              left: "30px",
                              width: "48px",
                              height: "48px",
                              background: "rgba(224, 252, 255, 0.95)",
                            }}
                        />
                        <div
                            className="absolute rounded-full backdrop-blur-md z-0"
                            style={{
                              top: "-24px",
                              right: "40px",
                              width: "56px",
                              height: "56px",
                              background: "rgba(224, 252, 255, 0.95)",
                            }}
                        />
                        <div
                            className="absolute rounded-full backdrop-blur-md z-0"
                            style={{
                              top: "12px",
                              left: "-12px",
                              width: "40px",
                              height: "40px",
                              background: "rgba(224, 252, 255, 0.95)",
                            }}
                        />
                        <div
                            className="absolute rounded-full backdrop-blur-md z-0"
                            style={{
                              top: "18px",
                              right: "-12px",
                              width: "40px",
                              height: "40px",
                              background: "rgba(224, 252, 255, 0.95)",
                            }}
                        />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </AnimatePresence>
        {/* Small Circular Spaceship Badge (collapsed state) */}
        <AnimatePresence>
          {isStickerDismissed && !isOpen && (
              <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    y: [0, -4, 0] // Gentle bobbing
                  }}
                  transition={{
                    y: {
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut"
                    }
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={handleOpenChat}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-50 cursor-pointer select-none animate-pulse-glow rounded-full w-[56px] h-[56px]"
              >
                {/* Holographic Glowing Border Container */}
                <div
                    className="w-full h-full rounded-full p-[2px] relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                      boxShadow: "0 0 20px rgba(0, 240, 255, 0.4), 0 0 35px rgba(255, 46, 151, 0.2)",
                    }}
                >
                  {/* Pulse effect */}
                  <span
                      className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{
                        background: "var(--accent-cyan)",
                        animationDuration: "3s"
                      }}
                  />
                  {/* Inner Spaceship Image (dynamic logo in place of profile pic) */}
                  <img
                      src="/spaceship.png"
                      alt="Spaceship Logo"
                      className="w-full h-full object-contain p-1.5 rounded-full bg-slate-900 border border-slate-950"
                  />
                </div>
                <span
                    className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full animate-pulse"
                    style={{
                      background: "var(--accent-green)",
                      boxShadow: "0 0 8px var(--accent-green)",
                    }}
                />
              </motion.div>
          )}
        </AnimatePresence>
      </>
  );
}
