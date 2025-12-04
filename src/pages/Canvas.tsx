import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { WhiteboardCanvas } from "@/components/canvas/WhiteboardCanvas";
import { UserButton } from "@clerk/clerk-react";

const Canvas = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-muted/30 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur-sm border-b border-border z-20">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold text-foreground">Untitled Whiteboard</h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Canvas area */}
      <main className="flex-1 relative">
        <WhiteboardCanvas />
      </main>
    </div>
  );
};

export default Canvas;
