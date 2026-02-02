import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onSend(text);
      setText("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3">
      <motion.div
        className="flex-1"
        whileFocus={{ scale: 1.02 }}
      >
        <Input
          placeholder="Ask about the study material..."
          disabled={disabled || isLoading}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`text-xs sm:text-sm border-2 transition-all duration-200 font-medium ${
            disabled || isLoading
              ? "border-gray-300 bg-gray-50 dark:border-neutral-600 dark:bg-neutral-900 opacity-50"
              : "border-blue-400 bg-white dark:border-neon-500/50 dark:bg-neutral-900 dark:focus:border-neon-400 dark:focus:ring-neon-500/30 focus:border-blue-600 focus:ring-blue-500"
          }`}
        />
      </motion.div>
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          disabled={disabled || !text.trim() || isLoading}
          onClick={handleSend}
          className={`font-semibold transition-all duration-300 text-xs sm:text-sm py-2 h-auto ${
            disabled || !text.trim() || isLoading
              ? "opacity-50 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-neon-600 dark:to-neon-500 text-white hover:shadow-lg dark:hover:shadow-neon"
          }`}
        >
          {isLoading ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:0.4s]" />
            Sending...
          </span>
        ) : (
          "Send"
        )}
        </Button>
      </motion.div>
    </div>
  );
}
