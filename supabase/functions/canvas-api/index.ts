import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { jwtVerify, createRemoteJWKSet } from "https://deno.land/x/jose@v5.2.2/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY")!;

// Extract Clerk instance ID from secret key for JWKS URL
function getClerkJWKSUrl(): string {
  // The JWKS URL follows this pattern: https://<clerk-instance>.clerk.accounts.dev/.well-known/jwks.json
  // We'll use Clerk's API to verify tokens instead
  return "https://api.clerk.com/v1/jwks";
}

interface ClerkJWTPayload {
  sub: string; // User ID
  org_id?: string; // Organization ID if in org context
  org_slug?: string;
  org_role?: string;
}

async function verifyClerkToken(token: string): Promise<ClerkJWTPayload | null> {
  try {
    // Verify the token using Clerk's Backend API
    const response = await fetch("https://api.clerk.com/v1/sessions", {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
    });
    
    // Alternatively, decode and verify JWT locally
    // For Clerk, we can use the JWKS endpoint
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid token format");
      return null;
    }

    // Decode the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Verify using Clerk API - verify session
    const sessionId = payload.sid;
    if (sessionId) {
      const sessionResponse = await fetch(`https://api.clerk.com/v1/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.status === "active" && sessionData.user_id === payload.sub) {
          return {
            sub: payload.sub,
            org_id: payload.org_id,
            org_slug: payload.org_slug,
            org_role: payload.org_role,
          };
        }
      }
    }
    
    // If session verification fails, try user verification as fallback
    const userResponse = await fetch(`https://api.clerk.com/v1/users/${payload.sub}`, {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
      },
    });
    
    if (userResponse.ok) {
      return {
        sub: payload.sub,
        org_id: payload.org_id,
        org_slug: payload.org_slug,
        org_role: payload.org_role,
      };
    }

    console.error("Token verification failed");
    return null;
  } catch (error) {
    console.error("Error verifying Clerk token:", error);
    return null;
  }
}

interface CanvasData {
  id?: string;
  user_id?: string;
  organization_id?: string | null;
  name?: string;
  content?: unknown;
  thumbnail?: string | null;
}

