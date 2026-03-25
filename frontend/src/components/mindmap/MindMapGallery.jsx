// this component shows the mind map history/gallery
// users can view, re-open, or delete saved mind maps

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Trash2,
  FileText,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";
import { getMindMapHistory, getMindMap, deleteMindMap } from "@/api/client";

export default function MindMapGallery({ onSelectMap }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // load history on mount and refresh periodically
  const loadHistory = useCallback(async () => {
    try {
      const res = await getMindMapHistory();
      setHistory(res.data || []);
    } catch (e) {
      console.error("Failed to load mind map history:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // re-open a saved mind map
  const handleOpen = async (id) => {
    try {
      const res = await getMindMap(id);
      if (res.data) {
        onSelectMap(res.data);
      }
    } catch (e) {
      console.error("Failed to load mind map:", e);
    }
  };

  // delete a mind map
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteMindMap(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error("Failed to delete mind map:", e);
    } finally {
      setDeletingId(null);
    }
  };

  // format timestamp for display
  const formatTime = (isoStr) => {
    if (!isoStr) return "";
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-lg overflow-hidden">
      {/* header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-neutral-900 dark:to-neutral-900 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800 dark:text-neon-400 flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          Gallery
        </h2>
        <motion.button
          onClick={loadHistory}
          className="p-1.5 rounded-md text-gray-400 dark:text-neutral-500 hover:text-blue-500 dark:hover:text-neon-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          whileTap={{ rotate: 180 }}
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* history list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 dark:border-neon-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
              <Clock className="w-6 h-6 text-gray-300 dark:text-neutral-600" />
            </div>
            <p className="text-xs text-gray-400 dark:text-neutral-600">
              No mind maps yet. Generate one to see it here!
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10, height: 0 }}
                  className="group bg-gray-50 dark:bg-neutral-800/50 rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-neon-500/30 transition-all duration-200"
                >
                  <button
                    onClick={() => handleOpen(item.id)}
                    className="w-full text-left px-3 py-2.5 flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-neon-500/20 flex-shrink-0 mt-0.5">
                      <FileText className="w-3 h-3 text-blue-500 dark:text-neon-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-neutral-300 truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 dark:text-neutral-500 truncate">
                          {item.source}
                        </span>
                        <span className="text-[10px] text-gray-300 dark:text-neutral-600">
                          •
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-neutral-500 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </button>

                  {/* delete button on hover */}
                  <div className="px-3 pb-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={deletingId === item.id}
                      className="px-2 py-1 rounded text-[10px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      {deletingId === item.id ? "..." : "Delete"}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
