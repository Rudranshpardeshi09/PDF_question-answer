import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "./ThemeToggle";

export default function AppLayout({ children }) {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg"
      >
        <motion.h1
          className="font-bold text-2xl text-white flex items-center gap-2"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <span className="text-3xl">🚀</span>
          PDF RAG Study Assistant
        </motion.h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </motion.header>

      <Separator />

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
