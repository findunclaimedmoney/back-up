import { useState, useRef, useEffect, useCallback } from "react";
import { X, MessageCircle, Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const WELCOME =
  "Hi, I'm Mia — your MissingCash assistant 👋\n\nI can help you search for unclaimed money, walk you through the claim process, or answer questions about finance with our partner Stratton Finance. What would you like to know?";

const SUGGESTIONS = [
  "How do I find unclaimed money?",
  "Is the search really free?",
  "Tell me about car loans",
  "How does claiming work?",
];

function renderMessage(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*|\[.*?\]\(.*?\)|https?:\/\/\S+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const linkMatch = part.match(/^\[(.+?)\]\((https?:\/\/.+?)\)$/);
    if (linkMatch)
      return (
        <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {linkMatch[1]}
        </a>
      );
    if (part.match(/^https?:\/\//))
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
          {part}
        </a>
      );
    return <span key={i}>{part}</span>;
  });
}

export default function MiaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || streaming) return;

      setInput("");
      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
      const history = [...messages, userMsg].filter((m) => m.id !== "welcome");
      setMessages((prev) => [...prev, userMsg]);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${BASE}/api/mia/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
              if (payload.content) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + payload.content } : m)),
                );
              }
              if (payload.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: "Sorry, I'm having trouble right now. Please try again in a moment." } : m,
                  ),
                );
              }
              if (payload.done || payload.error) break;
            } catch {
              /* ignore partial JSON */
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "Sorry, something went wrong. Please try again, or email support@missingcash.com.au." }
                : m,
            ),
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
        if (!open) setUnread(true);
      }
    },
    [input, streaming, messages, open],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const showSuggestions = messages.filter((m) => m.id !== "welcome").length === 0;

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => {
          setOpen(true);
          setUnread(false);
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95 font-bold"
        style={{ display: open ? "none" : "flex", padding: "14px 20px" }}
        aria-label="Chat with Mia"
        data-testid="button-open-mia"
      >
        <MessageCircle size={20} className="shrink-0" />
        <span className="text-sm whitespace-nowrap">Ask Mia</span>
        {unread && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-border bg-card"
          style={{ height: "560px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary border-b border-border shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Mia</p>
              <p className="text-[11px] text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> MissingCash assistant
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Close chat"
              data-testid="button-close-mia"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm border border-border"
                  }`}
                >
                  {m.content === "" && streaming ? (
                    <span className="inline-flex gap-1 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                    </span>
                  ) : (
                    renderMessage(m.content)
                  )}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void sendMessage(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-white transition-colors"
                    data-testid={`suggestion-${s.slice(0, 10)}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 shrink-0 bg-card">
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Mia anything..."
                className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                data-testid="input-mia-message"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || streaming}
                className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                aria-label="Send message"
                data-testid="button-send-mia"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Mia is an AI assistant and may occasionally be inaccurate.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
