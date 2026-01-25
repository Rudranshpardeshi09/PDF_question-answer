import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${
        isUser
          ? "bg-primary text-primary-foreground ml-auto"
          : "bg-muted"
      }`}
    >
      {!isUser && (
        <Badge variant="secondary" className="mb-1">
          AI
        </Badge>
      )}
      <ReactMarkdown>{content}</ReactMarkdown>
    </motion.div>
  );
}
