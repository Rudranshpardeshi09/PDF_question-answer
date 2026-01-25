import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export const uploadPDF = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/ingest/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress) {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress(percent);
      }
    },
  });
};

export const askQuestion = (question) => {
  return api.post("/qa/", { question });
};
