import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getCompanion } from "@/lib/companions";
import MessageBubble from "@/components/companion/MessageBubble";
import ChatInput from "@/components/companion/ChatInput";
import { ArrowLeft } from "lucide-react";

const SUGGESTIONS = [
  "Hey, how's your day going?",
  "I'm feeling a bit overwhelmed today",
  "Tell me something good",
  "I want to get something off my chest",
];

// After every reply, silently extract memorable facts in the background
async function extractMemories(companionId, recentExchange, existingMemories) {
  const existingKeys = existingMemories.map((m) => m.key).join(", ");
  const prompt = `You are a memory extraction system for a personal AI companion named ${companionId}.

Read this conversation exchange and extract any facts worth remembering long-term about the user — things like their name, job, relationships, struggles, places, pets, hobbies, fears, goals, or recurring themes.

Only extract facts that are clearly stated, not assumed. Skip anything vague or trivial.
Do NOT re-extract facts already covered by these existing memory keys: ${existingKeys || "none yet"}.

Return JSON like:
{
  "memories": [
    { "key": "short_label", "value": "what to remember about the user" }
  ]
}

Return an empty array if nothing new is worth saving.

Exchange:
${recentExchange}`;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          memories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                value: { type: "string" },
              },
            },
          },
        },
      },
    });

    const memories = result?.memories || [];
    for (const mem of memories) {
      if (!mem.key || !mem.value) continue;
      // Upsert: if key exists, update it; otherwise create
      const existing = existingMemories.find((m) => m.key === mem.key);
      if (existing) {
        await base44.entities.Memory.update(existing.id, { value: mem.value });
      } else {
        await base44.entities.Memory.create({
          companion_id: companionId,
          key: mem.key,
          value: mem.value,
        });
      }
    }
    return memories;
  } catch (err) {
    console.error("Memory extraction failed:", err);
    return [];
  }
}

export default function Chat() {
  const { companionId } = useParams();
  const navigate = useNavigate();
  const companion = getCompanion(companionId);

  const [messages, setMessages] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!companion) { setLoading(false); return; }
    try {
      const [msgData, memData] = await Promise.all([
        base44.entities.Message.filter({ companion_id: companion.id }, "-created_date", 200),
        base44.entities.Memory.filter({ companion_id: companion.id }),
      ]);
      setMessages([...msgData].reverse());
      setMemories(memData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [companion]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  if (!companion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <p className="text-muted-foreground mb-4">Companion not found.</p>
        <button onClick={() => navigate("/")} className="text-primary hover:underline">
          Back home
        </button>
      </div>
    );
  }

  const buildPrompt = (history, mems) => {
    const memoryBlock =
      mems.length > 0
        ? `\n\n--- What you remember about this person ---\n${mems
            .map((m) => `• ${m.key}: ${m.value}`)
            .join("\n")}`
        : "";

    return `${companion.personality}${memoryBlock}

--- Conversation so far ---
${history}

Respond as ${companion.name}. Reply with only your message — no prefix, no quotes.`;
  };

  const handleSend = async (text) => {
    const userMsg = { role: "user", content: text, companion_id: companion.id };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setThinking(true);

    try {
      await base44.entities.Message.create(userMsg);

      const history = updatedMessages
        .slice(-20)
        .map((m) => `${m.role === "user" ? "Me" : companion.name}: ${m.content}`)
        .join("\n");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(history, memories),
      });

      const replyText =
        typeof result === "string"
          ? result
          : result?.output || result?.response || JSON.stringify(result);

      const reply = {
        role: "assistant",
        content: replyText.trim(),
        companion_id: companion.id,
      };

      setMessages((prev) => [...prev, reply]);
      await base44.entities.Message.create(reply);

      // Extract memories in the background — don't await, don't block UI
      const recentExchange = `Me: ${text}\n${companion.name}: ${replyText.trim()}`;
      extractMemories(companion.id, recentExchange, memories).then((newMems) => {
        if (newMems.length > 0) {
          setMemories((prev) => {
            const updated = [...prev];
            for (const nm of newMems) {
              const idx = updated.findIndex((m) => m.key === nm.key);
              if (idx >= 0) updated[idx] = { ...updated[idx], value: nm.value };
              else updated.push({ companion_id: companion.id, ...nm });
            }
            return updated;
          });
        }
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I lost my train of thought for a moment — could you say that again?",
          companion_id: companion.id,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear your conversation? Memories are kept.")) return;
    try {
      await base44.entities.Message.deleteMany({ companion_id: companion.id });
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={companion.image}
                  alt={companion.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
              </div>
              <div>
                <h1 className="font-heading text-base font-semibold leading-none">
                  {companion.name}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {thinking ? "typing…" : companion.tagline.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {memories.length > 0 && (
              <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted" title={memories.map(m => `${m.key}: ${m.value}`).join('\n')}>
                {memories.length} {memories.length === 1 ? "memory" : "memories"}
              </span>
            )}
            {hasMessages && (
              <button
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : !hasMessages ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <img
                src={companion.image}
                alt={companion.name}
                className="w-20 h-20 rounded-full object-cover mb-5 shadow-lg"
              />
              <h2 className="font-heading text-2xl font-semibold mb-2">
                {memories.length > 0 ? `Good to see you again` : `Hi, I'm ${companion.name}`}
              </h2>
              <p className="text-muted-foreground text-[15px] max-w-xs leading-relaxed mb-8">
                {memories.length > 0
                  ? `${companion.name} remembers you. Pick up where you left off.`
                  : `${companion.subtitle}. ${companion.description}`}
              </p>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-left text-[14px] bg-card border border-border rounded-2xl px-4 py-3 hover:border-primary/40 hover:bg-muted transition-all"
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
                  <img
                    src={companion.image}
                    alt={companion.name}
                    className="flex-shrink-0 w-9 h-9 rounded-full object-cover mt-0.5"
                  />
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