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
                          <><span className="flex gap-0.5 items-end h-3"><span className="w-0.5 bg-violet-400" style={{ height: "60%" }} /><span className="w-0.5 bg-violet-400" style={{ height: "100%" }} /><span className="w-0.5 bg-violet-400" style={{ height: "40%" }} /></span> Playing…</>
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
              {["What's included in Elite?", "How does it work?", "Start free trial"].map((q) => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
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
            <p className="text-center text-[10px] text-white/20 mt-1.5">Powered by LensFlow AI · Claude AI · ElevenLabs voice</p>
          </div>
        </div>
      )}
    </>
  );
}
