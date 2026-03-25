import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileImage,
  FileJson,
  FileText,
  Maximize2,
  MousePointerClick,
  Sparkles,
} from "lucide-react";

const DEPTH_STYLES = [
  {
    shell: "rounded-[26px] border-blue-300 bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_100%)] text-white shadow-sm",
    title: "text-base font-black tracking-tight text-white",
    description: "text-[11px] leading-5 text-blue-50/95",
    bullet: "bg-white/15 text-blue-50",
    minWidth: "min-w-[280px] max-w-[340px]",
  },
  {
    shell: "rounded-[22px] border-sky-300 bg-[linear-gradient(135deg,#f8fbff_0%,#e0f2fe_100%)] text-slate-900 shadow-sm dark:border-sky-400/35 dark:bg-[linear-gradient(135deg,#172554_0%,#0f172a_100%)] dark:text-white",
    title: "text-sm font-extrabold tracking-tight text-sky-950 dark:text-sky-50",
    description: "text-[11px] leading-5 text-sky-900/80 dark:text-sky-50/80",
    bullet: "bg-sky-100 text-sky-900 dark:bg-white/15 dark:text-sky-50",
    minWidth: "min-w-[240px] max-w-[300px]",
  },
  {
    shell: "border-teal-300 bg-[linear-gradient(135deg,#f7fffd_0%,#d1fae5_100%)] text-slate-900 shadow-sm dark:border-teal-400/35 dark:bg-[linear-gradient(135deg,#134e4a_0%,#0f172a_100%)] dark:text-white",
    title: "text-sm font-bold tracking-tight text-teal-950 dark:text-teal-50",
    description: "text-[11px] leading-5 text-teal-900/80 dark:text-teal-50/75",
    bullet: "bg-teal-100 text-teal-900 dark:bg-white/15 dark:text-teal-50",
    minWidth: "min-w-[220px] max-w-[280px]",
    clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)",
  },
  {
    shell: "rounded-[18px] border-slate-300 bg-[linear-gradient(135deg,#ffffff_0%,#f3f4f6_100%)] text-slate-900 shadow-sm dark:border-slate-500/35 dark:bg-[linear-gradient(135deg,#1e293b_0%,#0f172a_100%)] dark:text-white",
    title: "text-xs font-bold uppercase tracking-[0.12em] text-slate-800 dark:text-slate-50",
    description: "text-[10px] leading-5 text-slate-600 dark:text-slate-100/75",
    bullet: "bg-slate-100 text-slate-800 dark:bg-white/15 dark:text-slate-50",
    minWidth: "min-w-[210px] max-w-[260px]",
  },
];

const NODE_WIDTHS = [300, 270, 250, 240];
const NODE_HEIGHTS = [170, 170, 165, 150];
const H_GAP = 170;
const V_GAP = 72;

