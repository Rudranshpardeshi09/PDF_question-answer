// this is the root component of the entire application
import { Suspense, lazy, useState } from "react";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import Landing from "./pages/Landing";

const Home = lazy(() => import("./pages/Home"));
const MindMap = lazy(() => import("./pages/MindMap"));
const Tutorial = lazy(() => import("./pages/Tutorial"));

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");

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
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-neutral-400">
                  Loading workspace...
                </div>
              }
            >
              {currentPage === "landing" && <Landing onNavigate={setCurrentPage} />}
              {currentPage === "study" && <Home onNavigate={setCurrentPage} />}
              {currentPage === "mindmap" && <MindMap />}
              {currentPage === "tutorial" && <Tutorial />}
            </Suspense>
          </main>

          {/* footer - stays at the bottom */}
          <Footer />
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}
