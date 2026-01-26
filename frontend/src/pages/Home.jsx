import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import UploadPDF from "@/components/upload/UploadPDF";
import ChatWindow from "@/components/chat/ChatWindow";
import SyllabusUpload from "@/components/syllabus/SyllabusUpload";
import StudyControls from "@/components/study/StudyControls";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function Home() {
  return (
    <AppLayout>
      {/* Main content container - centered and responsive */}
      <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Content wrapper with max-width constraint */}
        <motion.div
          className="w-full max-w-7xl h-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Responsive grid: 1 col on mobile, 3 cols on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
            
            {/* LEFT PANEL - PDF Upload (md:col-span-3) */}
            <motion.div 
              className="md:col-span-3 h-full"
              variants={itemVariants}
            >
              <UploadPDF />
            </motion.div>

            {/* CENTER PANEL - Syllabus & Study Controls (md:col-span-3) */}
            <motion.div 
              className="md:col-span-3 h-full space-y-4 flex flex-col"
              variants={itemVariants}
            >
              <div className="flex-shrink-0">
                <SyllabusUpload />
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                <StudyControls />
              </div>
            </motion.div>

            {/* RIGHT PANEL - Chat Window (md:col-span-6) */}
            <motion.div 
              className="md:col-span-6 h-full"
              variants={itemVariants}
            >
              <ChatWindow />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
