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
      className="h-full flex flex-col bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-xl border-0 shadow-xl overflow-hidden"
    >
      
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-shrink-0 border-b border-blue-200 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
      >
        <h2 className="font-bold text-lg flex items-center gap-2">
          <span className="text-2xl">✨</span>
          Study Assistant
        </h2>
        <AnimatePresence>
          {subject && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-blue-100 mt-1"
            >
              {subject} • <strong>{unit}</strong> • {topic}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* MESSAGES SCROLL AREA */}
      <ScrollArea className="flex-1 p-4 overflow-hidden" ref={scrollAreaRef}>
        <div className="space-y-4 pr-4">
          {messages.length === 0 && (
            <motion.div
              animate={{ opacity: [0.6, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <p className="text-2xl mb-2">🎓</p>
                <p className="text-sm text-gray-600">
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

      {/* INPUT AREA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-shrink-0 border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-indigo-50"
      >
        <ChatInput 
          onSend={sendQuestion} 
          disabled={!indexed || !subject || !unit || !topic}
        />
      </motion.div>
    </motion.div>
  );
}
