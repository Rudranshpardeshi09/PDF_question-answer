// this file handles all API calls to our backend server
import axios from "axios";

// the backend URL - uses environment variable if set, otherwise defaults to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// creating an axios instance with default settings for all our API calls
const api = axios.create({
  baseURL: API_URL,
  // reasonable timeout for most requests (5 minutes for large file uploads)
  timeout: 5 * 60 * 1000,
  // no limits on file size for PDF uploads
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// request counter to prevent duplicate submissions
let requestInProgress = new Map();

// this catches any API errors and handles them consistently
api.interceptors.response.use(
  response => {
    // clear the request tracking
    const key = `${response.config.method}-${response.config.url}`;
    requestInProgress.delete(key);
    return response;
  },
  error => {
    // log unauthorized access attempts
    if (error.response?.status === 401) {
      console.error("Unauthorized access");
    }
    
    // clear the request tracking on error too
    const key = error.config ? `${error.config.method}-${error.config.url}` : "unknown";
    requestInProgress.delete(key);
    
    return Promise.reject(error);
  }
);

// checks the processing status of uploaded PDFs
export const getIngestStatus = (filename) => {
  if (filename) {
    if (typeof filename !== "string") {
      return Promise.reject(new Error("Invalid filename"));
    }
    return api.get("/ingest/status", { params: { filename: encodeURIComponent(filename) } });
  }
  return api.get("/ingest/status");
};

// uploads a PDF file to the backend for processing
export const uploadPDF = (file, onProgress) => {
  // validate file input
  if (!file || !(file instanceof File || file instanceof Blob)) {
    return Promise.reject(new Error("Invalid file provided"));
  }
  
  if (file.size === 0) {
    return Promise.reject(new Error("File is empty"));
  }
  
  // check file size (50MB limit)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return Promise.reject(new Error(`File too large (max 50MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB)`));
  }
  
  // validate file type
  const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
    return Promise.reject(new Error("Only PDF and DOCX files are allowed"));
  }

  // wrap the file in FormData since thats what the backend expects
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/ingest/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    // report upload progress to show the progress bar
    onUploadProgress: (e) => {
      if (onProgress && e.total > 0) {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress(Math.min(percent, 99))  // cap at 99% until server confirms
      }
    },
  });
};

// uploads a syllabus file (PDF or DOCX) and gets back parsed topics
export const uploadSyllabus = (file) => {
  // validate input
  if (!file || !(file instanceof File || file instanceof Blob)) {
    return Promise.reject(new Error("Invalid file provided"));
  }
  
  const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
    return Promise.reject(new Error("Only PDF and DOCX syllabus files are allowed"));
  }
  
  const form = new FormData();
  form.append("file", file);
  return api.post("/syllabus/upload", form);
};

// sends a question to the backend and gets an AI-generated answer
export const askQuestion = (question, syllabusContext = "", marks = 3, chatHistory = []) => {
  // make sure the question is valid before sending
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return Promise.reject(new Error("Question cannot be empty"));
  }
  
  if (question.trim().length > 1000) {
    return Promise.reject(new Error("Question is too long (max 1000 characters)"));
  }
  
  if (typeof marks !== "number" || marks < 1 || marks > 100) {
    return Promise.reject(new Error("Marks must be between 1 and 100"));
  }

  // prevent duplicate submissions
  const requestKey = `ask-${question.slice(0, 20)}`;
  if (requestInProgress.has(requestKey)) {
    return Promise.reject(new Error("Question already being processed. Please wait."));
  }
  requestInProgress.set(requestKey, true);

  // clean up chat history to only include relevant messages
  const formattedHistory = chatHistory
    .filter(msg => msg && msg.role && msg.content && (msg.role === "user" || msg.role === "assistant"))
    .map(msg => ({
      role: msg.role,
      content: msg.content.toString().trim()
    }))
    .slice(-10);  // limit to last 10 messages

  // send the question along with context and history to the backend
  return api.post("/qa/ask", {
    question: question.trim(),
    syllabus_context: syllabusContext && syllabusContext.trim() ? syllabusContext.trim() : null,
    marks,
    chat_history: formattedHistory.length > 0 ? formattedHistory : null,
  }).finally(() => {
    // always clear the request tracking
    requestInProgress.delete(requestKey);
  });
};

// deletes a specific PDF from the backend
export const deletePDF = (filename) => {
  if (!filename || typeof filename !== "string") {
    return Promise.reject(new Error("Invalid filename"));
  }
  return api.delete(`/ingest/delete/${encodeURIComponent(filename)}`);
};

// deletes ALL PDFs and resets everything
export const resetPDFs = () => api.delete("/ingest/reset");
