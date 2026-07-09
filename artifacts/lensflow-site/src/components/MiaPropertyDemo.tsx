import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Search, MapPin, Bed, Bath, Car, ExternalLink } from "lucide-react";

const DEMO_PROPERTIES = [
  {
    address: "14 Raglan St, Mosman NSW 2088",
    price: "$2,450,000",
    beds: 4, baths: 2, cars: 2,
    land: "612m²",
    tag: null,
  },
  {
    address: "7 Elgin St, Mosman NSW 2088",
    price: "$1,975,000",
    beds: 4, baths: 3, cars: 1,
    land: "540m²",
    tag: "🔴 Mortgagee Sale",
  },
  {
    address: "23 Awaba St, Mosman NSW 2088",
    price: "$2,100,000",
    beds: 5, baths: 2, cars: 2,
    land: "720m²",
    tag: null,
  },
  {
    address: "3/9 Balmoral Ave, Mosman NSW 2088",
    price: "$1,850,000",
    beds: 4, baths: 2, cars: 1,
    land: "490m²",
    tag: "3 days on market",
  },
];

const STAGES = [
  { id: "typing", delay: 600 },
  { id: "sent", delay: 1800 },
  { id: "searching", delay: 2600 },
  { id: "results", delay: 4200 },
];

type Stage = "idle" | "typing" | "sent" | "searching" | "results";

export default function MorganPropertyDemo({ autoPlay = true }: { autoPlay?: boolean }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [shownProps, setShownProps] = useState(0);
  const [inputText, setInputText] = useState("");

  const FULL_INPUT = "My client has a $2M budget — 4-bed house in Mosman, at least 500m² land.";

  useEffect(() => {
    if (!autoPlay) return;
    const t1 = setTimeout(() => setStage("typing"), 800);
    return () => clearTimeout(t1);
  }, [autoPlay]);

  useEffect(() => {
    if (stage !== "typing") return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setInputText(FULL_INPUT.slice(0, i));
      if (i >= FULL_INPUT.length) {
        clearInterval(interval);
        setTimeout(() => setStage("sent"), 400);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (stage !== "sent") return;
    const t = setTimeout(() => setStage("searching"), 700);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== "searching") return;
    const t = setTimeout(() => setStage("results"), 1600);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== "results") return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setShownProps(i);
      if (i >= DEMO_PROPERTIES.length) clearInterval(interval);
    }, 350);
    return () => clearInterval(interval);
  }, [stage]);

  function replay() {
    setStage("idle");
    setInputText("");
    setShownProps(0);
    setTimeout(() => setStage("typing"), 300);
  }

  return (
    <div className="relative w-full max-w-sm mx-auto select-none">
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d1a] shadow-2xl shadow-black/60">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-900/70 to-indigo-900/70 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
            <Bot size={15} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Morgan AI</p>
            <p className="text-[10px] text-violet-300">Property Intelligence · Live</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">Online</span>
          </div>
        </div>

        {/* Messages area */}
        <div className="px-4 py-4 space-y-3 min-h-[340px]">
          {/* Agent message */}
          <AnimatePresence>
            {stage !== "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <div className="max-w-[85%] bg-violet-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs leading-relaxed">
                  {stage === "typing" ? inputText : FULL_INPUT}
                  {stage === "typing" && (
                    <span className="inline-block w-0.5 h-3 bg-white/70 ml-0.5 animate-pulse align-text-bottom" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Searching indicator */}
          <AnimatePresence>
            {(stage === "searching" || stage === "results") && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 items-start"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={11} className="text-white" />
                </div>
                <div className="bg-white/8 border border-white/8 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-white/80 flex items-center gap-2">
                  <Search size={11} className="text-violet-400 shrink-0" />
                  <span className="text-violet-300 font-medium">Searching Domain listings…</span>
                  {stage === "searching" && (
                    <span className="flex gap-0.5 ml-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {stage === "results" && shownProps > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 items-start"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={11} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white/8 border border-white/8 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-white/80 mb-2">
                    Found <span className="text-violet-300 font-semibold">{shownProps} properties</span> matching your client's brief:
                  </div>
                  <div className="space-y-1.5">
                    {DEMO_PROPERTIES.slice(0, shownProps).map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-[10px]"
                      >
                        {p.tag && (
                          <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold mb-1 ${p.tag.includes("Mortgagee") ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                            {p.tag}
                          </span>
                        )}
                        <div className="flex items-start gap-1 text-white/90 font-medium mb-1">
                          <MapPin size={9} className="text-violet-400 mt-0.5 shrink-0" />
                          <span>{p.address}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-violet-300 font-bold">{p.price}</span>
                          <div className="flex items-center gap-2 text-white/50">
                            <span className="flex items-center gap-0.5"><Bed size={8} />{p.beds}</span>
                            <span className="flex items-center gap-0.5"><Bath size={8} />{p.baths}</span>
                            <span className="flex items-center gap-0.5"><Car size={8} />{p.cars}</span>
                            <span>{p.land}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {shownProps >= DEMO_PROPERTIES.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-2 flex items-center gap-1.5 text-[10px] text-violet-400 px-1"
                    >
                      <ExternalLink size={9} />
                      <span>+ direct links to Domain & REA included</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Replay */}
        {stage === "results" && shownProps >= DEMO_PROPERTIES.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="px-4 pb-4 flex justify-center"
          >
            <button
              onClick={replay}
              className="text-[10px] text-white/30 hover:text-violet-400 transition-colors flex items-center gap-1"
            >
              ↺ Watch again
            </button>
          </motion.div>
        )}
      </div>

      {/* Glow */}
      <div className="absolute -inset-4 bg-violet-600/10 blur-3xl rounded-full -z-10 pointer-events-none" />
    </div>
  );
}
