import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

export default function Navigation({ currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Study Tool", icon: "📚" },
    { id: "tutorial", label: "Tutorial", icon: "📖" },
  ];

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-emerald-500/20 dark:border-neon-500/30 
                 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-black dark:via-neutral-950 dark:to-black 
                 shadow-lg dark:shadow-2xl dark:shadow-neon/20 backdrop-blur-xl transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          {/* Logo/Title */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl sm:text-3xl">🚀</div>
            <div>
              <h1 className="font-bold text-base sm:text-lg md:text-xl text-gray-900 dark:text-neon-400 
                           leading-tight hidden xs:block">
                PDF RAG
              </h1>
              <h1 className="font-bold text-base sm:text-lg md:text-xl text-gray-900 dark:text-neon-400 
                           leading-tight xs:hidden">
                RAG
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-neon-300/80 leading-tight">
                Study Assistant
              </p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-center mx-8">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                  ${currentPage === item.id
                    ? "text-emerald-400 dark:text-neon-400 bg-emerald-500/10 dark:bg-neon-500/20"
                    : "text-gray-700 dark:text-neutral-300 hover:text-emerald-500 dark:hover:text-neon-400"
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
                {currentPage === item.id && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-neon-400 dark:to-neon-500 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 40 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          {/* Right Side - Theme Toggle & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-neutral-300 
                       hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors duration-200"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
                <motion.div
                  className="w-full h-0.5 bg-current rounded"
                  animate={mobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                />
                <motion.div
                  className="w-full h-0.5 bg-current rounded"
                  animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                />
                <motion.div
                  className="w-full h-0.5 bg-current rounded"
                  animate={mobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                />
              </div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-neon-500/20 bg-gray-50 dark:bg-neutral-950"
            >
              <nav className="flex flex-col py-2 gap-1 px-2">
                {navItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300
                      ${currentPage === item.id
                        ? "text-emerald-400 dark:text-neon-400 bg-emerald-500/10 dark:bg-neon-500/20"
                        : "text-gray-700 dark:text-neutral-300 hover:text-neon-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                      }`}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </motion.button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
