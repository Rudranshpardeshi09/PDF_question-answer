import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [indexed, setIndexed] = useState(false);
  const [messages, setMessages] = useState([]);

  return (
    <AppContext.Provider
      value={{
        indexed,
        setIndexed,
        messages,
        setMessages,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