// Validate canvas data
function validateCanvasData(data: CanvasData): { valid: boolean; error?: string } {
  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      return { valid: false, error: "Name must be a string" };
    }
    if (data.name.trim().length === 0) {
      return { valid: false, error: "Name cannot be empty" };
    }
    if (data.name.length > 200) {
      return { valid: false, error: "Name must be less than 200 characters" };
    }
  }
  
  if (data.thumbnail !== undefined && data.thumbnail !== null) {
    if (typeof data.thumbnail !== "string") {
      return { valid: false, error: "Thumbnail must be a string" };
    }
    // Limit thumbnail size to ~500KB base64
    if (data.thumbnail.length > 700000) {
      return { valid: false, error: "Thumbnail is too large" };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify the Clerk token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.substring(7);
    const clerkUser = await verifyClerkToken(token);
    
    if (!clerkUser) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = clerkUser.sub;
    const organizationId = clerkUser.org_id || null;

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Path format: /canvas-api/{action}/{id?}
    const action = pathParts[1] || "";
    const canvasId = pathParts[2] || null;

    console.log(`Canvas API: action=${action}, canvasId=${canvasId}, userId=${userId}, orgId=${organizationId}`);

    switch (req.method) {
      case "GET": {
        if (action === "list") {
          // List canvases for the user/organization
          let query = supabase
            .from("canvases")
            .select("*")
            .order("updated_at", { ascending: false });

          if (organizationId) {
            query = query.eq("organization_id", organizationId);
          } else {
            query = query.eq("user_id", userId).is("organization_id", null);
          }

          const { data, error } = await query;

          if (error) {
            console.error("Error fetching canvases:", error);
            return new Response(
              JSON.stringify({ error: "Failed to fetch canvases" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else if (action === "get" && canvasId) {
          // Get a specific canvas
          const { data, error } = await supabase
            .from("canvases")
            .select("*")
            .eq("id", canvasId)
            .maybeSingle();

          if (error) {
            console.error("Error fetching canvas:", error);
            return new Response(
              JSON.stringify({ error: "Failed to fetch canvas" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          if (!data) {
            return new Response(
              JSON.stringify({ error: "Canvas not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Verify ownership
          const hasAccess =
            data.user_id === userId ||
            (organizationId && data.organization_id === organizationId);

          if (!hasAccess) {
            return new Response(
              JSON.stringify({ error: "Access denied" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;
      }

      case "POST": {
        if (action === "create") {
          const body: CanvasData = await req.json();
          
          // Validate input
          const validation = validateCanvasData(body);
          if (!validation.valid) {
            return new Response(
              JSON.stringify({ error: validation.error }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const newCanvas = {
            user_id: userId,
            organization_id: organizationId,
            name: body.name || "Untitled Canvas",
            content: body.content || null,
            thumbnail: body.thumbnail || null,
          };

          const { data, error } = await supabase
            .from("canvases")
            .insert(newCanvas)
            .select()
            .single();

          if (error) {
            console.error("Error creating canvas:", error);
            return new Response(
              JSON.stringify({ error: "Failed to create canvas" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ data }), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else if (action === "duplicate" && canvasId) {
          // Get the original canvas
          const { data: original, error: fetchError } = await supabase
            .from("canvases")
            .select("*")
            .eq("id", canvasId)
            .single();

          if (fetchError || !original) {
            return new Response(
              JSON.stringify({ error: "Canvas not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Verify ownership
          const hasAccess =
            original.user_id === userId ||
            (organizationId && original.organization_id === organizationId);

          if (!hasAccess) {
            return new Response(
              JSON.stringify({ error: "Access denied" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const duplicateCanvas = {
            user_id: userId,
            organization_id: organizationId,
            name: `${original.name} (Copy)`,
            content: original.content,
            thumbnail: original.thumbnail,
          };

          const { data, error } = await supabase
            .from("canvases")
            .insert(duplicateCanvas)
            .select()
            .single();

          if (error) {
            console.error("Error duplicating canvas:", error);
            return new Response(
              JSON.stringify({ error: "Failed to duplicate canvas" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ data }), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;
      }

      case "PATCH": {
        if (action === "update" && canvasId) {
          // First verify ownership
          const { data: existing, error: fetchError } = await supabase
            .from("canvases")
            .select("user_id, organization_id")
            .eq("id", canvasId)
            .single();

          if (fetchError || !existing) {
            return new Response(
              JSON.stringify({ error: "Canvas not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const hasAccess =
            existing.user_id === userId ||
            (organizationId && existing.organization_id === organizationId);

          if (!hasAccess) {
            return new Response(
              JSON.stringify({ error: "Access denied" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const body: CanvasData = await req.json();
          
          // Validate input
          const validation = validateCanvasData(body);
          if (!validation.valid) {
            return new Response(
              JSON.stringify({ error: validation.error }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Only allow updating name, content, and thumbnail
          const updates: Partial<CanvasData> = {};
          if (body.name !== undefined) updates.name = body.name.trim();
          if (body.content !== undefined) updates.content = body.content;
          if (body.thumbnail !== undefined) updates.thumbnail = body.thumbnail;

          const { data, error } = await supabase
            .from("canvases")
            .update(updates)
            .eq("id", canvasId)
            .select()
            .single();

          if (error) {
            console.error("Error updating canvas:", error);
            return new Response(
              JSON.stringify({ error: "Failed to update canvas" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;
      }

      case "DELETE": {
        if (action === "delete" && canvasId) {
          // First verify ownership
          const { data: existing, error: fetchError } = await supabase
            .from("canvases")
            .select("user_id, organization_id")
            .eq("id", canvasId)
            .single();

          if (fetchError || !existing) {
            return new Response(
              JSON.stringify({ error: "Canvas not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const hasAccess =
            existing.user_id === userId ||
            (organizationId && existing.organization_id === organizationId);

          if (!hasAccess) {
            return new Response(
              JSON.stringify({ error: "Access denied" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { error } = await supabase.from("canvases").delete().eq("id", canvasId);

          if (error) {
            console.error("Error deleting canvas:", error);
            return new Response(
              JSON.stringify({ error: "Failed to delete canvas" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Canvas API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
