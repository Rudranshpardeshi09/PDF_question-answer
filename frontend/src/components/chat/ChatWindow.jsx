import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { askQuestion } from "@/api/client";
import { useApp } from "@/context/AppContext";
import MessageBubble from "./MessageBubble";
import SourcesPanel from "./SourcesPanel";
import ChatInput from "./ChatInput";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ChatWindow() {
  const {
    subject,
    indexed,
    messages,
    setMessages,
    unit,
    topic,
    marks,
  } = useApp();

  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendQuestion = async (q) => {
    if (!subject || !unit || !topic || !marks) {
      alert("Please complete the following before asking:\n✓ Upload PDF\n✓ Upload Syllabus\n✓ Select Unit, Topic, and Marks");
      return;
    }

    setMessages((m) => [...m, { role: "user", content: q }]);

    try {
      const res = await askQuestion(q, subject, unit, topic, marks);

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.data.answer,
          sources: res.data.sources,
          error: res.data.error,
        },
      ]);
    } catch (error) {
      console.error("Error asking question:", error);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `⚠️ Error: ${error.response?.data?.detail || "Failed to get answer. Please try again."}`,
          error: true,
        },
      ]);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-black dark:border dark:border-emerald-500/30 dark:shadow-2xl dark:shadow-emerald-500/10 rounded-xl border-0 shadow-xl overflow-hidden transition-all duration-300 dark:hover:border-emerald-500/50 dark:hover:shadow-emerald-500/20"
    >
      
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-shrink-0 border-b border-blue-200 dark:border-emerald-500/30 p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-emerald-600 dark:to-emerald-700 text-white"
      >
        <h2 className="font-bold text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
          <span className="text-xl sm:text-2xl">✨</span>
          <span>Study Assistant</span>
        </h2>
        <AnimatePresence>
          {subject && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs sm:text-sm text-blue-100 mt-1 truncate"
            >
              {subject} • <strong>{unit}</strong> • {topic.substring(0, 20)}{topic.length > 20 ? "..." : ""}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* MESSAGES SCROLL AREA */}
      {/* MESSAGES SCROLL AREA */}
<div className="flex-1 min-h-0">
  <ScrollArea className="h-full w-full scrollbar-thin">
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 pr-2 sm:pr-8">
      
      {messages.length === 0 && (
        <motion.div
          animate={{ opacity: [0.6, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="h-full flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-2xl mb-2">🎓</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-4">
              {!indexed
                ? "Upload a PDF to get started"
                : "Upload syllabus and select a topic to begin"}
            </p>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="space-y-2"
          >
            <MessageBubble role={m.role} content={m.content} error={m.error} />

            {m.sources && m.sources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <SourcesPanel sources={m.sources} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </div>
  </ScrollArea>
</div>


      {/* INPUT AREA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-shrink-0 border-t border-blue-200 dark:border-emerald-500/30 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950"
      >
        <ChatInput 
          onSend={sendQuestion} 
          disabled={!indexed || !subject || !unit || !topic}
        />
      </motion.div>
    </motion.div>
  );
}
