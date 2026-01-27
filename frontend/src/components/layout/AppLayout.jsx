import { motion } from "framer-motion";

export default function AppLayout({ children }) {
  return (
    <div className="w-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 
                    dark:from-black dark:via-gray-950 dark:to-gray-900">
      <main className="w-full">{children}</main>
    </div>
  );
}
