// import { useTheme } from "@/context/ThemeContext";
// import { Button } from "@/components/ui/button";

// export default function ThemeToggle() {
//   const { theme, setTheme } = useTheme();

//   return (
//     <Button
//       variant="outline"
//       size="sm"
//       onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//     >
//       {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
//     </Button>
//   );
// }
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border
        ${isDark
          ? "bg-black text-neon-400 border-neon-500 shadow-neon hover:shadow-neon-lg"
          : "bg-white text-gray-900 border-gray-300 shadow-sm"
        }`}
    >
      {isDark ? "☀ Light Mode" : "🌙 Dark Mode"}
    </motion.button>
  );
}
