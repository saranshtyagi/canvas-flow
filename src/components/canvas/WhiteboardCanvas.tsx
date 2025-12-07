import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { Canvas as FabricCanvas, Rect, Circle, Line, IText, PencilBrush, FabricObject } from "fabric";
import { Toolbar, Tool } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { StrokeWidthPicker } from "./StrokeWidthPicker";
import { CollaboratorCursors } from "./CollaboratorCursors";
import { toast } from "sonner";

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

interface CanvasChange {
  type: "full" | "object:added" | "object:modified" | "object:removed" | "clear";
  data: any;
  userId: string;
  timestamp: number;
}

export interface WhiteboardCanvasRef {
  getCanvasJSON: () => any;
  getCanvasThumbnail: () => string;
  loadFromJSON: (json: any) => Promise<void>;
  applyRemoteChange: (change: CanvasChange) => void;
}

interface WhiteboardCanvasProps {
  onAutoSave?: () => void;
  onCanvasChange?: (change: Omit<CanvasChange, "userId" | "timestamp">) => void;
  onCursorMove?: (cursor: { x: number; y: number }) => void;
  collaborators?: Collaborator[];
}

export const WhiteboardCanvas = forwardRef<WhiteboardCanvasRef, WhiteboardCanvasProps>(
  ({ onAutoSave, onCanvasChange, onCursorMove, collaborators = [] }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>("select");
    const [activeColor, setActiveColor] = useState("#000000");
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isDrawingShape = useRef(false);
    const startPoint = useRef({ x: 0, y: 0 });
    const currentShape = useRef<FabricObject | null>(null);
    const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
    const isInitialized = useRef(false);
    const isApplyingRemoteChange = useRef(false);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getCanvasJSON: () => {
        if (!fabricCanvas) return null;
        return fabricCanvas.toJSON();
      },
      getCanvasThumbnail: () => {
        if (!fabricCanvas) return "";
        return fabricCanvas.toDataURL({
          format: "png",
          quality: 0.5,
          multiplier: 0.25,
        });
      },
      loadFromJSON: async (json: any) => {
        if (!fabricCanvas || !json) return;
        isApplyingRemoteChange.current = true;
        await fabricCanvas.loadFromJSON(json);
        fabricCanvas.renderAll();
        isInitialized.current = true;
        isApplyingRemoteChange.current = false;
      },
      applyRemoteChange: async (change: CanvasChange) => {
        if (!fabricCanvas) return;
        
        isApplyingRemoteChange.current = true;
        
        try {
          if (change.type === "full" && change.data) {
            await fabricCanvas.loadFromJSON(change.data);
            fabricCanvas.renderAll();
          } else if (change.type === "clear") {
            fabricCanvas.clear();
            fabricCanvas.backgroundColor = "#ffffff";
            fabricCanvas.renderAll();
          }
        } catch (error) {
          console.error("[Canvas] Error applying remote change:", error);
        }
        
        isApplyingRemoteChange.current = false;
      },
    }));

    // Trigger auto-save with debounce
    const triggerAutoSave = useCallback(() => {
      if (!isInitialized.current) return;
      
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
      autoSaveTimeout.current = setTimeout(() => {
        onAutoSave?.();
      }, 1000);
    }, [onAutoSave]);

    // Initialize canvas
    useEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const canvas = new FabricCanvas(canvasRef.current, {
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: "#ffffff",
        selection: true,
      });

      // Initialize brush
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = strokeWidth;

      setFabricCanvas(canvas);
      saveToHistory(canvas);
      isInitialized.current = true;

      // Handle resize
      const handleResize = () => {
        canvas.setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
        canvas.renderAll();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (autoSaveTimeout.current) {
          clearTimeout(autoSaveTimeout.current);
        }
        canvas.dispose();
      };
    }, []);

    // Save to history and broadcast change
    const saveToHistory = useCallback((canvas: FabricCanvas) => {
      if (isApplyingRemoteChange.current) return;
      
      const json = JSON.stringify(canvas.toJSON());
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, json];
      });
      setHistoryIndex((prev) => prev + 1);
      triggerAutoSave();
      
      // Broadcast the full canvas state for real-time sync
      onCanvasChange?.({ type: "full", data: canvas.toJSON() });
    }, [historyIndex, triggerAutoSave, onCanvasChange]);

    // Update brush settings
    useEffect(() => {
      if (!fabricCanvas) return;

      fabricCanvas.isDrawingMode = activeTool === "draw";
      
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = strokeWidth;
      }

      // Set selection mode
      fabricCanvas.selection = activeTool === "select";
      fabricCanvas.forEachObject((obj) => {
        obj.selectable = activeTool === "select";
        obj.evented = activeTool === "select" || activeTool === "eraser";
      });
    }, [activeTool, activeColor, strokeWidth, fabricCanvas]);

    // Handle shape drawing
    useEffect(() => {
      if (!fabricCanvas) return;

      const handleMouseDown = (e: any) => {
        if (!["rectangle", "circle", "line", "arrow", "text"].includes(activeTool)) return;

        const pointer = fabricCanvas.getScenePoint(e.e);
        startPoint.current = { x: pointer.x, y: pointer.y };

        if (activeTool === "text") {
          const text = new IText("Type here...", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 20,
            fill: activeColor,
            fontFamily: "sans-serif",
          });
          fabricCanvas.add(text);
          fabricCanvas.setActiveObject(text);
          text.enterEditing();
          saveToHistory(fabricCanvas);
          return;
        }

        isDrawingShape.current = true;

        if (activeTool === "rectangle") {
          currentShape.current = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: activeColor,
            strokeWidth: strokeWidth,
          });
        } else if (activeTool === "circle") {
          currentShape.current = new Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: "transparent",
            stroke: activeColor,
            strokeWidth: strokeWidth,
          });
        } else if (activeTool === "line" || activeTool === "arrow") {
          currentShape.current = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: activeColor,
            strokeWidth: strokeWidth,
          });
        }

        if (currentShape.current) {
          fabricCanvas.add(currentShape.current);
        }
      };

      const handleMouseMove = (e: any) => {
        if (!isDrawingShape.current || !currentShape.current) return;

        const pointer = fabricCanvas.getScenePoint(e.e);
        const { x: startX, y: startY } = startPoint.current;

        if (activeTool === "rectangle") {
          const width = pointer.x - startX;
          const height = pointer.y - startY;
          (currentShape.current as Rect).set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? startX : pointer.x,
            top: height > 0 ? startY : pointer.y,
          });
        } else if (activeTool === "circle") {
          const radius = Math.sqrt(
            Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
          ) / 2;
          (currentShape.current as Circle).set({
            radius,
            left: startX - radius,
            top: startY - radius,
          });
        } else if (activeTool === "line" || activeTool === "arrow") {
          (currentShape.current as Line).set({
            x2: pointer.x,
            y2: pointer.y,
          });
        }

        fabricCanvas.renderAll();
      };

      const handleMouseUp = () => {
        if (isDrawingShape.current && currentShape.current) {
          // Add arrow head for arrow tool
          if (activeTool === "arrow") {
            const line = currentShape.current as Line;
            const x1 = line.x1 || 0;
            const y1 = line.y1 || 0;
            const x2 = line.x2 || 0;
            const y2 = line.y2 || 0;
            
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLength = 15;
            
            const arrowHead1 = new Line([
              x2,
              y2,
              x2 - headLength * Math.cos(angle - Math.PI / 6),
              y2 - headLength * Math.sin(angle - Math.PI / 6),
            ], {
              stroke: activeColor,
              strokeWidth: strokeWidth,
            });
            
            const arrowHead2 = new Line([
              x2,
              y2,
              x2 - headLength * Math.cos(angle + Math.PI / 6),
              y2 - headLength * Math.sin(angle + Math.PI / 6),
            ], {
              stroke: activeColor,
              strokeWidth: strokeWidth,
            });
            
            fabricCanvas.add(arrowHead1, arrowHead2);
          }
          
          saveToHistory(fabricCanvas);
        }
        isDrawingShape.current = false;
        currentShape.current = null;
      };

      fabricCanvas.on("mouse:down", handleMouseDown);
      fabricCanvas.on("mouse:move", handleMouseMove);
      fabricCanvas.on("mouse:up", handleMouseUp);

      return () => {
        fabricCanvas.off("mouse:down", handleMouseDown);
        fabricCanvas.off("mouse:move", handleMouseMove);
        fabricCanvas.off("mouse:up", handleMouseUp);
      };
    }, [fabricCanvas, activeTool, activeColor, strokeWidth, saveToHistory]);

    // Handle eraser
    useEffect(() => {
      if (!fabricCanvas) return;

      const handleObjectClick = (e: any) => {
        if (activeTool === "eraser" && e.target) {
          fabricCanvas.remove(e.target);
          saveToHistory(fabricCanvas);
        }
      };

      fabricCanvas.on("mouse:down", handleObjectClick);

      return () => {
        fabricCanvas.off("mouse:down", handleObjectClick);
      };
    }, [fabricCanvas, activeTool, saveToHistory]);

    // Save history on path created (freehand drawing)
    useEffect(() => {
      if (!fabricCanvas) return;

      const handlePathCreated = () => {
        saveToHistory(fabricCanvas);
      };

      fabricCanvas.on("path:created", handlePathCreated);

      return () => {
        fabricCanvas.off("path:created", handlePathCreated);
      };
    }, [fabricCanvas, saveToHistory]);

    // Handle object modifications
    useEffect(() => {
      if (!fabricCanvas) return;

      const handleObjectModified = () => {
        saveToHistory(fabricCanvas);
      };

      fabricCanvas.on("object:modified", handleObjectModified);

      return () => {
        fabricCanvas.off("object:modified", handleObjectModified);
      };
    }, [fabricCanvas, saveToHistory]);

    const handleClear = () => {
      if (!fabricCanvas) return;
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";
      fabricCanvas.renderAll();
      saveToHistory(fabricCanvas);
      toast.success("Canvas cleared");
    };

    const handleUndo = () => {
      if (!fabricCanvas || historyIndex <= 0) return;
      const newIndex = historyIndex - 1;
      fabricCanvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
        fabricCanvas.renderAll();
        setHistoryIndex(newIndex);
        triggerAutoSave();
      });
    };

    const handleRedo = () => {
      if (!fabricCanvas || historyIndex >= history.length - 1) return;
      const newIndex = historyIndex + 1;
      fabricCanvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
        fabricCanvas.renderAll();
        setHistoryIndex(newIndex);
        triggerAutoSave();
      });
    };

    const handleExport = () => {
      if (!fabricCanvas) return;
      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });
      const link = document.createElement("a");
      link.download = "whiteboard.png";
      link.href = dataURL;
      link.click();
      toast.success("Canvas exported as PNG");
    };

    // Track cursor position for collaboration
    useEffect(() => {
      if (!fabricCanvas || !onCursorMove) return;

      let lastCursorBroadcast = 0;
      const throttleMs = 50;

      const handleMouseMove = (e: any) => {
        const now = Date.now();
        if (now - lastCursorBroadcast < throttleMs) return;
        lastCursorBroadcast = now;

        const pointer = fabricCanvas.getScenePoint(e.e);
        onCursorMove({ x: pointer.x, y: pointer.y });
      };

      fabricCanvas.on("mouse:move", handleMouseMove);

      return () => {
        fabricCanvas.off("mouse:move", handleMouseMove);
      };
    }, [fabricCanvas, onCursorMove]);

    return (
      <div className="flex flex-col h-full relative">
        {/* Collaborator cursors */}
        <CollaboratorCursors collaborators={collaborators} />

        {/* Floating toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          <Toolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onClear={handleClear}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onExport={handleExport}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />
          <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-2 shadow-medium">
            <ColorPicker color={activeColor} onChange={setActiveColor} />
            <StrokeWidthPicker width={strokeWidth} onChange={setStrokeWidth} />
          </div>
        </div>

        {/* Canvas container */}
        <div
          ref={containerRef}
          className="flex-1 w-full overflow-hidden bg-white cursor-crosshair"
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
    );
  }
);

WhiteboardCanvas.displayName = "WhiteboardCanvas";
