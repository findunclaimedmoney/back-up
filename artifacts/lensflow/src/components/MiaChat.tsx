import { useState, useRef, useEffect, useCallback } from "react";
import { X, MessageCircle, Send, Loader2, Bot, Mic, MicOff, Volume2, VolumeX, Mail, Check, ArrowLeft } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function createConversation(): Promise<number> {
  const res = await fetch(`${BASE}/api/anthropic/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Morgan AI Chat" }),
  });
  if (!res.ok) throw new Error("Failed to start conversation");
  const data = (await res.json()) as { id: number };
  return data.id;
}

function stripForTTS(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

export default function MorganChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [initError, setInitError] = useState(false);
  const [unread, setUnread] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketError, setTicketError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (open && conversationId === null && !initError) {
      createConversation()
        .then((id) => {
          setConversationId(id);
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: "G'day! I'm Morgan, founder of LensFlow AI 👋\n\nI'm here to help you get the most out of the pipeline. Ask me anything about your listings, scripts, or how the system works.",
          }]);
        })
        .catch(() => setInitError(true));
    }
  }, [open, conversationId, initError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlayingId(null);
  }

  async function speakText(text: string, msgId: string) {
    stopAudio();
    const clean = stripForTTS(text);
    if (!clean) return;
    try {
      setPlayingId(msgId);
      const res = await fetch(`${BASE}/api/elevenlabs/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      });
      if (!res.ok) { setPlayingId(null); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPlayingId(null); URL.revokeObjectURL(url); };
      audio.onerror = () => { setPlayingId(null); URL.revokeObjectURL(url); };
      await audio.play();
    } catch {
      setPlayingId(null);
    }
  }

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || streaming || !conversationId) return;

    setInput("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let fullResponse = "";

    try {
      const res = await fetch(`${BASE}/api/anthropic/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
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
              fullResponse += payload.content;
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + payload.content } : m));
            }
            if (payload.done || payload.error) break;
          } catch { /* ignore */ }
        }
      }

      if (autoSpeak && fullResponse) {
        void speakText(fullResponse, assistantId);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: "Sorry, something went wrong. Please try again." } : m));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      if (!open) setUnread(true);
    }
  }, [input, streaming, conversationId, open, autoSpeak]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  };

  function toggleMic() {
    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "en-AU";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        const transcript: string = e.results[0][0].transcript;
        setListening(false);
        void sendMessage(transcript);
      };
      rec.onerror = () => { setListening(false); recognitionRef.current = null; };
      rec.onend = () => { setListening(false); recognitionRef.current = null; };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } else {
      void startMediaRecording();
    }
  }

  async function startMediaRecording() {
    if (typeof MediaRecorder === "undefined") { setListening(false); return; }
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const activeStream = stream;
      const mr = new MediaRecorder(activeStream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        activeStream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || "audio/webm" });
        mediaRecorderRef.current = null;
        void transcribeAudio(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setListening(true);
    } catch {
      stream?.getTracks().forEach((t) => t.stop());
      setListening(false);
    }
  }

  async function transcribeAudio(blob: Blob) {
    setTranscribing(true);
    try {
      const res = await fetch(`${BASE}/api/elevenlabs/stt`, {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm" },
        body: blob,
      });
      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        const text = (data.text ?? "").trim();
        if (text) void sendMessage(text);
      }
    } catch {
      /* ignore */
    } finally {
      setTranscribing(false);
    }
  }

  async function submitTicket() {
    const email = ticketEmail.trim();
    const message = ticketMessage.trim();
    if (!email || !message || ticketSubmitting) return;
    setTicketSubmitting(true);
    setTicketError(false);
    try {
      const res = await fetch(`${BASE}/api/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message,
          name: ticketName.trim() || undefined,
          conversationId: conversationId ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setTicketSubmitted(true);
      setTicketName("");
      setTicketEmail("");
      setTicketMessage("");
    } catch {
      setTicketError(true);
    } finally {
      setTicketSubmitting(false);
    }
  }

  function renderMessage(content: string) {
    const parts = content.split(/(\*\*[^*]+\*\*|\[.*?\]\(.*?\)|https?:\/\/\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
      const linkMatch = part.match(/^\[(.+?)\]\((https?:\/\/.+?)\)$/);
      if (linkMatch) return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline text-blue-300">{linkMatch[1]}</a>;
      if (part.match(/^https?:\/\//)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-300 break-all">{part}</a>;
      return <span key={i}>{part}</span>;
    });
  }

  const hasVoiceInput = typeof window !== "undefined" && (!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) || (typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia));

  return (
    <>
      <button
        onClick={() => { setOpen(true); setUnread(false); }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full shadow-2xl shadow-violet-900/50 transition-all duration-300 hover:scale-105 active:scale-95"
        style={{ display: open ? "none" : "flex", padding: "14px 20px" }}
        aria-label="Chat with Morgan"
      >
        <MessageCircle size={20} className="shrink-0" />
        <span className="text-sm font-semibold whitespace-nowrap">Ask Morgan</span>
        {unread && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 bg-[#0f0f1a]" style={{ height: "540px" }}>
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-900/80 to-indigo-900/80 border-b border-white/10 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Morgan</p>
              <p className="text-[11px] text-violet-300">LensFlow AI · Pipeline Assistant</p>
            </div>
            <button
              onClick={() => setShowTicket(true)}
              className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              title="Leave a message"
            >
              <Mail size={16} />
            </button>
            <button
              onClick={() => { setAutoSpeak((s) => { if (s) stopAudio(); return !s; }); }}
              className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              title={autoSpeak ? "Mute Morgan's voice" : "Unmute Morgan's voice"}
            >
              {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button onClick={() => { setOpen(false); stopAudio(); }} className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          {showTicket && (
            <div className="absolute inset-0 z-20 bg-[#0f0f1a] flex flex-col">
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-900/80 to-indigo-900/80 border-b border-white/10 shrink-0">
                <button onClick={() => setShowTicket(false)} className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10" aria-label="Back to chat">
                  <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Leave a message</p>
                  <p className="text-[11px] text-violet-300">Our team will email you back</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {ticketSubmitted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center">
                      <Check size={24} className="text-violet-400" />
                    </div>
                    <p className="text-white font-semibold">Message sent!</p>
                    <p className="text-white/50 text-sm max-w-[260px]">Thanks — our support team has your message and will email you back, usually within one business day.</p>
                    <button onClick={() => { setShowTicket(false); setTicketSubmitted(false); }} className="mt-2 text-violet-400 underline text-sm">Back to chat</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-white/60 text-sm">Can't find what you need? Leave your details and our team will get back to you by email.</p>
                    <input
                      type="text"
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      placeholder="Your name (optional)"
                      className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                    />
                    <input
                      type="email"
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      placeholder="Your email *"
                      className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                    />
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="How can we help? *"
                      rows={5}
                      className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 resize-none"
                    />
                    {ticketError && <p className="text-red-400 text-xs">Something went wrong. Please try again.</p>}
                    <button
                      onClick={() => void submitTicket()}
                      disabled={ticketSubmitting || !ticketEmail.trim() || !ticketMessage.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                    >
                      {ticketSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      Send message
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {initError ? (
              <div className="text-center text-sm text-red-400 mt-8">
                <p>Couldn't connect to Morgan right now.</p>
                <button className="mt-2 text-violet-400 underline text-xs" onClick={() => { setInitError(false); setConversationId(null); }}>Try again</button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full"><Loader2 size={20} className="text-violet-400 animate-spin" /></div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={13} className="text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[82%]">
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.role === "user" ? "bg-violet-600 text-white rounded-tr-sm" : "bg-white/8 text-white/90 rounded-tl-sm border border-white/8"}`}>
                      {msg.role === "assistant" ? (
                        msg.content === "" ? (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        ) : renderMessage(msg.content)
                      ) : msg.content}
                    </div>
                    {msg.role === "assistant" && msg.content && (
                      <button
                        onClick={() => playingId === msg.id ? stopAudio() : void speakText(msg.content, msg.id)}
                        className="self-start ml-0.5 flex items-center gap-1 text-[10px] text-white/30 hover:text-violet-400 transition-colors"
                        title={playingId === msg.id ? "Stop" : "Play Morgan's voice"}
                      >
                        {playingId === msg.id ? (
                          <><span className="flex gap-0.5 items-end h-3"><span className="w-0.5 bg-violet-400 animate-[equalize_0.6s_ease-in-out_infinite]" style={{ height: "60%", animationDelay: "0ms" }} /><span className="w-0.5 bg-violet-400 animate-[equalize_0.6s_ease-in-out_infinite]" style={{ height: "100%", animationDelay: "0.15s" }} /><span className="w-0.5 bg-violet-400 animate-[equalize_0.6s_ease-in-out_infinite]" style={{ height: "40%", animationDelay: "0.3s" }} /></span> Playing…</>
                        ) : (
                          <><Volume2 size={11} /> Hear Morgan</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && !streaming && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap shrink-0">
              {[
                "🏠 Find a property for my client",
                "How does the pipeline work?",
                "What voices are available?",
                "Find mortgagee properties in Brisbane under $900k",
              ].map((q) => (
                <button key={q} onClick={() => { void sendMessage(q); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-violet-500/40 text-violet-300 hover:bg-violet-500/20 transition-colors">{q}</button>
              ))}
            </div>
          )}

          <div className="px-3 pb-3 pt-2 border-t border-white/8 shrink-0">
            <div className="flex items-center gap-2 bg-white/6 rounded-xl border border-white/10 px-3 py-2">
              {hasVoiceInput && (
                <button
                  onClick={toggleMic}
                  disabled={transcribing}
                  className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${listening ? "bg-red-600 hover:bg-red-500" : "hover:bg-white/10 text-white/40 hover:text-violet-400"}`}
                  title={listening ? "Stop listening" : "Speak to Morgan"}
                >
                  {transcribing ? <Loader2 size={13} className="text-violet-400 animate-spin" /> : listening ? <MicOff size={13} className="text-white animate-pulse" /> : <Mic size={13} />}
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={transcribing ? "Transcribing…" : listening ? "Listening…" : "Ask Morgan anything…"}
                disabled={streaming || !conversationId || initError || listening || transcribing}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none min-w-0 disabled:opacity-50"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || streaming || !conversationId || initError}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                {streaming ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-white/20 mt-1.5">Powered by LensFlow AI · Claude 4 · ElevenLabs voice</p>
          </div>
        </div>
      )}
    </>
  );
}