const MindMapNodeComponent = memo(function MindMapNodeComponent({ data }) {
  const style = DEPTH_STYLES[Math.min(data.depth, DEPTH_STYLES.length - 1)];
  const isRoot = data.depth === 0;
  const hasChildren = data.childCount > 0;

  return (
    <div
      className={`group relative border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.shell} ${style.minWidth} ${
        data.isSelected ? "ring-2 ring-blue-300 dark:ring-sky-400/40" : ""
      }`}
      style={style.clipPath ? { clipPath: style.clipPath } : undefined}
      onClick={data.onToggle}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-full ${
          isRoot
            ? "bg-blue-200/70"
            : data.depth === 1
              ? "bg-sky-300/80 dark:bg-sky-300/60"
              : data.depth === 2
                ? "bg-teal-300/80 dark:bg-teal-300/60"
                : "bg-slate-300/80 dark:bg-slate-300/50"
        }`}
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.0),rgba(255,255,255,0.7),rgba(255,255,255,0.0))] opacity-40" />

      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-2">
          {hasChildren && (
            <span
              className={`mt-0.5 rounded-full p-1 ${
                isRoot
                  ? "bg-white/15 text-white"
                  : "bg-slate-900/5 text-slate-500 dark:bg-white/10 dark:text-neutral-200"
              }`}
            >
              {data.collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </span>
          )}

          <div className="min-w-0 flex-1">
            {data.childCount > 0 && (
              <div
                className={`mb-2 text-[10px] font-semibold ${
                  isRoot ? "text-blue-50/80" : "text-slate-500 dark:text-neutral-400"
                }`}
              >
                {data.childCount} connected
              </div>
            )}
            <h3 className={style.title}>{data.label}</h3>
            {data.description && (
              <p className={`mt-2 ${style.description}`}>{data.description}</p>
            )}
          </div>
        </div>

        {data.bulletPoints?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.bulletPoints.map((point) => (
              <span
                key={point}
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm ${style.bullet}`}
              >
                - {point}
              </span>
            ))}
          </div>
        )}

        {hasChildren && data.collapsed && (
          <div
            className={`mt-3 text-[10px] italic ${
              isRoot ? "text-blue-50/75" : "text-slate-500 dark:text-neutral-400"
            }`}
          >
            Click to open {data.childCount} child node{data.childCount > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
});

const nodeTypes = { mindMapNode: MindMapNodeComponent };

function getNodeWidth(depth) {
  return NODE_WIDTHS[Math.min(depth, NODE_WIDTHS.length - 1)];
}

function getNodeHeight(depth) {
  return NODE_HEIGHTS[Math.min(depth, NODE_HEIGHTS.length - 1)];
}

function getEdgeColor(depth, isSelected) {
  if (isSelected) return "#2563eb";
  if (depth === 1) return "#2563eb";
  if (depth === 2) return "#0f766e";
  return "#64748b";
}

function convertTreeToFlow(tree, collapsedNodes, toggleNode, selectedNodeId) {
  const nodes = [];
  const edges = [];

  if (!tree || !tree.title) {
    return { nodes, edges };
  }

  function getSubtreeSize(node, nodeId, depth) {
    const isCollapsed = collapsedNodes.has(nodeId);
    const children = node.children || [];
    const nodeWidth = getNodeWidth(depth);
    const nodeHeight = getNodeHeight(depth);

    if (children.length === 0 || isCollapsed) {
      return { width: nodeWidth, height: nodeHeight };
    }

    const childSizes = children.map((child, index) =>
      getSubtreeSize(child, `${nodeId}-${index}`, depth + 1)
    );
    const totalHeight = childSizes.reduce(
      (sum, size, index) => sum + size.height + (index > 0 ? V_GAP : 0),
      0
    );

    return {
      width: nodeWidth + H_GAP + Math.max(...childSizes.map((size) => size.width)),
      height: Math.max(nodeHeight, totalHeight),
      childSizes,
    };
  }

  function positionNode(node, nodeId, depth, x, y, availableHeight, parentId = null) {
    const isCollapsed = collapsedNodes.has(nodeId);
    const children = node.children || [];
    const nodeWidth = getNodeWidth(depth);
    const nodeHeight = getNodeHeight(depth);
    const isSelected = selectedNodeId === nodeId;

    nodes.push({
      id: nodeId,
      type: "mindMapNode",
      position: { x, y: y + availableHeight / 2 - nodeHeight / 2 },
      data: {
        label: node.title,
        description: node.description || "",
        bulletPoints: node.bullet_points || [],
        depth,
        collapsed: isCollapsed,
        childCount: children.length,
        isSelected,
        onToggle: () => toggleNode(nodeId),
      },
      sourcePosition: "right",
      targetPosition: "left",
      draggable: false,
      selectable: false,
    });

    if (parentId) {
      const edgeColor = getEdgeColor(depth, isSelected);
      edges.push({
        id: `e-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: "bezier",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edgeColor,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: isSelected ? 3.75 : depth === 1 ? 3.2 : 2.4,
          strokeDasharray: depth >= 3 ? "5 4" : undefined,
          opacity: selectedNodeId && !isSelected ? 0.82 : 1,
        },
      });
    }

    if (children.length === 0 || isCollapsed) return;

    const subtreeInfo = getSubtreeSize(node, nodeId, depth);
    let currentY = y;
    children.forEach((child, index) => {
      const childId = `${nodeId}-${index}`;
      const childHeight = subtreeInfo.childSizes?.[index]?.height || getNodeHeight(depth + 1);
      positionNode(
        child,
        childId,
        depth + 1,
        x + nodeWidth + H_GAP,
        currentY,
        childHeight,
        nodeId
      );
      currentY += childHeight + V_GAP;
    });
  }

  const rootSize = getSubtreeSize(tree, "root", 0);
  positionNode(tree, "root", 0, 0, 0, rootSize.height);
  return { nodes, edges };
}

export default function MindMapViewer({ mindmapData, isLoading }) {
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState("root");
  const deferredMindmapData = useDeferredValue(mindmapData);

  const toggleNode = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else if (nodeId !== "root") {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const flowKey = useMemo(
    () => deferredMindmapData?.id || deferredMindmapData?.title || "empty-mindmap",
    [deferredMindmapData]
  );

  const { nodes, edges } = useMemo(() => {
    if (!deferredMindmapData?.mindmap) {
      return { nodes: [], edges: [] };
    }

    return convertTreeToFlow(
      deferredMindmapData.mindmap,
      collapsedNodes,
      toggleNode,
      selectedNodeId
    );
  }, [deferredMindmapData, collapsedNodes, toggleNode, selectedNodeId]);

  const downloadJSON = useCallback(() => {
    if (!deferredMindmapData) return;
    const blob = new Blob([JSON.stringify(deferredMindmapData.mindmap, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deferredMindmapData.title || "mindmap"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  }, [deferredMindmapData]);

  const downloadPNG = useCallback(async () => {
    try {
      const { toPng } = await import("html-to-image");
      const el = document.querySelector(".react-flow");
      if (!el) return;
      const dataUrl = await toPng(el, {
        backgroundColor: "#f8fafc",
        quality: 1,
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${deferredMindmapData?.title || "mindmap"}.png`;
      a.click();
    } catch (error) {
      console.error("PNG export failed:", error);
    }
    setShowDownloadMenu(false);
  }, [deferredMindmapData]);

  const downloadPDF = useCallback(async () => {
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");
      const el = document.querySelector(".react-flow");
      if (!el) return;
      const dataUrl = await toPng(el, {
        backgroundColor: "#f8fafc",
        quality: 1,
        pixelRatio: 2,
      });
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(
        dataUrl,
        "PNG",
        10,
        10,
        pdfWidth,
        Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 20)
      );
      pdf.save(`${deferredMindmapData?.title || "mindmap"}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    }
    setShowDownloadMenu(false);
  }, [deferredMindmapData]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-gray-200 dark:border-neutral-800">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-12 h-12 border-4 border-blue-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Generating mind map...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!deferredMindmapData) {
    return (
      <div className="h-full flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-gray-200 dark:border-neutral-800">
        <div className="text-center px-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-slate-100 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-blue-400 dark:text-sky-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-neutral-300 mb-2">
            No Mind Map Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-500 max-w-xs">
            Select a processed document or paste text, then click Generate to create your mind map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800">
      <ReactFlow
        key={flowKey}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.32 }}
        minZoom={0.15}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
        className="bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#f1f5f9_100%)] dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#020617_100%)]"
      >
        <Background color="#cbd5e1" gap={24} size={1.2} className="dark:opacity-20" />
        <Controls
          className="!bg-white/90 dark:!bg-neutral-800/90 !border-gray-200 dark:!border-neutral-700 !rounded-lg !shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          pannable
          zoomable
          className="!bg-white/80 dark:!bg-neutral-800/80 !border-gray-200 dark:!border-neutral-700 !rounded-lg"
          nodeColor={(node) =>
            node.data?.depth === 0
              ? "#2563eb"
              : node.data?.depth === 1
                ? "#0ea5e9"
                : node.data?.depth === 2
                  ? "#14b8a6"
                  : "#94a3b8"
          }
          maskColor="rgba(0,0,0,0.08)"
        />

        <Panel position="top-left">
          <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/85">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-sky-300" />
              <span className="text-sm font-semibold text-slate-800 dark:text-white">
                Reading Guide
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-neutral-400">
              Follow the arrows from one container to the next. Each connected box expands the idea from its parent.
            </p>
          </div>
        </Panel>

        <Panel position="top-right" className="flex items-center gap-2">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-200 dark:border-neutral-700 shadow-sm">
            <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">
              {deferredMindmapData.title}
            </span>
          </div>

          <div className="rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm dark:bg-neutral-800/90 dark:text-neutral-300">
            <MousePointerClick className="mr-1 inline h-3.5 w-3.5" />
            Click to explore
          </div>

          <div className="relative">
            <motion.button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="p-2 rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-gray-200 dark:border-neutral-700 shadow-sm text-gray-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-sky-300 transition-colors"
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
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-neutral-700 transition-colors text-left"
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
