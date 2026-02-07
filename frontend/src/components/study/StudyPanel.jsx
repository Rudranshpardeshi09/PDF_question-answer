import { useState, useCallback, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadSyllabus } from "@/api/client";

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ══════════════════════════════════════════════════════════════════════════════
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.1 } },
};

const sectionVariants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeInOut" }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeInOut" }
  }
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
// SUB-COMPONENTS (Memoized)
// ══════════════════════════════════════════════════════════════════════════════

const MarkButton = memo(({ mark, isActive, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`py-3 px-2 rounded-lg font-semibold text-xs transition-all duration-300 flex flex-col items-center justify-center ${isActive
        ? `bg-gradient-to-r ${marksConfig[mark].color} ${marksConfig[mark].darkColor} text-white shadow-lg dark:shadow-neon`
        : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neon-500/40 hover:bg-gray-200 dark:hover:bg-neutral-700"
      }`}
  >
    <span className="text-lg mb-0.5">{marksConfig[mark].icon}</span>
    <span className="font-bold">{mark} Marks</span>
    <span className="text-[9px] opacity-80">{marksConfig[mark].desc}</span>
  </motion.button>
));

// Custom Toggle Switch to avoid dependency issues
const MotionSwitch = ({ isOn, onToggle }) => (
  <div
    onClick={onToggle}
    className={`w-10 h-5 flex items-center bg-gray-300 dark:bg-neutral-700 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isOn ? 'bg-purple-600 dark:bg-neon-600' : ''}`}
  >
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 700, damping: 30 }}
      className={`bg-white w-3 h-3 rounded-full shadow-md ${isOn ? 'ml-auto' : ''}`}
    />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function StudyPanel() {
  const { syllabusText, setSyllabusText, marks, setMarks, clearSyllabus } = useApp();

  // Local state
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // NEW: State for toggling Study Mode
  const [isStudyMode, setIsStudyMode] = useState(false);

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIC & HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Toggle Handler with Cleanup
  // const handleToggleMode = useCallback(() => {
  //   setIsStudyMode((prev) => {
  //     const newState = !prev;
  //     if (!newState) {
  //       // If turning OFF study mode, clear the syllabus data
  //       handleClear(); 
  //     }
  //     return newState;
  //   });
  // }, []); // Added missing dependency for handleClear handling in next step

  const handleClear = useCallback(() => {
    clearSyllabus();
    setFile(null);
    setError(null);
  }, [clearSyllabus]);

  // Update dependency for toggle
  const toggleWithClear = useCallback(() => {
    setIsStudyMode(prev => {
      if (prev === true) handleClear(); // Clear when turning off
      return !prev;
    });
  }, [handleClear]);

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
      let textContent = subject ? `Subject: ${subject}\n\n` : "";

      if (units && units.length > 0) {
        units.forEach((unit) => {
          textContent += `${unit.name}\n`;
          if (unit.topics?.length) {
            textContent += `Topics: ${unit.topics.join(", ")}\n`;
          }
          textContent += "\n";
        });
      }

      setSyllabusText(textContent.trim());
      setUploadSuccess(true);
      setFile(null);

      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) setUploadSuccess(false);
      }, 3000);
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.response?.data?.detail || "Failed to parse syllabus file");
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [file, setSyllabusText]);

  const handleTextChange = useCallback((e) => {
    setSyllabusText(e.target.value);
  }, [setSyllabusText]);

  const handleMarkChange = useCallback((m) => {
    setMarks(m);
  }, [setMarks]);

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
      <Card className="h-full flex flex-col shadow-lg border-0 bg-gradient-to-br from-white to-purple-50 dark:bg-gradient-to-br dark:from-neutral-950 dark:via-black dark:to-black dark:border dark:border-neon-500/30 dark:shadow-2xl dark:shadow-neon/20 transition-all duration-300">

        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-neon-600 dark:to-neon-700 text-white rounded-t-lg p-3 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <span className="text-xl">📋</span>
              <span className="text-white">Study Panel</span>
            </CardTitle>

            {/* ENABLE/DISABLE TOGGLE */}
            <div className="flex items-center gap-2 bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
              <span className="text-[10px] font-medium opacity-90">
                {isStudyMode ? "Context ON" : "Context OFF"}
              </span>
              <MotionSwitch isOn={isStudyMode} onToggle={toggleWithClear} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 flex-1 flex flex-col overflow-hidden min-h-0">
          <ScrollArea className="flex-1 w-full pr-2">
            <div className="space-y-4">

              {/* ═══════════ ANSWER LENGTH (ALWAYS VISIBLE) ═══════════ */}
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

              <Separator className="dark:bg-neutral-700" />

              {/* ═══════════ CONDITIONAL STUDY CONTENT ═══════════ */}
              <AnimatePresence>
                {!isStudyMode ? (
                  /* Standard Mode Info */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-center"
                  >
                    <p className="text-sm text-gray-600 dark:text-neutral-400">
                      Standard PDF Chat Mode
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1">
                      Enable "Context" above to add specific syllabus or topics.
                    </p>
                  </motion.div>
                ) : (
                  /* Study Context Inputs */
                  <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* FILE UPLOAD SECTION */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-neutral-200 flex items-center gap-1.5">
                        <span>📄</span> Upload Syllabus (Optional)
                      </label>
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
                            className={`block w-full px-3 py-2 rounded-lg border-2 border-dashed text-center transition-all cursor-pointer text-xs truncate ${loading
                                ? "border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800"
                                : "border-purple-400 dark:border-neon-500/50 bg-purple-50 dark:bg-neutral-800 hover:border-purple-600"
                              }`}
                          >
                            {file ? file.name : "Choose file..."}
                          </label>
                        </div>
                        <Button
                          onClick={handleFileUpload}
                          disabled={!file || loading}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 dark:bg-neon-600 text-white px-3"
                        >
                          {loading ? "..." : "Parse"}
                        </Button>
                      </div>
                    </div>

                    {/* Messages */}
                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-xs text-red-700 bg-red-100 p-2 rounded"
                        >
                          ⚠️ {error}
                        </motion.p>
                      )}
                      {uploadSuccess && (
                        <motion.div
                          variants={successVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="bg-green-100 border border-green-300 p-2 rounded"
                        >
                          <p className="text-xs font-bold text-green-700">✓ Syllabus parsed!</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* TEXT AREA */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-neutral-200">
                          <span>✏️</span> Topics / Context
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
                      <textarea
                        value={syllabusText}
                        onChange={handleTextChange}
                        placeholder="Paste syllabus or topics here..."
                        className="w-full h-32 p-3 text-xs rounded-lg border-2 border-gray-300 dark:border-neon-500/40 bg-white dark:bg-neutral-900 focus:border-purple-500 resize-none"
                      />
                    </div>

                    {/* Info Box */}
                    {syllabusText && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-blue-50 border border-blue-200 p-3 rounded-lg"
                      >
                        <p className="text-xs font-semibold text-blue-800">💡 Context Ready</p>
                        <p className="text-[10px] text-blue-700">Context is active for your questions.</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}