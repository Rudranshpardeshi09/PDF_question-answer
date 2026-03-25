// this component renders the interactive mind map using React Flow
// it converts the JSON tree structure into nodes and edges with a tree layout

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  FileJson,
  FileImage,
  FileText,
  ChevronDown,
  ChevronRight,
  Maximize2,
} from "lucide-react";

// custom node component that shows title + description with expand/collapse
function MindMapNodeComponent({ data }) {
  const isRoot = data.depth === 0;
  const hasChildren = data.childCount > 0;

  // different colors based on depth level
  const depthColors = [
    "from-blue-600 to-indigo-600 dark:from-neon-400 dark:to-neon-600",
    "from-violet-500 to-purple-600 dark:from-purple-400 dark:to-purple-600",
    "from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-cyan-600",
    "from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-emerald-600",
  ];

  const bgColors = [
    "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-800 border-blue-200 dark:border-neon-500/40",
    "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-neutral-900 dark:to-neutral-850 border-violet-200 dark:border-purple-500/40",
    "bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-neutral-900 dark:to-neutral-850 border-cyan-200 dark:border-cyan-500/40",
    "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-neutral-900 dark:to-neutral-850 border-emerald-200 dark:border-emerald-500/40",
  ];

  const colorIdx = Math.min(data.depth, depthColors.length - 1);

  return (
    <div
      className={`rounded-xl border-2 shadow-lg transition-all duration-200 hover:shadow-xl
        ${isRoot ? "min-w-[240px] max-w-[320px]" : "min-w-[180px] max-w-[260px]"}
        ${bgColors[colorIdx]}`}
      style={{ cursor: hasChildren ? "pointer" : "default" }}
      onClick={data.onToggle}
    >
      {/* title bar */}
      <div
        className={`px-3 py-2 rounded-t-lg bg-gradient-to-r ${depthColors[colorIdx]} 
          flex items-center gap-2`}
      >
        {hasChildren && (
          <span className="text-white/80">
            {data.collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        )}
        <span
          className={`font-semibold text-white leading-tight
            ${isRoot ? "text-sm" : "text-xs"}`}
        >
          {data.label}
        </span>
      </div>

      {/* description */}
      {data.description && (
        <div className="px-3 py-2">
          <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
            {data.description}
          </p>
        </div>
      )}

      {/* collapsed children indicator */}
      {hasChildren && data.collapsed && (
        <div className="px-3 pb-2">
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 italic">
            +{data.childCount} subtopics
          </span>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { mindMapNode: MindMapNodeComponent };

// converts recursive mind map JSON into flat React Flow nodes and edges
function convertTreeToFlow(tree, collapsedNodes) {
  const nodes = [];
  const edges = [];

  if (!tree || !tree.title) return { nodes, edges };

  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 100;
  const H_GAP = 60;
  const V_GAP = 30;

  // first pass: calculate subtree sizes
  function getSubtreeSize(node, nodeId, depth) {
    const isCollapsed = collapsedNodes.has(nodeId);
    const children = node.children || [];

    if (children.length === 0 || isCollapsed) {
      return { width: NODE_WIDTH, height: NODE_HEIGHT };
    }

    let totalHeight = 0;
    const childSizes = [];

    for (let i = 0; i < children.length; i++) {
      const childId = `${nodeId}-${i}`;
      const childSize = getSubtreeSize(children[i], childId, depth + 1);
      childSizes.push(childSize);
      totalHeight += childSize.height;
      if (i > 0) totalHeight += V_GAP;
    }

    return {
      width: NODE_WIDTH + H_GAP + Math.max(...childSizes.map((s) => s.width)),
      height: Math.max(NODE_HEIGHT, totalHeight),
      childSizes,
    };
  }

  // second pass: position nodes
  function positionNode(node, nodeId, depth, x, y, availableHeight) {
    const isCollapsed = collapsedNodes.has(nodeId);
    const children = node.children || [];

    nodes.push({
      id: nodeId,
      type: "mindMapNode",
      position: { x, y: y + availableHeight / 2 - NODE_HEIGHT / 2 },
      data: {
        label: node.title,
        description: node.description || "",
        depth,
        collapsed: isCollapsed,
        childCount: children.length,
        onToggle: undefined, // will be set via callback
      },
      sourcePosition: "right",
      targetPosition: "left",
    });

    if (children.length === 0 || isCollapsed) return;

    const subtreeInfo = getSubtreeSize(node, nodeId, depth);
    const childSizes = subtreeInfo.childSizes || [];

    let currentY = y;
    for (let i = 0; i < children.length; i++) {
      const childId = `${nodeId}-${i}`;
      const childHeight = childSizes[i]?.height || NODE_HEIGHT;

      edges.push({
        id: `e-${nodeId}-${childId}`,
        source: nodeId,
        target: childId,
        type: "smoothstep",
        style: {
          stroke: depth === 0 ? "#6366f1" : depth === 1 ? "#8b5cf6" : "#06b6d4",
          strokeWidth: Math.max(2, 3 - depth),
        },
        animated: depth === 0,
      });

      positionNode(children[i], childId, depth + 1, x + NODE_WIDTH + H_GAP, currentY, childHeight);
      currentY += childHeight + V_GAP;
    }
  }

  const rootSize = getSubtreeSize(tree, "root", 0);
  positionNode(tree, "root", 0, 0, 0, rootSize.height);

  return { nodes, edges };
}

export default function MindMapViewer({ mindmapData, isLoading }) {
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const flowRef = useRef(null);

  // toggle collapse/expand for a node
  const toggleNode = useCallback((nodeId) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // convert tree to React Flow format
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!mindmapData?.mindmap) return { flowNodes: [], flowEdges: [] };

    const { nodes, edges } = convertTreeToFlow(mindmapData.mindmap, collapsedNodes);

    // inject toggle callbacks into node data
    const enrichedNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onToggle: () => toggleNode(node.id),
      },
    }));

    return { flowNodes: enrichedNodes, flowEdges: edges };
  }, [mindmapData, collapsedNodes, toggleNode]);

  const [nodes, , onNodesChange] = useNodesState(flowNodes);
  const [edges, , onEdgesChange] = useEdgesState(flowEdges);

  // re-sync when mindmap data changes
  useMemo(() => {
    if (flowNodes.length > 0) {
      onNodesChange(
        flowNodes.map((n) => ({ type: "reset", item: n }))
      );
      onEdgesChange(
        flowEdges.map((e) => ({ type: "reset", item: e }))
      );
    }
  }, [flowNodes, flowEdges]);

  // download handlers
  const downloadJSON = useCallback(() => {
    if (!mindmapData) return;
    const blob = new Blob([JSON.stringify(mindmapData.mindmap, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mindmapData.title || "mindmap"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  }, [mindmapData]);

  const downloadPNG = useCallback(async () => {
    try {
      const { toPng } = await import("html-to-image");
      const el = document.querySelector(".react-flow");
      if (!el) return;
      const dataUrl = await toPng(el, {
        backgroundColor: "#0a0a0a",
        quality: 1,
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${mindmapData?.title || "mindmap"}.png`;
      a.click();
    } catch (e) {
      console.error("PNG export failed:", e);
    }
    setShowDownloadMenu(false);
  }, [mindmapData]);

  const downloadPDF = useCallback(async () => {
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");
      const el = document.querySelector(".react-flow");
      if (!el) return;
      const dataUrl = await toPng(el, {
        backgroundColor: "#0a0a0a",
        quality: 1,
        pixelRatio: 2,
      });
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, "PNG", 10, 10, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 20));
      pdf.save(`${mindmapData?.title || "mindmap"}.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
    }
    setShowDownloadMenu(false);
  }, [mindmapData]);

  // empty / loading states
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-gray-200 dark:border-neutral-800">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-12 h-12 border-4 border-blue-500 dark:border-neon-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Generating mind map...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!mindmapData) {
    return (
      <div className="h-full flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-gray-200 dark:border-neutral-800">
        <div className="text-center px-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-blue-400 dark:text-neon-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-neutral-300 mb-2">
            No Mind Map Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-500 max-w-xs">
            Select a source document or paste text, then click Generate to
            create your mind map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800">
      <ReactFlow
        ref={flowRef}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-gradient-to-br from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900"
      >
        <Background
          color="#e5e7eb"
          gap={20}
          size={1}
          className="dark:opacity-20"
        />
        <Controls
          className="!bg-white/90 dark:!bg-neutral-800/90 !border-gray-200 dark:!border-neutral-700 !rounded-lg !shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-white/80 dark:!bg-neutral-800/80 !border-gray-200 dark:!border-neutral-700 !rounded-lg"
          nodeColor="#6366f1"
          maskColor="rgba(0,0,0,0.1)"
        />

        {/* top right panel: title + download */}
        <Panel position="top-right" className="flex items-center gap-2">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-200 dark:border-neutral-700 shadow-sm">
            <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">
              {mindmapData.title}
            </span>
          </div>

          <div className="relative">
            <motion.button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="p-2 rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-gray-200 dark:border-neutral-700 shadow-sm
                text-gray-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-neon-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {showDownloadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-xl overflow-hidden z-50 min-w-[140px]"
                >
                  {[
                    { icon: FileImage, label: "PNG Image", action: downloadPNG },
                    { icon: FileText, label: "PDF File", action: downloadPDF },
                    { icon: FileJson, label: "JSON Data", action: downloadJSON },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-neutral-300
                        hover:bg-blue-50 dark:hover:bg-neutral-700 transition-colors text-left"
                    >
                      <item.icon className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
