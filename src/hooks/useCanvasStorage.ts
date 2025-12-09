import { useState, useCallback } from "react";
import { useUser, useOrganization, useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";

export interface CanvasData {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  content: unknown;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canvas-api`;

export const useCanvasStorage = () => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [canvases, setCanvases] = useState<CanvasData[]>([]);

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  }, [getToken]);

  const fetchCanvases = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/list`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch canvases");
      }

      const { data } = await response.json();
      setCanvases((data as CanvasData[]) || []);
    } catch (error) {
      console.error("Error fetching canvases:", error);
      toast.error("Failed to load canvases");
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders]);

  const createCanvas = useCallback(async (name: string = "Untitled Canvas") => {
    if (!user) return null;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create canvas");
      }

      const { data } = await response.json();
      toast.success("Canvas created");
      return data as CanvasData;
    } catch (error) {
      console.error("Error creating canvas:", error);
      toast.error("Failed to create canvas");
      return null;
    }
  }, [user, getAuthHeaders]);

  const updateCanvas = useCallback(async (
    id: string,
    updates: Partial<Pick<CanvasData, "name" | "content" | "thumbnail">>
  ) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/update/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update canvas");
      }

      return true;
    } catch (error) {
      console.error("Error updating canvas:", error);
      return false;
    }
  }, [getAuthHeaders]);

  const deleteCanvas = useCallback(async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete canvas");
      }

      toast.success("Canvas deleted");
      return true;
    } catch (error) {
      console.error("Error deleting canvas:", error);
      toast.error("Failed to delete canvas");
      return false;
    }
  }, [getAuthHeaders]);

  const duplicateCanvas = useCallback(async (canvas: CanvasData) => {
    if (!user) return null;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/duplicate/${canvas.id}`, {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate canvas");
      }

      const { data } = await response.json();
      toast.success("Canvas duplicated");
      return data as CanvasData;
    } catch (error) {
      console.error("Error duplicating canvas:", error);
      toast.error("Failed to duplicate canvas");
      return null;
    }
  }, [user, getAuthHeaders]);

  const getCanvas = useCallback(async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/get/${id}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch canvas");
      }

      const { data } = await response.json();
      return data as CanvasData | null;
    } catch (error) {
      console.error("Error fetching canvas:", error);
      return null;
    }
  }, [getAuthHeaders]);

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
