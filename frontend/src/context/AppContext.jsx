import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [indexed, setIndexed] = useState(false);
  const [messages, setMessages] = useState([]);

  // 🔥 STUDY MODE STATE - ENHANCED FOR NEW SYLLABUS STRUCTURE
  const [subject, setSubject] = useState("");           // Subject from syllabus
  const [syllabusData, setSyllabusData] = useState(null); // Full parsed syllabus
  const [unit, setUnit] = useState("");                  // Selected unit
  const [topic, setTopic] = useState("");                // Selected topic
  const [marks, setMarks] = useState(3);                 // Answer marks (3/5/12)

  return (
    <AppContext.Provider
      value={{
        indexed,
        setIndexed,
        messages,
        setMessages,

        // Syllabus data
        subject,
        setSubject,
        syllabusData,
        setSyllabusData,

        // Study selection
        unit,
        setUnit,
        topic,
        setTopic,
        marks,
        setMarks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
