import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface StrokeWidthPickerProps {
  width: number;
  onChange: (width: number) => void;
}

export const StrokeWidthPicker = ({ width, onChange }: StrokeWidthPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 px-3 border border-border gap-2"
        >
          <div
            className="rounded-full bg-foreground"
            style={{ width: Math.max(width, 4), height: Math.max(width, 4), maxWidth: 16, maxHeight: 16 }}
          />
          <span className="text-xs text-muted-foreground">{width}px</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Stroke Width</span>
            <span className="text-sm text-muted-foreground">{width}px</span>
          </div>
          <Slider
            value={[width]}
            onValueChange={([val]) => onChange(val)}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex gap-1">
            {[1, 2, 4, 8, 12].map((w) => (
              <Button
                key={w}
                variant={width === w ? "default" : "outline"}
                size="sm"
                className="flex-1 h-8 p-0"
                onClick={() => onChange(w)}
              >
                {w}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
