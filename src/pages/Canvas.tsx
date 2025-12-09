import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Cloud, CloudOff, Pencil, Plus } from "lucide-react";
import { Link, useParams, useNavigate, useBeforeUnload } from "react-router-dom";
import { WhiteboardCanvas, WhiteboardCanvasRef } from "@/components/canvas/WhiteboardCanvas";
import { CollaboratorAvatars } from "@/components/canvas/CollaboratorAvatars";
import { UserButton, OrganizationSwitcher, useOrganization } from "@clerk/clerk-react";
import { useCanvasStorage, CanvasData } from "@/hooks/useCanvasStorage";
import { useRealtimeCollaboration } from "@/hooks/useRealtimeCollaboration";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const Canvas = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<WhiteboardCanvasRef>(null);
  const { organization } = useOrganization();
  const { getCanvas, updateCanvas, createCanvas } = useCanvasStorage();
  
  // Real-time collaboration (only active when in an organization)
  const {
    collaborators,
    isConnected,
    broadcastChange,
    broadcastCursor,
    onRemoteChange,
  } = useRealtimeCollaboration(organization ? id : undefined);
  
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load canvas data
  useEffect(() => {
    const loadCanvas = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const data = await getCanvas(id);
      if (data) {
        setCanvasData(data);
        setEditName(data.name);
        setLastSaved(new Date(data.updated_at));
        
        // Load canvas content after a short delay to ensure canvas is ready
        setTimeout(() => {
          if (data.content && canvasRef.current) {
            canvasRef.current.loadFromJSON(data.content);
          }
        }, 100);
      } else {
        toast.error("Canvas not found");
        navigate("/dashboard");
      }
      setLoading(false);
    };

    loadCanvas();
  }, [id, getCanvas, navigate]);

  // Save canvas
  const saveCanvas = useCallback(async () => {
    if (!id || !canvasRef.current) return;

    setSaveStatus("saving");
    
    const content = canvasRef.current.getCanvasJSON();
    const thumbnail = canvasRef.current.getCanvasThumbnail();
    
    const success = await updateCanvas(id, { content, thumbnail });
    
    if (success) {
      setSaveStatus("saved");
      setLastSaved(new Date());
    } else {
      setSaveStatus("unsaved");
    }
  }, [id, updateCanvas]);

  // Auto-save handler
  const handleAutoSave = useCallback(() => {
    setSaveStatus("unsaved");
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveCanvas();
    }, 2000);
  }, [saveCanvas]);

  // Handle canvas changes for real-time sync
  const handleCanvasChange = useCallback(
    (change: { type: string; data: any }) => {
      if (organization && isConnected) {
        broadcastChange(change as any);
      }
    },
    [organization, isConnected, broadcastChange]
  );

  // Listen for remote changes
  useEffect(() => {
    onRemoteChange((change) => {
      if (canvasRef.current) {
        canvasRef.current.applyRemoteChange(change);
      }
    });
  }, [onRemoteChange]);

  // Save before leaving
  useBeforeUnload(
    useCallback(() => {
      if (saveStatus === "unsaved" && canvasRef.current && id) {
        const content = canvasRef.current.getCanvasJSON();
        const thumbnail = canvasRef.current.getCanvasThumbnail();
        
        // Use sendBeacon for reliable save on page unload
        const data = JSON.stringify({ content, thumbnail });
        navigator.sendBeacon(`/api/save-canvas/${id}`, data);
      }
    }, [saveStatus, id])
  );

  // Handle back navigation with save
  const handleBack = async () => {
    if (saveStatus === "unsaved") {
      await saveCanvas();
    }
    navigate("/dashboard");
  };

  // Handle rename
  const handleRename = async () => {
    if (!id || !editName.trim()) return;
    
    await updateCanvas(id, { name: editName.trim() });
    setCanvasData((prev) => prev ? { ...prev, name: editName.trim() } : null);
    setIsEditing(false);
    toast.success("Canvas renamed");
  };

  // Handle create new canvas
  const handleNewCanvas = async () => {
    // Save current canvas first
    if (saveStatus === "unsaved") {
      await saveCanvas();
    }
    
    const newCanvas = await createCanvas();
    if (newCanvas) {
      navigate(`/canvas/${newCanvas.id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-muted/30 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur-sm border-b border-border z-20">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
            Sketchflow
          </Link>
          <div className="h-6 w-px bg-border" />
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div className="h-6 w-px bg-border" />
          
          {/* Editable title */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 w-48"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setIsEditing(false);
                }}
              />
              <Button size="sm" variant="ghost" onClick={handleRename}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors group"
            >
              {canvasData?.name || "Untitled Canvas"}
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Save status indicator */}
          <AnimatePresence mode="wait">
            <motion.div
              key={saveStatus}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              {saveStatus === "saved" && (
                <>
                  <Cloud className="h-3 w-3 text-green-500" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === "saving" && (
                <>
                  <Cloud className="h-3 w-3 text-yellow-500 animate-pulse" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <CloudOff className="h-3 w-3 text-orange-500" />
                  <span>Unsaved</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          {/* Collaborator avatars */}
          {organization && (
            <CollaboratorAvatars
              collaborators={collaborators}
              isConnected={isConnected}
            />
          )}
          
          <Button variant="outline" size="sm" className="gap-2" onClick={handleNewCanvas}>
            <Plus className="h-4 w-4" />
            New Canvas
          </Button>
          <OrganizationSwitcher
            appearance={{
              elements: {
                rootBox: "flex items-center",
                organizationSwitcherTrigger: "px-2 py-1.5 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors",
              },
            }}
            afterSelectOrganizationUrl="/dashboard"
            afterSelectPersonalUrl="/dashboard"
            hidePersonal={false}
          />
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Canvas area */}
      <main className="flex-1 relative">
        <WhiteboardCanvas
          ref={canvasRef}
          onAutoSave={handleAutoSave}
          onCanvasChange={handleCanvasChange}
          onCursorMove={organization ? broadcastCursor : undefined}
          collaborators={collaborators}
        />
      </main>
    </div>
  );
};

export default Canvas;
