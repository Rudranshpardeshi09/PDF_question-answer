import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import UploadPDF from "@/components/upload/UploadPDF";
import ChatWindow from "@/components/chat/ChatWindow";
import StudyPanel from "@/components/study/StudyPanel";

// Animation variants defined outside component for performance
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
      {/* Main content container - fixed height, no scrolling */}
      <div className="w-full h-[calc(100vh-120px)] p-2 sm:p-3 md:p-4 overflow-hidden">
        {/* Content wrapper with max-width constraint */}
        <motion.div
          className="w-full max-w-7xl mx-auto h-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Responsive grid: 3 columns on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-5 h-full">
            
            {/* LEFT PANEL - PDF Upload */}
            <motion.div 
              className="col-span-1 sm:col-span-1 lg:col-span-3 h-full overflow-hidden"
              variants={itemVariants}
            >
              <UploadPDF />
            </motion.div>

            {/* CENTER PANEL - Study Options (merged syllabus + answer length) */}
            <motion.div 
              className="col-span-1 sm:col-span-1 lg:col-span-3 h-full overflow-hidden"
              variants={itemVariants}
            >
              <StudyPanel />
            </motion.div>

            {/* RIGHT PANEL - Chat Window */}
            <motion.div 
              className="col-span-1 sm:col-span-2 lg:col-span-6 h-full overflow-hidden"
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
