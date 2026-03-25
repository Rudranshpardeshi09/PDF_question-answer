// this is the main mind map page that brings together controls, viewer, and gallery
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import MindMapControls from "@/components/mindmap/MindMapControls";
import MindMapViewer from "@/components/mindmap/MindMapViewer";
import MindMapGallery from "@/components/mindmap/MindMapGallery";
import { generateMindMap } from "@/api/client";

// animation settings matching Home.jsx pattern
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

export default function MindMap() {
  const [mindmapData, setMindmapData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // handle mind map generation
  const handleGenerate = useCallback(async (params) => {
    setIsGenerating(true);
    setError("");
    try {
      const res = await generateMindMap(params);
      setMindmapData(res.data);
    } catch (e) {
      const msg =
        e.response?.data?.detail || e.message || "Failed to generate mind map";
      setError(msg);
      console.error("Generation failed:", e);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // handle loading a saved mind map from gallery
  const handleSelectMap = useCallback((mapData) => {
    setMindmapData(mapData);
    setError("");
  }, []);

  return (
    <AppLayout>
      <div className="w-full h-full p-2 sm:p-3 md:p-4 overflow-hidden">
        <motion.div
          className="w-full max-w-[1600px] mx-auto h-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4 h-full">
            {/* left panel - controls */}
            <motion.div
              className="col-span-1 lg:col-span-3 h-full min-h-0 overflow-hidden"
              variants={itemVariants}
            >
              <MindMapControls
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </motion.div>

            {/* center panel - mind map viewer */}
            <motion.div
              className="col-span-1 lg:col-span-6 h-full min-h-0 flex flex-col overflow-hidden"
              variants={itemVariants}
            >
              <div className="flex-1 min-h-0 h-full w-full">
                <MindMapViewer
                  mindmapData={mindmapData}
                  isLoading={isGenerating}
                />
              </div>
              {/* error display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* right panel - gallery */}
            <motion.div
              className="hidden lg:block lg:col-span-3 h-full min-h-0 overflow-hidden"
              variants={itemVariants}
            >
              <MindMapGallery onSelectMap={handleSelectMap} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
