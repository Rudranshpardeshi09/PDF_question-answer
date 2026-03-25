import { useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import {
  FileUp,
  Trash2,
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const FileItem = memo(({ file, onDelete }) => (
  <div className="bg-gray-100 dark:bg-neutral-800/80 p-2 rounded space-y-1 transition-colors duration-300">
    <div className="flex justify-between items-center gap-2">
      <span className="truncate text-[10px] font-medium flex-1 min-w-0 flex items-center gap-1">
        <FileText className="w-3 h-3 flex-shrink-0" />
        {file.name}
      </span>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onDelete(file.name)}
        className="flex-shrink-0 h-6 px-2 text-[10px]"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>

    <p className="text-[9px] text-gray-600 dark:text-neutral-400 flex items-center gap-1">
      {file.status === "completed" ? (
        <CheckCircle className="w-2.5 h-2.5 text-green-500" />
      ) : file.status === "failed" ? (
        <XCircle className="w-2.5 h-2.5 text-red-500" />
      ) : (
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
      )}
      <strong>{file.status || "Processing"}</strong>
    </p>

    {typeof file.progress === "number" && (
      <div className="h-1.5 bg-gray-300 dark:bg-neutral-700 rounded overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            file.status === "completed"
              ? "bg-green-500 dark:bg-neon-500"
              : file.status === "failed"
                ? "bg-red-500"
                : "bg-blue-500 dark:bg-neon-600"
          }`}
          style={{ width: `${file.progress}%` }}
        />
      </div>
    )}

    {file.status === "completed" && (
      <p className="text-[9px] text-green-700 dark:text-neon-400">
        Pages: {file.pages} | Chunks: {file.chunks}
      </p>
    )}
  </div>
));

export default function UploadPDF({ onGoToStudy, onGoToMindMap }) {
  const {
    uploadedFiles,
    completedFiles,
    uploadBusy,
    uploadError,
    clearUploadError,
    uploadDocument,
    removeUploadedDocument,
    resetUploadedDocuments,
  } = useApp();

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    clearUploadError();

    await uploadDocument(file);
  }, [clearUploadError, uploadDocument]);

  const handleDelete = useCallback(async (filename) => {
    try {
      await removeUploadedDocument(filename);
    } catch (error) {
      console.error("Failed to delete uploaded file:", error);
    }
  }, [removeUploadedDocument]);

  const handleReset = useCallback(async () => {
    if (!window.confirm("Are you sure you want to delete all uploaded documents? This cannot be undone.")) {
      return;
    }

    try {
      await resetUploadedDocuments();
    } catch (error) {
      console.error("Failed to reset uploaded files:", error);
    }
  }, [resetUploadedDocuments]);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="h-full w-full"
    >
      <Card className="h-full flex flex-col shadow-lg border-0 bg-gradient-to-br from-white to-blue-50 dark:bg-gradient-to-br dark:from-neutral-950 dark:via-black dark:to-black dark:border dark:border-neon-500/30 dark:shadow-2xl dark:shadow-neon/20 hover:shadow-xl transition-all duration-300 dark:hover:border-neon-500/50 dark:hover:shadow-neon-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-neon-600 dark:to-neon-700 text-white rounded-t-lg px-3 py-2 transition-colors duration-300 flex-shrink-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <FileUp className="w-4 h-4" />
            <span className="text-white">Shared Uploads</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 flex-1 flex flex-col p-3 overflow-hidden min-h-0">
          <div className="rounded-xl border border-blue-100 bg-white/80 px-3 py-2 text-[11px] text-gray-600 shadow-sm dark:border-neon-500/20 dark:bg-neutral-900/70 dark:text-neutral-300">
            Upload your study material once. After processing finishes, the same documents are available in both the study assistant and mind map workspace.
          </div>

          <div className="space-y-1 flex-shrink-0">
            <label className="text-[10px] font-semibold text-gray-700 dark:text-neutral-200 block">
              Select PDF or DOCX
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.docx,application/pdf"
                onChange={handleUpload}
                disabled={uploadBusy}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className={`block w-full px-3 py-3 rounded-lg border-2 border-dashed transition-all duration-300 cursor-pointer text-center ${
                  uploadBusy
                    ? "border-gray-300 bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800"
                    : "border-blue-400 bg-blue-50 hover:border-blue-600 hover:bg-blue-100 dark:border-neon-500/50 dark:bg-neutral-800 dark:hover:border-neon-400"
                }`}
              >
                <span className="text-[11px] font-medium text-gray-700 dark:text-neutral-300">
                  {uploadBusy ? "Uploading and indexing..." : "Choose a document to process"}
                </span>
              </label>
            </div>
          </div>

          <AnimatePresence>
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 p-1.5 rounded-lg flex-shrink-0"
              >
                {uploadError}
              </motion.div>
            )}
          </AnimatePresence>

          {uploadedFiles.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0">
              <p className="font-semibold text-[10px] text-gray-700 dark:text-neutral-200 mb-1 flex-shrink-0">
                Uploaded ({uploadedFiles.length})
              </p>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {uploadedFiles.map((file) => (
                  <FileItem key={file.name} file={file} onDelete={handleDelete} />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="w-full mt-2 flex-shrink-0 text-[10px] h-8 flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset All
              </Button>
            </div>
          )}

          {completedFiles.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              {completedFiles.length} document{completedFiles.length > 1 ? "s are" : " is"} ready for both tools.
            </div>
          )}

          {!uploadBusy && uploadedFiles.length === 0 && (
            <motion.p
              className="text-[10px] text-gray-600 dark:text-neutral-500 flex-1 flex items-end"
              animate={{ opacity: [0.7, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Upload documents up to 50MB to unlock search, Q&A, and polished mind maps.
            </motion.p>
          )}

          {completedFiles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                onClick={onGoToStudy}
                className="h-10 justify-between bg-blue-600 hover:bg-blue-700 text-white"
              >
                Study Tool <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                onClick={onGoToMindMap}
                variant="outline"
                className="h-10 justify-between border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-neon-500/30 dark:text-neon-300 dark:hover:bg-neutral-900"
              >
                Mind Maps <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
