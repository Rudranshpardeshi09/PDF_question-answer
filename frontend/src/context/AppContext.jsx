// this file manages the global state of the app using React Context
// any component in the app can access and update these shared values
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  uploadPDF,
  getIngestStatus,
  deletePDF,
  resetPDFs,
} from "@/api/client";

// creating the context object that will hold our shared state
const AppContext = createContext();
const POLLING_INTERVAL = 2000;

// this provider wraps the entire app and makes state available everywhere
export const AppProvider = ({ children }) => {
  // tracks whether PDFs have been uploaded and are ready for questions
  const [indexed, setIndexed] = useState(false);
  // stores all chat messages between the user and AI
  const [messages, setMessages] = useState([]);

  // the syllabus text that the user typed or uploaded
  const [syllabusText, setSyllabusText] = useState("");
  // the current answer length setting (3=short, 5=medium, 12=long marks)
  const [marks, setMarks] = useState(3);
  // shared upload state used by both study and mind map experiences
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const pollingRefs = useRef({});
  const isMountedRef = useRef(true);

  const syncUploadFlags = useCallback((files) => {
    const hasCompleted = files.some((file) => file.status === "completed");
    const isBusy = files.some((file) =>
      ["uploading", "pending", "processing"].includes(file.status)
    );
    setIndexed(hasCompleted);
    setUploadBusy(isBusy);
  }, []);

  const pollIngestionStatus = useCallback((filename) => {
    if (!filename || pollingRefs.current[filename]) return;

    const intervalId = setInterval(async () => {
      if (!isMountedRef.current) {
        clearInterval(intervalId);
        return;
      }

      try {
        const res = await getIngestStatus(filename);
        if (!isMountedRef.current) return;

        if (!res.data || res.data.status === "not_found") {
          clearInterval(intervalId);
          delete pollingRefs.current[filename];
          return;
        }

        setUploadedFiles((prev) => {
          const next = prev.map((file) =>
            file.name === filename
              ? {
                  ...file,
                  status: res.data.status,
                  pages: res.data.pages,
                  chunks: res.data.chunks,
                  progress: res.data.status === "completed" ? 100 : file.progress,
                  error: res.data.error || null,
                }
              : file
          );
          syncUploadFlags(next);
          return next;
        });

        if (res.data.status === "completed" || res.data.status === "failed") {
          clearInterval(intervalId);
          delete pollingRefs.current[filename];
        }
      } catch {
        clearInterval(intervalId);
        delete pollingRefs.current[filename];
      }
    }, POLLING_INTERVAL);

    pollingRefs.current[filename] = intervalId;
  }, [syncUploadFlags]);

  const refreshUploadedFiles = useCallback(async () => {
    try {
      const res = await getIngestStatus();
      if (!isMountedRef.current) return;

      const nextFiles = Object.entries(res.data || {}).map(([name, status]) => ({
        name,
        status: status.status,
        pages: status.pages ?? 0,
        chunks: status.chunks ?? 0,
        progress: status.status === "completed" ? 100 : 0,
        error: status.error ?? null,
      }));

      setUploadedFiles(nextFiles);
      syncUploadFlags(nextFiles);

      nextFiles.forEach((file) => {
        if (["pending", "processing"].includes(file.status)) {
          pollIngestionStatus(file.name);
        }
      });
    } catch (error) {
      if (!isMountedRef.current) return;
      setUploadError(
        error.response?.data?.detail || error.message || "Failed to load uploaded files"
      );
    }
  }, [pollIngestionStatus, syncUploadFlags]);

  useEffect(() => {
    isMountedRef.current = true;
    refreshUploadedFiles();

    return () => {
      isMountedRef.current = false;
      Object.values(pollingRefs.current).forEach(clearInterval);
      pollingRefs.current = {};
    };
  }, [refreshUploadedFiles]);

  // clears the syllabus text
  const clearSyllabus = useCallback(() => {
    setSyllabusText("");
  }, []);

  // clears all chat messages to start a fresh conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  const uploadDocument = useCallback(async (file) => {
    if (!file) return;

    setUploadError(null);
    setUploadedFiles((prev) => {
      const deduped = prev.filter((item) => item.name !== file.name);
      const next = [
        ...deduped,
        { name: file.name, progress: 0, status: "uploading", pages: 0, chunks: 0 },
      ];
      syncUploadFlags(next);
      return next;
    });

    try {
      await uploadPDF(file, (progress) => {
        if (!isMountedRef.current) return;
        setUploadedFiles((prev) => {
          const next = prev.map((item) =>
            item.name === file.name ? { ...item, progress } : item
          );
          syncUploadFlags(next);
          return next;
        });
      });

      setUploadedFiles((prev) => {
        const next = prev.map((item) =>
          item.name === file.name ? { ...item, status: "pending" } : item
        );
        syncUploadFlags(next);
        return next;
      });

      pollIngestionStatus(file.name);
    } catch (error) {
      if (!isMountedRef.current) return;

      const errorMsg = error.response?.data?.detail || error.message || "Upload failed";
      setUploadedFiles((prev) => {
        const next = prev.map((item) =>
          item.name === file.name
            ? { ...item, status: "failed", error: errorMsg }
            : item
        );
        syncUploadFlags(next);
        return next;
      });
      setUploadError(`Upload error: ${errorMsg}`);
    }
  }, [pollIngestionStatus, syncUploadFlags]);

  const removeUploadedDocument = useCallback(async (filename) => {
    try {
      await deletePDF(filename);

      if (pollingRefs.current[filename]) {
        clearInterval(pollingRefs.current[filename]);
        delete pollingRefs.current[filename];
      }

      if (!isMountedRef.current) return;

      setUploadedFiles((prev) => {
        const next = prev.filter((file) => file.name !== filename);
        syncUploadFlags(next);
        return next;
      });
      setUploadError(null);
    } catch (error) {
      if (!isMountedRef.current) return;
      setUploadError(
        `Failed to delete ${filename}: ${
          error.response?.data?.detail || error.message || "Unknown error"
        }`
      );
      throw error;
    }
  }, [syncUploadFlags]);

  const resetUploadedDocuments = useCallback(async () => {
    try {
      await resetPDFs();

      Object.values(pollingRefs.current).forEach(clearInterval);
      pollingRefs.current = {};

      if (!isMountedRef.current) return;

      setUploadedFiles([]);
      syncUploadFlags([]);
      setUploadError(null);
    } catch (error) {
      if (!isMountedRef.current) return;
      setUploadError(
        error.response?.data?.detail || error.message || "Failed to reset uploaded files"
      );
      throw error;
    }
  }, [syncUploadFlags]);

  const completedFiles = useMemo(
    () => uploadedFiles.filter((file) => file.status === "completed"),
    [uploadedFiles]
  );
  const completedFileNames = useMemo(
    () => completedFiles.map((file) => file.name),
    [completedFiles]
  );

  // memoize the context value so components dont re-render unnecessarily
  const contextValue = useMemo(() => ({
    // whether PDFs are indexed and ready
    indexed,
    setIndexed,
    // chat messages
    messages,
    setMessages,
    clearMessages,
    // syllabus and study settings
    syllabusText,
    setSyllabusText,
    clearSyllabus,
    marks,
    setMarks,
    uploadedFiles,
    completedFiles,
    completedFileNames,
    uploadBusy,
    uploadError,
    clearUploadError,
    refreshUploadedFiles,
    uploadDocument,
    removeUploadedDocument,
    resetUploadedDocuments,
  }), [
    indexed,
    messages,
    syllabusText,
    marks,
    clearMessages,
    clearSyllabus,
    uploadedFiles,
    completedFiles,
    completedFileNames,
    uploadBusy,
    uploadError,
    clearUploadError,
    refreshUploadedFiles,
    uploadDocument,
    removeUploadedDocument,
    resetUploadedDocuments,
  ]);

  // wrap all children with the context provider
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// shortcut hook so components can easily access the app state
export const useApp = () => useContext(AppContext);
