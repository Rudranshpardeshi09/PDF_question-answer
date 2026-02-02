import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Tutorial from "./pages/Tutorial";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <ThemeProvider>
      <AppProvider>
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-neutral-950 dark:to-black transition-colors duration-300">
          <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {currentPage === "home" && <Home />}
            {currentPage === "tutorial" && <Tutorial />}
          </div>
          <Footer />
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}
