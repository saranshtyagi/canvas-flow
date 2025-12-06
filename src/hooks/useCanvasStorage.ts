import { useState, useCallback } from "react";
import { useUser, useOrganization } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CanvasData {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  content: any;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export const useCanvasStorage = () => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [canvases, setCanvases] = useState<CanvasData[]>([]);

  const fetchCanvases = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("canvases")
        .select("*")
        .order("updated_at", { ascending: false });

      // Filter by organization if in one, otherwise by user
      if (organization?.id) {
        query = query.eq("organization_id", organization.id);
      } else {
        query = query.eq("user_id", user.id).is("organization_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCanvases((data as CanvasData[]) || []);
    } catch (error) {
      console.error("Error fetching canvases:", error);
      toast.error("Failed to load canvases");
    } finally {
      setLoading(false);
    }
  }, [user, organization]);

  const createCanvas = useCallback(async (name: string = "Untitled Canvas") => {
    if (!user) return null;

    try {
      const newCanvas = {
        user_id: user.id,
        organization_id: organization?.id || null,
        name,
        content: null,
        thumbnail: null,
      };

      const { data, error } = await supabase
        .from("canvases")
        .insert(newCanvas)
        .select()
        .single();

      if (error) throw error;
      toast.success("Canvas created");
      return data as CanvasData;
    } catch (error) {
      console.error("Error creating canvas:", error);
      toast.error("Failed to create canvas");
      return null;
    }
  }, [user, organization]);

  const updateCanvas = useCallback(async (
    id: string,
    updates: Partial<Pick<CanvasData, "name" | "content" | "thumbnail">>
  ) => {
    try {
      const { error } = await supabase
        .from("canvases")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating canvas:", error);
      return false;
    }
  }, []);

  const deleteCanvas = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("canvases")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Canvas deleted");
      return true;
    } catch (error) {
      console.error("Error deleting canvas:", error);
      toast.error("Failed to delete canvas");
      return false;
    }
  }, []);

  const duplicateCanvas = useCallback(async (canvas: CanvasData) => {
    if (!user) return null;

    try {
      const newCanvas = {
        user_id: user.id,
        organization_id: organization?.id || null,
        name: `${canvas.name} (Copy)`,
        content: canvas.content,
        thumbnail: canvas.thumbnail,
      };

      const { data, error } = await supabase
        .from("canvases")
        .insert(newCanvas)
        .select()
        .single();

      if (error) throw error;
      toast.success("Canvas duplicated");
      return data as CanvasData;
    } catch (error) {
      console.error("Error duplicating canvas:", error);
      toast.error("Failed to duplicate canvas");
      return null;
    }
  }, [user, organization]);

  const getCanvas = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("canvases")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as CanvasData;
    } catch (error) {
      console.error("Error fetching canvas:", error);
      return null;
    }
  }, []);

  return {
    canvases,
    loading,
    fetchCanvases,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    duplicateCanvas,
    getCanvas,
  };
};
