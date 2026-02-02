import { useState, useCallback, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadSyllabus } from "@/api/client";

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS (defined outside component to prevent recreation)
// ══════════════════════════════════════════════════════════════════════════════
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.1 } },
};

const successVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
  exit: { scale: 0, opacity: 0 },
};

const marksConfig = {
  3: { label: "Short", color: "from-blue-600 to-blue-700", icon: "📝", desc: "~100 words", darkColor: "dark:from-neon-600 dark:to-neon-700" },
  5: { label: "Medium", color: "from-indigo-600 to-indigo-700", icon: "📄", desc: "~250 words", darkColor: "dark:from-neon-500 dark:to-neon-600" },
  12: { label: "Long", color: "from-purple-600 to-purple-700", icon: "📚", desc: "~500 words", darkColor: "dark:from-neon-400 dark:to-neon-500" },
};

// ══════════════════════════════════════════════════════════════════════════════
// MEMOIZED SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

const MarkButton = memo(({ mark, isActive, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`py-3 px-2 rounded-lg font-semibold text-xs transition-all duration-300 flex flex-col items-center justify-center ${
      isActive
        ? `bg-gradient-to-r ${marksConfig[mark].color} ${marksConfig[mark].darkColor} text-white shadow-lg dark:shadow-neon`
        : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neon-500/40 hover:bg-gray-200 dark:hover:bg-neutral-700"
    }`}
  >
    <span className="text-lg mb-0.5">{marksConfig[mark].icon}</span>
    <span className="font-bold">{mark} Marks</span>
    <span className="text-[9px] opacity-80">{marksConfig[mark].desc}</span>
  </motion.button>
));

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function StudyPanel() {
  const { syllabusText, setSyllabusText, marks, setMarks, clearSyllabus } = useApp();
  
  // Local state for file upload
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleFileChange = useCallback((e) => {
    setFile(e.target.files?.[0] || null);
    setError(null);
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await uploadSyllabus(file);
      
      if (!isMountedRef.current) return;
      
      const { subject, units } = res.data;
      
      // Convert parsed syllabus to text format
      let textContent = subject ? `Subject: ${subject}\n\n` : "";
      
      if (units && units.length > 0) {
        units.forEach((unit) => {
          textContent += `${unit.name}\n`;
          if (unit.topics && unit.topics.length > 0) {
            textContent += `Topics: ${unit.topics.join(", ")}\n`;
          }
          textContent += "\n";
        });
      }
      
      setSyllabusText(textContent.trim());
      setUploadSuccess(true);
      setFile(null);

      // Auto-hide success message
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setUploadSuccess(false);
        }
      }, 3000);
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.response?.data?.detail || "Failed to parse syllabus file");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [file, setSyllabusText]);

  const handleTextChange = useCallback((e) => {
    setSyllabusText(e.target.value);
  }, [setSyllabusText]);

  const handleMarkChange = useCallback((m) => {
    setMarks(m);
  }, [setMarks]);

  const handleClear = useCallback(() => {
    clearSyllabus();
    setFile(null);
    setError(null);
  }, [clearSyllabus]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="h-full w-full"
    >
      <Card className="h-full flex flex-col shadow-lg border-0 bg-gradient-to-br from-white to-purple-50 dark:bg-gradient-to-br dark:from-neutral-950 dark:via-black dark:to-black dark:border dark:border-neon-500/30 dark:shadow-2xl dark:shadow-neon/20 hover:shadow-xl transition-all duration-300 dark:hover:border-neon-500/50 dark:hover:shadow-neon-lg">

        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-neon-600 dark:to-neon-700 text-white rounded-t-lg p-3 sm:p-4 flex-shrink-0 transition-colors duration-300">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1 sm:gap-2">
            <span className="text-xl sm:text-2xl">📋</span>
            <span>Study Options</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 flex-1 flex flex-col overflow-hidden min-h-0">
          <ScrollArea className="flex-1 w-full pr-2">
            <div className="space-y-4">
              
              {/* ═══════════ FILE UPLOAD SECTION ═══════════ */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-neutral-200 flex items-center gap-1.5">
                  <span>📄</span> Upload Syllabus (Optional)
                </label>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                  Upload PDF or DOCX to auto-extract topics
                </p>
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileChange}
                      disabled={loading}
                      className="hidden"
                      id="syllabus-upload"
                    />
                    <label
                      htmlFor="syllabus-upload"
                      className={`block w-full px-3 py-2 rounded-lg border-2 border-dashed text-center transition-all cursor-pointer text-xs truncate ${
                        loading
                          ? "border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800"
                          : "border-purple-400 dark:border-neon-500/50 bg-purple-50 dark:bg-neutral-800 hover:border-purple-600 dark:hover:border-neon-400"
                      }`}
                    >
                      {file ? file.name : "Choose file..."}
                    </label>
                  </div>
                  
                  <Button
                    onClick={handleFileUpload}
                    disabled={!file || loading}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-neon-600 dark:hover:bg-neon-500 text-white px-3 transition-all duration-300"
                  >
                    {loading ? "..." : "Parse"}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 p-2 rounded animate-fade-in"
                  >
                    ⚠️ {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {uploadSuccess && (
                  <motion.div
                    variants={successVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-green-100 dark:bg-neon-950/60 border border-green-300 dark:border-neon-500/50 p-2 rounded transition-colors duration-300"
                  >
                    <p className="text-xs font-bold text-green-700 dark:text-neon-400">
                      ✓ Syllabus parsed and added!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Separator className="dark:bg-neutral-700" />

              {/* ═══════════ TEXT INPUT SECTION ═══════════ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
<label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-neutral-200 flex items-center gap-1.5">
                  <span>✏️</span> Syllabus / Topics
                  </label>
                  {syllabusText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="h-6 px-2 text-[10px] text-gray-500 hover:text-red-500"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                  Type or paste your syllabus, topics, or any context for answers
                </p>
                
                <textarea
                  value={syllabusText}
                  onChange={handleTextChange}
                  placeholder="Enter your syllabus content, topics, or study material here...

Example:
- Unit 1: Introduction to Data Structures
- Topics: Arrays, Linked Lists, Stacks, Queues
- Unit 2: Trees and Graphs
- Topics: Binary Trees, BST, Graph Traversal"
                  className="w-full h-32 sm:h-40 p-3 text-xs rounded-lg border-2 border-gray-300 dark:border-neon-500/40 bg-white dark:bg-neutral-900 text-gray-800 dark:text-neutral-200 placeholder-gray-400 dark:placeholder-neutral-500 focus:border-purple-500 dark:focus:border-neon-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-neon-500/30 transition-all duration-200 resize-none"
                />
                
                {syllabusText && (
                  <p className="text-[10px] text-gray-500 dark:text-neutral-400 text-right">
                    {syllabusText.length} characters
                  </p>
                )}
              </div>

              <Separator className="dark:bg-neutral-700" />

              {/* ═══════════ ANSWER LENGTH SECTION ═══════════ */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-neutral-200 flex items-center gap-1.5">
                  <span>⏱️</span> Answer Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 12].map((m) => (
                    <MarkButton 
                      key={m} 
                      mark={m} 
                      isActive={marks === m} 
                      onClick={() => handleMarkChange(m)} 
                    />
                  ))}
                </div>
              </div>

              {/* ═══════════ INFO BOX ═══════════ */}
              {syllabusText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-neon-950/50 dark:to-neon-900/30 border border-blue-200 dark:border-neon-500/40 p-3 rounded-lg transition-colors duration-300 animate-fade-in"
                >
                  <p className="text-xs font-semibold text-blue-800 dark:text-neon-400 flex items-center gap-1.5">
                    <span>💡</span> Context Ready
                  </p>
                  <p className="text-[10px] text-blue-700 dark:text-neon-300 mt-1">
                    Your syllabus/topics will be used to provide contextual answers. 
                    Ask questions in the chat!
                  </p>
                </motion.div>
              )}

            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
