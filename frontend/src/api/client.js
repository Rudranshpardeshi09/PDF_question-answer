import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

/**
 * Upload a PDF document for indexing
 * @param {File} file - PDF file to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} Response with status, filename, pages, chunks
 */
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

/**
 * Upload and parse a syllabus (PDF or DOCX)
 * @param {File} file - Syllabus file
 * @returns {Promise} Response with subject, units[], topics[], formats
 */
export const uploadSyllabus = (file) => {
  const form = new FormData();
  form.append("file", file);

  return axios.post("http://localhost:8000/syllabus/upload", form);
};

/**
 * Ask a question about the indexed PDF
 * @param {string} question - The question to ask
 * @param {string} subject - Subject from syllabus
 * @param {string} unit - Selected unit
 * @param {string} topic - Selected topic
 * @param {number} marks - Answer marks (3, 5, or 12)
 * @returns {Promise} Response with answer, pages, sources
 */
export const askQuestion = (question, subject, unit, topic, marks) =>
  api.post("/qa", {
    question,
    subject,
    unit,
    topic,
    marks,
  });

