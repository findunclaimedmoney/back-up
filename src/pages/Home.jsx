import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import MessageBubble from "@/components/companion/MessageBubble";
import ChatInput from "@/components/companion/ChatInput";
import { Sparkles } from "lucide-react";

const COMPANION_PROMPT = `You are Solis, a warm, thoughtful personal companion. You are not a generic assistant or a productivity tool — you are a genuine friend who cares.

Your personality:
- Warm, empathetic, and present. You listen before you respond.
- Curious about the person's life, feelings, and thoughts. You ask gentle questions.
- Conversational and natural, like texting a close friend. Keep messages concise and readable — usually 1-4 sentences unless the topic truly calls for more.
- Honest but kind. You offer perspective without being preachy.
- You have a quiet warmth and gentle optimism. You find small moments of light.

How you talk:
- Never introduce yourself or explain what you are unless asked.
- Don't use headers, bullet points, or lists. Just natural conversation.
- Mirror the person's energy — if they're upbeat, be playful; if they're low, be gentle and grounding.
- Remember what they've shared earlier in the conversation and reference it naturally.
- Avoid clichés like "I'm sorry to hear that" or "That sounds interesting." Respond like a real person would.`;

const SUGGESTIONS = [
  "Hey, how's your day going?",
  "I'm feeling a bit overwhelmed today",
  "Tell me something good",
  "I want to get something off my chest",
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await base44.entities.Message.list("-created_date", 200);
      const sorted = [...data].reverse();
      setMessages(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleSend = async (text) => {
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      await base44.entities.Message.create(userMsg);

      const history = [...messages, userMsg]
        .slice(-20)
        .map((m) => `${m.role === "user" ? "Me" : "Solis"}: ${m.content}`)
        .join("\n");

      const prompt = `${COMPANION_PROMPT}

--- Conversation so far ---
${history}

Respond as Solis. Reply with only your message — no prefix, no quotes.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      const replyText = typeof result === "string" ? result : result?.output || result?.response || JSON.stringify(result);
      const reply = { role: "assistant", content: replyText.trim() };

      setMessages((prev) => [...prev, reply]);
      await base44.entities.Message.create(reply);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I lost my train of thought for a moment — could you say that again?",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear your entire conversation? This can't be undone.")) return;
    try {
      await base44.entities.Message.deleteMany({});
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold text-foreground leading-none">
                Solis
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {thinking ? "typing…" : "your companion"}
              </p>
            </div>
          </div>
          {hasMessages && (
            <button
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : !hasMessages ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center mb-5 shadow-md">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
                Hi, I'm Solis
              </h2>
              <p className="text-muted-foreground text-[15px] max-w-xs leading-relaxed mb-8">
                I'm here whenever you want to talk — about your day, your
                thoughts, or just to have someone listen.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-left text-[14px] text-foreground bg-card border border-border rounded-2xl px-4 py-3 hover:border-primary/40 hover:bg-accent transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}
              {thinking && (
                <div className="flex justify-start gap-2.5">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent flex items-center justify-center mt-0.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="rounded-3xl rounded-bl-lg bg-card border border-border px-5 py-3.5 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "120ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "240ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={thinking || loading} />
    </div>
  );
}