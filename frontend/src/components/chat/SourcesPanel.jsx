import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function SourcesPanel({ sources }) {
  if (!sources?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="mt-2 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-md">
        <p className="text-xs font-bold text-amber-900 mb-3 flex items-center gap-1">
          📚 Sources Referenced
        </p>
        <div className="space-y-2">
          {sources.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="text-xs bg-white rounded-lg p-2 border border-amber-200 hover:bg-amber-50 transition-colors"
            >
              <p className="font-semibold text-amber-900">
                📖 Page {s.page}
              </p>
              <p className="text-gray-700 mt-1 line-clamp-2">
                {s.text}
              </p>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
