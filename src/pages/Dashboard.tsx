import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useOrganization, OrganizationSwitcher, UserButton } from "@clerk/clerk-react";
import { Plus, MoreHorizontal, Pencil, Copy, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCanvasStorage, CanvasData } from "@/hooks/useCanvasStorage";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const { canvases, loading, fetchCanvases, createCanvas, updateCanvas, deleteCanvas, duplicateCanvas } = useCanvasStorage();
  
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; canvas: CanvasData | null }>({
    open: false,
    canvas: null,
  });
  const [newName, setNewName] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; canvas: CanvasData | null }>({
    open: false,
    canvas: null,
  });

  useEffect(() => {
    if (userLoaded && user) {
      fetchCanvases();
    }
  }, [userLoaded, user, organization, fetchCanvases]);

  const handleCreateCanvas = async () => {
    const canvas = await createCanvas();
    if (canvas) {
      navigate(`/canvas/${canvas.id}`);
    }
  };

  const handleOpenCanvas = (id: string) => {
    navigate(`/canvas/${id}`);
  };

  const handleRename = (canvas: CanvasData) => {
    setNewName(canvas.name);
    setRenameDialog({ open: true, canvas });
  };

  const handleRenameSubmit = async () => {
    if (renameDialog.canvas && newName.trim()) {
      await updateCanvas(renameDialog.canvas.id, { name: newName.trim() });
      fetchCanvases();
      setRenameDialog({ open: false, canvas: null });
    }
  };

  const handleDelete = (canvas: CanvasData) => {
    setDeleteDialog({ open: true, canvas });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.canvas) {
      await deleteCanvas(deleteDialog.canvas.id);
      fetchCanvases();
      setDeleteDialog({ open: false, canvas: null });
    }
  };

  const handleDuplicate = async (canvas: CanvasData) => {
    await duplicateCanvas(canvas);
    fetchCanvases();
  };

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Sketchflow</h1>
            <OrganizationSwitcher
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  organizationSwitcherTrigger: "px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors",
                },
              }}
              afterSelectOrganizationUrl="/dashboard"
              afterSelectPersonalUrl="/dashboard"
              afterCreateOrganizationUrl="/dashboard"
              hidePersonal={false}
              createOrganizationMode="modal"
            />
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {organization ? organization.name : "My Canvases"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {organization
                ? "Canvases shared with your team"
                : "Your personal workspace"}
            </p>
          </div>
          <Button onClick={handleCreateCanvas} className="gap-2">
            <Plus className="h-4 w-4" />
            New Canvas
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : canvases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No canvases yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first canvas to start drawing and collaborating with your team.
            </p>
            <Button onClick={handleCreateCanvas} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Canvas
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {canvases.map((canvas, index) => (
              <motion.div
                key={canvas.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/50"
                  onClick={() => handleOpenCanvas(canvas.id)}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {canvas.thumbnail ? (
                      <img
                        src={canvas.thumbnail}
                        alt={canvas.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                        <span className="text-4xl text-muted-foreground/30">🎨</span>
                      </div>
                    )}
                    <div
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRename(canvas)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(canvas)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(canvas)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-foreground truncate">{canvas.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Edited {formatDistanceToNow(new Date(canvas.updated_at), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ open, canvas: renameDialog.canvas })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Canvas</DialogTitle>
            <DialogDescription>Enter a new name for your canvas.</DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Canvas name"
            onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, canvas: null })}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, canvas: deleteDialog.canvas })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Canvas</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.canvas?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, canvas: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
