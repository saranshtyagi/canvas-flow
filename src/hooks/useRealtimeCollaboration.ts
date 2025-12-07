import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser, useOrganization } from "@clerk/clerk-react";
import { RealtimeChannel } from "@supabase/supabase-js";

interface CollaboratorPresence {
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

const COLLABORATOR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"
];

export const useRealtimeCollaboration = (canvasId: string | undefined) => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const lastBroadcastRef = useRef<number>(0);
  const myColorRef = useRef<string>(
    COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)]
  );

  // Callback refs for external handlers
  const onRemoteChangeRef = useRef<((change: CanvasChange) => void) | null>(null);
  const onCursorMoveRef = useRef<((userId: string, cursor: { x: number; y: number }) => void) | null>(null);

  // Set up channel subscription
  useEffect(() => {
    if (!canvasId || !user || !organization) {
      return;
    }

    const channelName = `canvas:${canvasId}`;
    console.log(`[Realtime] Joining channel: ${channelName}`);

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: user.id },
        broadcast: { self: false },
      },
    });

    // Handle presence sync
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const presences: CollaboratorPresence[] = [];
      
      Object.entries(state).forEach(([key, value]) => {
        if (key !== user.id && Array.isArray(value) && value.length > 0) {
          const presence = value[0] as any;
          presences.push({
            id: key,
            name: presence.name || "Anonymous",
            color: presence.color || COLLABORATOR_COLORS[0],
            cursor: presence.cursor,
          });
        }
      });
      
      setCollaborators(presences);
      console.log(`[Realtime] Presence sync: ${presences.length} collaborators`);
    });

    // Handle presence join
    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      if (key !== user.id) {
        console.log(`[Realtime] User joined: ${key}`);
      }
    });

    // Handle presence leave
    channel.on("presence", { event: "leave" }, ({ key }) => {
      if (key !== user.id) {
        console.log(`[Realtime] User left: ${key}`);
      }
    });

    // Handle canvas changes broadcast
    channel.on("broadcast", { event: "canvas_change" }, ({ payload }) => {
      const change = payload as CanvasChange;
      if (change.userId !== user.id) {
        console.log(`[Realtime] Received canvas change: ${change.type}`);
        onRemoteChangeRef.current?.(change);
      }
    });

    // Handle cursor broadcasts
    channel.on("broadcast", { event: "cursor_move" }, ({ payload }) => {
      if (payload.userId !== user.id) {
        onCursorMoveRef.current?.(payload.userId, payload.cursor);
        
        // Update collaborator cursor in presence
        setCollaborators((prev) =>
          prev.map((c) =>
            c.id === payload.userId ? { ...c, cursor: payload.cursor } : c
          )
        );
      }
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        console.log(`[Realtime] Subscribed to channel: ${channelName}`);
        
        // Track our presence
        await channel.track({
          name: user.fullName || user.emailAddresses[0]?.emailAddress || "Anonymous",
          color: myColorRef.current,
          online_at: new Date().toISOString(),
        });
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false);
        console.log(`[Realtime] Channel status: ${status}`);
      }
    });

    channelRef.current = channel;

    return () => {
      console.log(`[Realtime] Leaving channel: ${channelName}`);
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
      setCollaborators([]);
    };
  }, [canvasId, user, organization]);

  // Broadcast canvas change with throttling
  const broadcastChange = useCallback(
    (change: Omit<CanvasChange, "userId" | "timestamp">) => {
      if (!channelRef.current || !user || !isConnected) return;

      const now = Date.now();
      // Throttle broadcasts to max 1 per 50ms for performance
      if (change.type !== "full" && now - lastBroadcastRef.current < 50) {
        return;
      }
      lastBroadcastRef.current = now;

      const fullChange: CanvasChange = {
        ...change,
        userId: user.id,
        timestamp: now,
      };

      channelRef.current.send({
        type: "broadcast",
        event: "canvas_change",
        payload: fullChange,
      });

      console.log(`[Realtime] Broadcast change: ${change.type}`);
    },
    [user, isConnected]
  );

  // Broadcast cursor position with heavy throttling
  const broadcastCursor = useCallback(
    (cursor: { x: number; y: number }) => {
      if (!channelRef.current || !user || !isConnected) return;

      channelRef.current.send({
        type: "broadcast",
        event: "cursor_move",
        payload: {
          userId: user.id,
          cursor,
        },
      });
    },
    [user, isConnected]
  );

  // Set callback for remote changes
  const onRemoteChange = useCallback(
    (callback: (change: CanvasChange) => void) => {
      onRemoteChangeRef.current = callback;
    },
    []
  );

  // Set callback for cursor moves
  const onCursorMove = useCallback(
    (callback: (userId: string, cursor: { x: number; y: number }) => void) => {
      onCursorMoveRef.current = callback;
    },
    []
  );

  return {
    collaborators,
    isConnected,
    broadcastChange,
    broadcastCursor,
    onRemoteChange,
    onCursorMove,
    myColor: myColorRef.current,
  };
};
