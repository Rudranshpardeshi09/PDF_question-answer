import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const sections = [
  {
    id: 1,
    title: "Getting Started",
    icon: "🚀",
    steps: [
      {
        title: "Upload Your PDF",
        description: "Click the 'Upload PDF' button and select your study material. You can upload multiple PDFs for comprehensive coverage.",
        details: "The system supports PDF files up to 50MB. Make sure your PDFs are readable and contain text (scanned images work too with OCR).",
      },
      {
        title: "Upload Your Syllabus",
        description: "Upload your course syllabus or study guide. This helps the AI understand the structure and context of your course.",
        details: "The syllabus is parsed to extract key topics and units, organizing your study material effectively.",
      },
      {
        title: "Select Study Parameters",
        description: "Choose your unit, topic, and target marks. These filters help the AI generate focused, relevant questions.",
        details: "You can change these parameters anytime to practice different topics or adjust difficulty levels.",
      },
    ],
  },
  {
    id: 2,
    title: "How to Use the Study Tool",
    icon: "📚",
    steps: [
      {
        title: "Ask Questions",
        description: "Type any question related to your selected topic. The AI will search your uploaded materials and provide comprehensive answers.",
        details: "Questions are contextualized based on your unit, topic, and marks selection for targeted learning.",
      },
      {
        title: "Review Sources",
        description: "Each answer includes source references from your materials. Click on sources to see where information came from.",
        details: "Understanding sources helps you verify information and go back to original materials for deeper study.",
      },
      {
        title: "Practice Variations",
        description: "Ask follow-up questions, request different explanations, or explore related topics to strengthen your understanding.",
        details: "The conversational approach helps you learn naturally without rigid constraints.",
      },
    ],
  },
  {
    id: 3,
    title: "Advanced Features",
    icon: "⚡",
    steps: [
      {
        title: "Dark Mode",
        description: "Toggle dark mode for comfortable studying during any time. The beautiful neon green theme reduces eye strain.",
        details: "Your theme preference is saved automatically for your next session.",
      },
      {
        title: "Responsive Design",
        description: "Study on any device - mobile, tablet, or desktop. The interface adapts perfectly to your screen size.",
        details: "Seamlessly switch between devices without losing your conversation or selected parameters.",
      },
      {
        title: "Smart Memory",
        description: "The AI remembers your study context and maintains conversation continuity for natural interactions.",
        details: "Each session maintains context, making conversations flow naturally like studying with a tutor.",
      },
    ],
  },
  {
    id: 4,
    title: "Tips & Best Practices",
    icon: "💡",
    steps: [
      {
        title: "Be Specific",
        description: "Ask detailed questions about specific concepts. More context helps the AI provide better answers.",
        details: "Instead of 'Explain photosynthesis', try 'Explain the light-dependent reactions of photosynthesis with examples'.",
      },
      {
        title: "Use Follow-ups",
        description: "Build on answers with follow-up questions to deepen your understanding progressively.",
        details: "This mimics natural learning where you ask increasingly complex questions as you understand more.",
      },
      {
        title: "Review Regularly",
        description: "Go back and review previous conversations. Repetition is key to retention and understanding.",
        details: "The conversation history is saved for your reference and review anytime.",
      },
    ],
  },
];

function ExpandableStep({ step, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="mb-3 sm:mb-4 dark:border-emerald-500/30 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-black 
                       hover:dark:border-emerald-500/50 hover:dark:shadow-2xl hover:dark:shadow-emerald-500/10 cursor-pointer transition-all duration-300"
            onClick={() => setExpanded(!expanded)}>
        <CardHeader className="p-4 sm:p-6">
          <motion.div
            className="flex items-center justify-between gap-3"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <CardTitle className="flex items-center gap-3 text-sm sm:text-base dark:text-emerald-400">
              <span className="text-lg sm:text-2xl">{step.title}</span>
            </CardTitle>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </motion.div>
          </motion.div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-2 sm:mt-3">
            {step.description}
          </p>
        </CardHeader>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-emerald-500/20"
          >
            <CardContent className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {step.details}
              </p>
            </CardContent>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

export default function Tutorial() {
  return (
    <div className="w-full min-h-screen overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 
                    dark:from-black dark:via-gray-950 dark:to-gray-900">
      <motion.div
        className="max-w-4xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          className="mb-8 sm:mb-12 md:mb-16"
          variants={itemVariants}
        >
          <motion.div
            className="text-5xl sm:text-6xl md:text-7xl mb-4"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            📖
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-emerald-400 mb-3 sm:mb-4">
            Learn How to Use PDF RAG
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Master the art of smart studying with our AI-powered study assistant. Follow this guide to make the most of your learning experience.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12 md:mb-16"
          variants={itemVariants}
        >
          {[
            { label: "Sections", value: "4", icon: "📚" },
            { label: "Features", value: "10+", icon: "⚡" },
            { label: "Device Support", value: "All", icon: "📱" },
            { label: "24/7 Available", value: "Yes", icon: "🕐" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="p-4 sm:p-6 rounded-lg bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-black 
                         border border-gray-200 dark:border-emerald-500/30 shadow-sm dark:shadow-xl dark:shadow-emerald-500/10"
              whileHover={{ y: -5, shadow: "0 20px 25px -5 rgba(16, 185, 129, 0.1)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-3xl sm:text-4xl mb-2">{stat.icon}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-emerald-400">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Sections */}
        <div className="space-y-8 sm:space-y-12">
          {sections.map((section, sectionIdx) => (
            <motion.div
              key={section.id}
              variants={itemVariants}
              viewport={{ once: true, margin: "-100px" }}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
            >
              {/* Section Header */}
              <motion.div
                className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-4xl sm:text-5xl">{section.icon}</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-emerald-400">
                    {section.title}
                  </h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full mt-2"></div>
                </div>
              </motion.div>

              {/* Steps */}
              <div className="space-y-3 sm:space-y-4">
                {section.steps.map((step, stepIdx) => (
                  <ExpandableStep
                    key={stepIdx}
                    step={step}
                    index={stepIdx}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          className="mt-12 sm:mt-16 md:mt-20 p-6 sm:p-8 md:p-10 rounded-xl bg-gradient-to-r from-emerald-400/10 to-emerald-500/10 
                     dark:from-emerald-500/20 dark:to-emerald-600/20 border border-emerald-200 dark:border-emerald-500/30
                     text-center"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <motion.h3
            className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-emerald-400 mb-3 sm:mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Ready to Start Learning? 🎓
          </motion.h3>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
            Go back to the Study Tool and start uploading your materials to begin your personalized learning journey.
          </p>
          <motion.button
            className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base 
                       bg-gradient-to-r from-emerald-400 to-emerald-500 text-black dark:text-white
                       hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go to Study Tool →
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-12 sm:mt-16 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400"
          variants={itemVariants}
        >
          <p>Need help? Check our documentation or contact support for assistance.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
