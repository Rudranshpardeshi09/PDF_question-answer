import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadPDF } from "@/api/client";
import { useApp } from "@/context/AppContext";

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const successVariants = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
  exit: { scale: 0, opacity: 0 },
};

export default function UploadPDF() {
  const { setIndexed } = useApp();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const response = await uploadPDF(file, setProgress);
      setUploadedFile({
        name: response.data.filename,
        pages: response.data.pages,
        chunks: response.data.chunks,
      });
      setIndexed(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload PDF");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card className="h-full flex flex-col shadow-lg border-0 bg-gradient-to-br from-white to-blue-50 hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-2xl">📄</span>
            Upload PDF
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col p-5">
          
          {/* FILE INPUT */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">
              Select PDF Document
            </label>
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleUpload}
                disabled={loading}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className={`block w-full px-4 py-3 rounded-lg border-2 border-dashed transition-all cursor-pointer text-center ${
                  loading
                    ? "border-gray-300 bg-gray-50"
                    : "border-blue-400 bg-blue-50 hover:border-blue-600 hover:bg-blue-100"
                }`}
              >
                <span className="text-sm font-medium text-gray-700">
                  {loading ? "Uploading..." : "Choose PDF or drag here"}
                </span>
              </label>
            </div>
          </div>

          {/* ERROR STATE */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs text-red-700 bg-red-100 border border-red-300 p-3 rounded-lg"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOADING PROGRESS */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                    style={{ width: `${progress}%` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <motion.p
                  className="text-xs text-center font-medium text-gray-600"
                  animate={{ opacity: [0.7, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  Indexing document… {progress}%
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SUCCESS STATE */}
          <AnimatePresence>
            {uploadedFile && !loading && (
              <motion.div
                variants={successVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 space-y-2"
              >
                <p className="text-sm font-bold text-green-700 flex items-center gap-2">
                  <span className="text-xl">✓</span> PDF Indexed Successfully
                </p>
                <div className="text-xs text-green-700 space-y-1">
                  <p>📁 <strong>{uploadedFile.name}</strong></p>
                  <p>📄 Pages: <strong>{uploadedFile.pages}</strong> | 🔗 Chunks: <strong>{uploadedFile.chunks}</strong></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* INFO */}
          {!uploadedFile && !loading && (
            <motion.p
              className="text-xs text-gray-600 flex-1 flex items-end"
              animate={{ opacity: [0.7, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ✨ Upload a PDF document to index and search its content. Supports PDFs up to 50MB.
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
