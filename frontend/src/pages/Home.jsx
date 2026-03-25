import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileCheck, MessageCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ChatWindow from "@/components/chat/ChatWindow";
import StudyPanel from "@/components/study/StudyPanel";
import MobileChatDrawer from "@/components/chat/MobileChatDrawer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

function StudyWorkspaceCard({ onNavigate }) {
  const { completedFiles } = useApp();

  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-neon-500/30 dark:bg-neutral-950">
      <div className="flex h-full flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-neon-300">
            Study Workspace
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            Ask from uploaded material
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-neutral-400">
            Your shared uploads are already indexed here. Adjust the answer length, optionally add syllabus context, and ask focused questions from the same documents you uploaded on the landing page.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <FileCheck className="h-4 w-4" />
            {completedFiles.length} document{completedFiles.length > 1 ? "s" : ""} ready
          </div>
          <p className="mt-1 text-xs leading-5">
            {completedFiles.map((file) => file.name).join(", ")}
          </p>
        </div>

        <div className="mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate("landing")}
            className="w-full justify-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Landing
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Home({ onNavigate }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <AppLayout>
      <div className="w-full h-full p-2 sm:p-3 md:p-4 overflow-hidden">
        <motion.div
          className="w-full max-w-7xl mx-auto h-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4 h-full">
            <motion.div
              className="col-span-1 lg:col-span-3 h-full min-h-0 overflow-hidden"
              variants={itemVariants}
            >
              <StudyWorkspaceCard onNavigate={onNavigate} />
            </motion.div>

            <motion.div
              className="col-span-1 lg:col-span-3 h-full min-h-0 overflow-hidden"
              variants={itemVariants}
            >
              <StudyPanel />
            </motion.div>

            <motion.div
              className="hidden lg:block lg:col-span-6 h-full min-h-0 overflow-hidden"
              variants={itemVariants}
            >
              <ChatWindow />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.button
        className="lg:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full
                   bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-neon-500 dark:to-neon-600
                   text-white shadow-lg hover:shadow-xl
                   dark:shadow-neon/30 dark:hover:shadow-neon
                   flex items-center justify-center
                   transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsChatOpen(true)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute inset-0 rounded-full bg-blue-500 dark:bg-neon-500 animate-ping opacity-25" />
      </motion.button>

      <AnimatePresence>
        {isChatOpen && (
          <MobileChatDrawer onClose={() => setIsChatOpen(false)} />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
