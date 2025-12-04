import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Minus,
  MoveRight,
  Type,
  Eraser,
  Trash2,
  Undo2,
  Redo2,
  Download,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type Tool = "select" | "draw" | "rectangle" | "circle" | "line" | "arrow" | "text" | "eraser";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select" },
  { id: "draw", icon: <Pencil className="h-4 w-4" />, label: "Draw" },
  { id: "rectangle", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
  { id: "circle", icon: <Circle className="h-4 w-4" />, label: "Circle" },
  { id: "line", icon: <Minus className="h-4 w-4" />, label: "Line" },
  { id: "arrow", icon: <MoveRight className="h-4 w-4" />, label: "Arrow" },
  { id: "text", icon: <Type className="h-4 w-4" />, label: "Text" },
  { id: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Eraser" },
];

export const Toolbar = ({
  activeTool,
  onToolChange,
  onClear,
  onUndo,
  onRedo,
  onExport,
  canUndo,
  canRedo,
}: ToolbarProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-2 shadow-medium">
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="icon"
                onClick={() => onToolChange(tool.id)}
                className="h-9 w-9"
              >
                {tool.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-9 w-9"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-9 w-9"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExport}
              className="h-9 w-9"
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Export</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-9 w-9 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Clear Canvas</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
