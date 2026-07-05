import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] sm:max-w-[70%] rounded-3xl rounded-br-lg bg-primary text-primary-foreground px-5 py-3 shadow-sm">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex justify-start gap-2.5"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent flex items-center justify-center mt-0.5">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="max-w-[80%] sm:max-w-[70%] rounded-3xl rounded-bl-lg bg-card border border-border px-5 py-3 shadow-sm">
        <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}