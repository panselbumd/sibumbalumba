import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client untuk digunakan di Client Components.
 * Tidak pernah memuat service_role key — hanya anon key publik.
 *
 * CATATAN: generic <Database> sengaja tidak dipasang di scaffold ini
 * karena types/database.types.ts hanyalah stub manual. Begitu project
 * riil terhubung ke Supabase, jalankan:
 *   supabase gen types typescript --project-id <id> > types/database.types.ts
 * lalu pasang kembali sebagai createBrowserClient<Database>(...).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
