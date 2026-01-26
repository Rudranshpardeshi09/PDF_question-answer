// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useApp } from "@/context/AppContext";

// export default function StudyControls({ syllabus }) {
//     const {
//         unit,
//         setUnit,
//         topic,
//         setTopic,
//         marks,
//         setMarks,
//     } = useApp();

//     if (!Object.keys(syllabus).length) {
//     return (
//       <p className="text-sm text-muted-foreground">
//         Upload syllabus to enable unit & topic selection
//       </p>
//     );
//   }
//     return (
//         <div className="grid grid-cols-3 gap-4">
//             <select value={unit} onChange={(e) => setUnit(e.target.value)}>
//                 <option value="">Select Unit</option>
//                 {Object.keys(syllabus).map((u) => (
//                     <option key={u} value={u}>{u}</option>
//                 ))}
//             </select>

//             <select value={topic} onChange={(e) => setTopic(e.target.value)}>
//                 <option value="">Select Topic</option>
//                 {syllabus[unit]?.map((t) => (
//                     <option key={t} value={t}>{t}</option>
//                 ))}
//             </select>

//             <select value={marks} onChange={(e) => setMarks(Number(e.target.value))}>
//                 <option value={3}>3 Marks</option>
//                 <option value={5}>5 Marks</option>
//                 <option value={12}>12 Marks</option>
//             </select>
//         </div>
//     );
// }

import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } },
};

const infoVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function StudyControls() {
  const {
    syllabusData,
    unit,
    setUnit,
    topic,
    setTopic,
    marks,
    setMarks,
  } = useApp();

  const units = syllabusData?.units || [];
  const selectedUnitData = units.find((u) => u.name === unit);
  const topics = selectedUnitData?.topics || [];

  if (!syllabusData || units.length === 0) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600">
              📚 Upload syllabus to enable unit & topic selection
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const marksConfig = {
    3: { label: "3 Marks (Short)", color: "from-blue-600 to-blue-700", icon: "📝" },
    5: { label: "5 Marks (Medium)", color: "from-indigo-600 to-indigo-700", icon: "📄" },
    12: { label: "12 Marks (Long)", color: "from-purple-600 to-purple-700", icon: "📚" },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col"
    >
      <Card className="flex-1 shadow-lg border-0 bg-gradient-to-br from-white to-orange-50 hover:shadow-xl transition-shadow flex flex-col">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Study Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5 flex-1 flex flex-col">
          
          {/* UNIT SELECTION */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-sm font-semibold text-gray-700 block">
              📖 Select Unit
            </label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="border-2 border-blue-300 bg-blue-50 focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Choose a unit..." />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.name} value={u.name}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* TOPIC SELECTION */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="text-sm font-semibold text-gray-700 block">
              🔖 Select Topic
            </label>
            <Select
              value={topic}
              onValueChange={setTopic}
              disabled={!unit || topics.length === 0}
            >
              <SelectTrigger className={`border-2 focus:ring-2 ${
                !unit || topics.length === 0
                  ? "border-gray-300 bg-gray-50 opacity-50"
                  : "border-indigo-300 bg-indigo-50 focus:ring-indigo-500"
              }`}>
                <SelectValue placeholder="Select a topic..." />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t, i) => (
                  <SelectItem key={i} value={t}>
                    {t.substring(0, 60)}
                    {t.length > 60 ? "..." : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* MARKS SELECTION */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <label className="text-sm font-semibold text-gray-700 block">
              ⏱️ Answer Length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 12].map((m) => (
                <motion.button
                  key={m}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMarks(m)}
                  className={`py-2 px-2 rounded-lg font-semibold text-xs transition-all ${
                    marks === m
                      ? `bg-gradient-to-r ${marksConfig[m].color} text-white shadow-lg`
                      : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {marksConfig[m].icon} {m}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* INFO BOX */}
          <AnimatePresence>
            {selectedUnitData && (
              <motion.div
                variants={infoVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex-1 flex items-end"
              >
                <div className="w-full bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 p-3 rounded-lg space-y-1">
                  <p className="text-xs font-bold text-amber-900">
                    📊 Unit Information
                  </p>
                  <p className="text-xs text-amber-800">
                    <strong>{unit}</strong> • {topics.length} topics
                  </p>
                  <p className="text-xs text-amber-800">
                    Format: <strong className="capitalize">{selectedUnitData.format}</strong>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
