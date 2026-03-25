import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  FileSearch,
  Network,
  Sparkles,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import UploadPDF from "@/components/upload/UploadPDF";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const featureCards = [
  {
    icon: BrainCircuit,
    title: "Exam-ready study support",
    description:
      "Ask questions against your uploaded material and get focused answers shaped for short, medium, or long-mark responses.",
  },
  {
    icon: Network,
    title: "Structured visual mind maps",
    description:
      "Turn dense documents into clean visual hierarchies with headings, subheadings, and concise explanations.",
  },
  {
    icon: FileSearch,
    title: "One upload, two workflows",
    description:
      "Process a document once on the landing page, then continue into either workspace without uploading it again.",
  },
];

export default function Landing({ onNavigate }) {
  const { indexed, completedFiles } = useApp();

  return (
    <AppLayout>
      <div className="w-full h-full overflow-y-auto">
        <motion.div
          className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.section
            variants={itemVariants}
            className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.14),transparent_36%),linear-gradient(135deg,#ffffff_0%,#eff6ff_45%,#eef2ff_100%)] p-6 shadow-xl dark:border-neon-500/20 dark:bg-[radial-gradient(circle_at_top_left,_rgba(0,255,136,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),transparent_34%),linear-gradient(135deg,#020617_0%,#020617_45%,#000000_100%)] md:p-8"
          >
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 shadow-sm dark:border-neon-500/30 dark:bg-black/40 dark:text-neon-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  StudyMind
                </div>
                <div className="space-y-3">
                  <h2 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                    Study smarter from the same source of truth.
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-neutral-300 md:text-base">
                    StudyMind turns uploaded learning material into two high-value workflows: a study assistant for focused Q&A and a professional mind map builder for structured revision. Upload once on this page, wait for processing, then open the workspace you need.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => onNavigate("study")}
                    className="h-11 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700"
                    disabled={!indexed}
                  >
                    Open Study Tool <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onNavigate("mindmap")}
                    className="h-11 rounded-full border-indigo-200 px-5 text-indigo-700 hover:bg-indigo-50 dark:border-neon-500/30 dark:text-neon-300 dark:hover:bg-neutral-900"
                    disabled={!indexed}
                  >
                    Open Mind Maps <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {completedFiles.length > 0
                    ? `${completedFiles.length} processed document${completedFiles.length > 1 ? "s" : ""} ready.`
                    : "Upload a document below to unlock both routes."}
                </p>
              </div>

              <div className="grid gap-3">
                {featureCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-neon-500/15 dark:bg-black/35"
                  >
                    <div className="mb-3 inline-flex rounded-2xl bg-blue-100 p-2 text-blue-700 dark:bg-neon-500/10 dark:text-neon-300">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-neutral-400">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_0.28fr]"
          >
            <UploadPDF
              onGoToStudy={() => onNavigate("study")}
              onGoToMindMap={() => onNavigate("mindmap")}
            />

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-lg dark:border-neon-500/20 dark:bg-neutral-950/75">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Workflow
                </h3>
                <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-neutral-400">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-black/40">
                    <p className="font-semibold text-slate-900 dark:text-neon-300">1. Upload</p>
                    <p className="mt-1">Send your PDF or DOCX here once. The backend indexes it for Q&A and mind map generation.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-black/40">
                    <p className="font-semibold text-slate-900 dark:text-neon-300">2. Wait for processing</p>
                    <p className="mt-1">When the document status becomes completed, both experiences are ready with the same shared source.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-black/40">
                    <p className="font-semibold text-slate-900 dark:text-neon-300">3. Choose the route</p>
                    <p className="mt-1">Open Study Tool for guided answers or Mind Maps for a structured visual overview.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </AppLayout>
  );
}
