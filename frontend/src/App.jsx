// this is the root component of the entire application
import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import MindMap from "./pages/MindMap";
import Tutorial from "./pages/Tutorial";

export default function App() {
  // keeps track of which page the user is on (home or tutorial)
  const [currentPage, setCurrentPage] = useState("home");

  return (
    // wrapping everything in theme and app providers for global state access
    <ThemeProvider>
      <AppProvider>
        {/* main container takes full screen height with gradient background */}
        <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-neutral-950 dark:to-black transition-colors duration-300">
          {/* top navigation bar - stays at the top */}
          <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />

          {/* main content area - grows to fill space between nav and footer */}
          <main className="flex-1 min-h-0 overflow-hidden">
            {currentPage === "home" && <Home />}
            {currentPage === "mindmap" && <MindMap />}
            {currentPage === "tutorial" && <Tutorial />}
          </main>

          {/* footer - stays at the bottom */}
          <Footer />
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}
