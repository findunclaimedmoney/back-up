import React from "react";
import { motion } from "framer-motion";
import VoicePlayer from "@/components/companion/VoicePlayer";

export default function MessageBubble({ message, companionId }) {
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
          {message.image_url && (
            <img
              src={message.image_url}
              alt="Shared photo"
              className="rounded-2xl mb-2 max-w-full"
            />
          )}
          {message.content && (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex justify-start"
    >
      {message.image_url ? (
        <div className="max-w-[80%] sm:max-w-[70%]">
          <img
            src={message.image_url}
            alt="Companion photo"
            className="rounded-3xl rounded-bl-lg border border-border shadow-sm max-w-full"
          />
          {message.content && (
            <p className="text-[14px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-words mt-1.5 px-1">
              {message.content}
            </p>
          )}
        </div>
      ) : (
        <div className="max-w-[80%] sm:max-w-[70%] rounded-3xl rounded-bl-lg bg-card border border-border px-5 py-3 shadow-sm">
          <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
            {message.content}
          </p>
          <VoicePlayer text={message.content} companionId={companionId} />
        </div>
      )}
    </motion.div>
  );
}