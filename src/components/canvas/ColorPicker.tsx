import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const colors = [
  "#000000", "#374151", "#6B7280", "#9CA3AF",
  "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
  "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6",
  "#A855F7", "#D946EF", "#EC4899", "#F43F5E",
  "#FFFFFF",
];

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 w-9 p-0 border border-border"
          style={{ backgroundColor: color }}
        >
          <Palette className="h-4 w-4" style={{ color: color === "#FFFFFF" || color === "#F59E0B" || color === "#EAB308" ? "#000" : "#fff" }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-7 gap-1">
          {colors.map((c) => (
            <button
              key={c}
              className={`h-7 w-7 rounded-md border-2 transition-transform hover:scale-110 ${
                color === c ? "border-primary ring-2 ring-primary/50" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              onClick={() => onChange(c)}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border-0"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-8 px-2 text-sm border border-border rounded-md bg-background"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
