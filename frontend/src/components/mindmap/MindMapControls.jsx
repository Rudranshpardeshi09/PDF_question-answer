// this component provides all the controls for generating mind maps
// source selection, mode picker, chapter/topic dropdowns, text input

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  BookOpen,
  Layers,
  Target,
  Sparkles,
  ChevronDown,
  Loader2,
  Type,
  AlertCircle,
} from "lucide-react";
import { getDocumentStructure } from "@/api/client";
import { useApp } from "@/context/AppContext";

const MODE_OPTIONS = [
  { id: "full", label: "Full Document", icon: BookOpen, desc: "Complete mind map" },
  { id: "chapter", label: "Chapter-wise", icon: Layers, desc: "By chapter/section" },
  { id: "topic", label: "Topic-wise", icon: Target, desc: "Specific topic detail" },
];

export default function MindMapControls({ onGenerate, isGenerating }) {
  const { completedFileNames } = useApp();
  // source selection
  const [sourceType, setSourceType] = useState("uploaded_pdf");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [textContent, setTextContent] = useState("");

  // mode & structure
  const [mode, setMode] = useState("full");
  const [structure, setStructure] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [structureLoading, setStructureLoading] = useState(false);

  // errors
  const [error, setError] = useState("");

  useEffect(() => {
    if (sourceType !== "uploaded_pdf") return;
    setSelectedFiles(completedFileNames);
  }, [completedFileNames, sourceType]);

  // load document structure when file selected and mode needs it
  useEffect(() => {
    if (
      selectedFiles.length > 0 &&
      (mode === "chapter" || mode === "topic") &&
      sourceType === "uploaded_pdf"
    ) {
      loadStructure(selectedFiles[0]);
    }
  }, [selectedFiles, mode, sourceType]);

  const loadStructure = async (filename) => {
    setStructureLoading(true);
    setStructure(null);
    setSelectedChapter("");
    setSelectedTopic("");
    try {
      const res = await getDocumentStructure(filename);
      setStructure(res.data);
    } catch (e) {
      console.error("Failed to load structure:", e);
      setError("Could not extract document structure. Try Full Document mode.");
    } finally {
      setStructureLoading(false);
    }
  };

  // get topics for selected chapter
  const availableTopics = structure?.chapters
    ?.find((ch) => ch.name === selectedChapter)
    ?.topics || [];

  // handle generation
  const handleGenerate = useCallback(() => {
    setError("");

    // validate
    if (sourceType === "uploaded_pdf" && selectedFiles.length === 0) {
      setError("Please select at least one file.");
      return;
    }
    if (sourceType === "text" && !textContent.trim()) {
      setError("Please enter some text content.");
      return;
    }
    if (mode === "chapter" && !selectedChapter) {
      setError("Please select a chapter.");
      return;
    }
    if (mode === "topic" && !selectedTopic) {
      setError("Please select a topic.");
      return;
    }

    const params = {
      source_type: sourceType,
      source_filenames: sourceType === "uploaded_pdf" ? selectedFiles : [],
      text_content: sourceType === "text" ? textContent : null,
      mode,
      selected_chapter: selectedChapter || null,
      selected_topic: selectedTopic || null,
    };

    onGenerate(params);
  }, [sourceType, selectedFiles, textContent, mode, selectedChapter, selectedTopic, onGenerate]);

  // toggle file selection
  const toggleFile = (filename) => {
    setSelectedFiles((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-lg overflow-hidden">
      {/* header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-neutral-900 dark:to-neutral-900">
        <h2 className="text-sm font-bold text-gray-800 dark:text-neon-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Mind Map Generator
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
        {/* SOURCE TYPE TABS */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block">
            Source
          </label>
          <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
            {[
              { id: "uploaded_pdf", label: "PDF Files", icon: FileText },
              { id: "text", label: "Paste Text", icon: Type },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSourceType(tab.id);
                  setError("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200
                  ${sourceType === tab.id
                    ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-neon-400 shadow-sm"
                    : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300"
                  }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FILE SELECTION (for uploaded_pdf) */}
        <AnimatePresence mode="wait">
          {sourceType === "uploaded_pdf" && (
            <motion.div
              key="files"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block">
                Select Files
              </label>
              {completedFileNames.length === 0 ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No shared documents are ready yet. Upload and process a file on the landing page first.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {completedFileNames.map((fname) => (
                    <label
                      key={fname}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 text-xs
                        ${selectedFiles.includes(fname)
                          ? "bg-blue-50 dark:bg-neon-500/10 border border-blue-200 dark:border-neon-500/30"
                          : "bg-gray-50 dark:bg-neutral-800/50 border border-transparent hover:bg-gray-100 dark:hover:bg-neutral-800"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(fname)}
                        onChange={() => toggleFile(fname)}
                        className="w-3.5 h-3.5 rounded text-blue-600 dark:text-neon-500 border-gray-300 dark:border-neutral-600 focus:ring-blue-500"
                      />
                      <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-neutral-300 truncate">
                        {fname}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TEXT INPUT */}
          {sourceType === "text" && (
            <motion.div
              key="text"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block">
                Paste Your Text
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your study material, notes, or any text here..."
                className="w-full h-28 px-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
                  text-xs text-gray-700 dark:text-neutral-300 placeholder-gray-400 dark:placeholder-neutral-600
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-neon-500/30 focus:border-blue-400 dark:focus:border-neon-500
                  resize-none transition-all duration-200"
              />
              <p className="text-[10px] text-gray-400 dark:text-neutral-600 mt-1 text-right">
                {textContent.length.toLocaleString()} chars
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODE SELECTOR */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block">
            Mode
          </label>
          <div className="space-y-1">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setMode(opt.id);
                  setSelectedChapter("");
                  setSelectedTopic("");
                  setError("");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200
                  ${mode === opt.id
                    ? "bg-blue-50 dark:bg-neon-500/10 border border-blue-200 dark:border-neon-500/30"
                    : "bg-gray-50 dark:bg-neutral-800/50 border border-transparent hover:bg-gray-100 dark:hover:bg-neutral-800"
                  }`}
              >
                <opt.icon
                  className={`w-4 h-4 flex-shrink-0
                    ${mode === opt.id
                      ? "text-blue-500 dark:text-neon-400"
                      : "text-gray-400 dark:text-neutral-500"
                    }`}
                />
                <div>
                  <span
                    className={`text-xs font-medium block
                      ${mode === opt.id
                        ? "text-blue-700 dark:text-neon-400"
                        : "text-gray-700 dark:text-neutral-300"
                      }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-neutral-600">
                    {opt.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CHAPTER DROPDOWN */}
        {mode !== "full" && sourceType === "uploaded_pdf" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block">
              Chapter
            </label>
            {structureLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-neutral-500 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Extracting structure...
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(e.target.value);
                    setSelectedTopic("");
                  }}
                  className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
                    text-xs text-gray-700 dark:text-neutral-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-neon-500/30 transition-all duration-200"
                >
                  <option value="">Select a chapter...</option>
                  {structure?.chapters?.map((ch) => (
                    <option key={ch.name} value={ch.name}>
                      {ch.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            )}
          </motion.div>
        )}

        {/* TOPIC DROPDOWN */}
        {mode === "topic" && selectedChapter && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block">
              Topic
            </label>
            <div className="relative">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
                  text-xs text-gray-700 dark:text-neutral-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-neon-500/30 transition-all duration-200"
              >
                <option value="">Select a topic...</option>
                {availableTopics.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </motion.div>
        )}

        {/* ERROR */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* GENERATE BUTTON */}
      <div className="p-4 border-t border-gray-100 dark:border-neutral-800">
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-neon-500 dark:to-neon-600
            hover:from-blue-700 hover:to-indigo-700 dark:hover:from-neon-600 dark:hover:to-neon-700
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl shadow-blue-500/25 dark:shadow-neon/30
            transition-all duration-300 flex items-center justify-center gap-2"
          whileHover={!isGenerating ? { scale: 1.02 } : {}}
          whileTap={!isGenerating ? { scale: 0.98 } : {}}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Mind Map
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
