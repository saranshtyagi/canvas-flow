import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Canvas = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Canvas Coming Soon</h1>
        <p className="text-muted-foreground mb-6">The whiteboard canvas will be built here.</p>
        <Link to="/">
          <Button variant="glass">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Canvas;
