import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase con la service role key: bypassa RLS y puede administrar
 * usuarios de auth (auth.admin.*). Solo para server actions ya protegidas
 * con requireAdmin() — nunca exponer al cliente ni usar fuera del servidor.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
