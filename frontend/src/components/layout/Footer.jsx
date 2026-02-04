// import { motion } from "framer-motion";

// export default function Footer() {
//   const currentYear = new Date().getFullYear();

//   const footerLinks = [
//     { label: "About", href: "#" },
//     { label: "Documentation", href: "#" },
//     { label: "Contact", href: "#" },
//     { label: "Privacy Policy", href: "#" },
//   ];

//   return (
//     <motion.footer
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="border-t border-gray-200 dark:border-emerald-500/30 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 dark:shadow-xl dark:shadow-emerald-500/10 py-8 sm:py-12 px-4 sm:px-6 lg:px-8"
//     >
//       <div className="max-w-7xl mx-auto">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 mb-8">
//           {/* Brand Section */}
//           <motion.div
//             whileHover={{ y: -5 }}
//             transition={{ duration: 0.3 }}
//             className="col-span-1 sm:col-span-2 lg:col-span-1"
//           >
//             <div className="flex items-center gap-2 mb-4">
//               <span className="text-3xl">🚀</span>
//               <div>
//                 <h3 className="font-bold text-lg text-gray-900 dark:text-emerald-400">
//                   PDF RAG
//                 </h3>
//                 <p className="text-sm text-gray-600 dark:text-emerald-300/70">
//                   Study Assistant
//                 </p>
//               </div>
//             </div>
//             <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
//               Master the art of smart studying with our AI-powered study assistant powered by advanced RAG technology.
//             </p>
//           </motion.div>

//           {/* Quick Links */}
//           <motion.div
//             whileHover={{ y: -5 }}
//             transition={{ duration: 0.3 }}
//             className="col-span-1"
//           >
//             <h4 className="font-semibold text-gray-900 dark:text-emerald-400 mb-4 text-sm">
//               Quick Links
//             </h4>
//             <ul className="space-y-2">
//               {footerLinks.slice(0, 2).map((link) => (
//                 <li key={link.label}>
//                   <a
//                     href={link.href}
//                     className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200"
//                   >
//                     {link.label}
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </motion.div>

//           {/* Support */}
//           <motion.div
//             whileHover={{ y: -5 }}
//             transition={{ duration: 0.3 }}
//             className="col-span-1"
//           >
//             <h4 className="font-semibold text-gray-900 dark:text-emerald-400 mb-4 text-sm">
//               Support
//             </h4>
//             <ul className="space-y-2">
//               {footerLinks.slice(2).map((link) => (
//                 <li key={link.label}>
//                   <a
//                     href={link.href}
//                     className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200"
//                   >
//                     {link.label}
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </motion.div>

//           {/* Social Links */}
//           <motion.div
//             whileHover={{ y: -5 }}
//             transition={{ duration: 0.3 }}
//             className="col-span-1"
//           >
//             <h4 className="font-semibold text-gray-900 dark:text-emerald-400 mb-4 text-sm">
//               Follow Us
//             </h4>
//             <div className="flex gap-4">
//               {[
//                 { icon: "𝕏", label: "Twitter" },
//                 { icon: "📘", label: "Facebook" },
//                 { icon: "💼", label: "LinkedIn" },
//                 { icon: "🐙", label: "GitHub" },
//               ].map((social) => (
//                 <motion.a
//                   key={social.label}
//                   href="#"
//                   className="text-2xl text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200"
//                   whileHover={{ scale: 1.2 }}
//                   whileTap={{ scale: 0.95 }}
//                   title={social.label}
//                 >
//                   {social.icon}
//                 </motion.a>
//               ))}
//             </div>
//           </motion.div>
//         </div>

//         {/* Divider */}
//         <div className="border-t border-gray-200 dark:border-emerald-500/20 my-6 sm:my-8" />

//         {/* Bottom Section */}
//         <motion.div
//           className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.2 }}
//         >
//           <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
//             <span className="text-emerald-500 dark:text-emerald-400">✨</span>
//             {" "}© {currentYear} PDF RAG Study Assistant. All rights reserved.
//           </p>
//           <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
//             Made with{" "}
//             <span className="text-emerald-500 dark:text-emerald-400 text-base">💚</span>
//             {" "}for students worldwide
//           </p>
//         </motion.div>

//         {/* Premium Design Accent */}
//         <motion.div
//           className="mt-6 sm:mt-8 text-center"
//           animate={{ opacity: [0.5, 1] }}
//           transition={{ repeat: Infinity, duration: 3 }}
//         >
//           <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">
//             Powered by Advanced RAG Technology
//           </p>
//         </motion.div>
//       </div>
//     </motion.footer>
//   );
// }
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="border-t border-gray-200 dark:border-neon-500/30 bg-gray-50 dark:bg-black/50 py-2 sm:py-2.5 px-2 sm:px-3 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Single Row Layout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          {/* Left Section */}
          <div className="flex items-center gap-1.5">
            <span className="text-base">🚀</span>
            <p className="text-xs text-gray-600 dark:text-neutral-400">
              © {currentYear} PDF RAG
            </p>
          </div>

          {/* Center Section */}
          {/* <p className="text-xs text-gray-500 dark:text-neutral-500 hidden sm:block">
            Made with <span className="text-emerald-500 dark:text-neon-400">💚</span>
          </p> */}

          {/* Right Section - Social Links */}
          <div className="flex gap-2">
            {[
              { icon: "💼", label: "LinkedIn", href: "https://www.linkedin.com/in/rudransh-pardeshi-666ba9266?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
              { icon: "🐙", label: "GitHub", href: "https://github.com/Rudranshpardeshi09" },
            ].map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                className="text-xs text-gray-500 dark:text-neutral-400 hover:text-emerald-500 dark:hover:text-neon-400 transition-colors duration-200"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                title={social.label}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Bottom Accent - Hidden on mobile */}
        <motion.p
          className="text-xs text-emerald-500/60 dark:text-neon-400/70 text-center mt-1 hidden sm:block"
          animate={{ opacity: [0.6, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          Powered by RAG
        </motion.p>
      </div>
    </motion.footer>
  );
}