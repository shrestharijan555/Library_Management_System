import { createClient } from "@supabase/supabase-js";

/**
 * Creates a server-only Supabase client initialized with the Service Role Key.
 * WARNING: MUST NEVER BE IMPORTED INTO CLIENT COMPONENTS OR EXPOSED TO THE BROWSER.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
