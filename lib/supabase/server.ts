import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client untuk Server Components / Server Actions.
 * Sesi diambil dari cookies request — ini yang dipakai untuk
 * mengevaluasi RLS policy sesuai auth.uid() milik user yang login.
 *
 * CATATAN: sama seperti client.ts, generic <Database> dipasang kembali
 * setelah `supabase gen types` dijalankan terhadap project riil.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll dipanggil dari Server Component — aman diabaikan
            // karena middleware yang menangani refresh sesi.
          }
        },
      },
    }
  );
}
