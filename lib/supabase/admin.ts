import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client khusus SERVICE ROLE — hanya boleh dipakai di Server Action
 * yang sudah divalidasi requireRole(["super_admin"]) SEBELUM memanggil
 * ini. TIDAK PERNAH diimpor di komponen client ("use client") atau
 * dikirim ke browser dalam bentuk apa pun.
 *
 * service_role key membypass RLS sepenuhnya — itu sebabnya file ini
 * cuma dipakai untuk satu keperluan sempit: memanggil
 * supabase.auth.admin.createUser() (Admin API), yang memang hanya
 * bisa dipanggil dengan service_role, bukan anon key.
 *
 * Untuk operasi lain (update role, baca profil, dsb.) TETAP pakai
 * lib/supabase/server.ts (anon key + sesi user) supaya RLS tetap
 * jadi lapisan pertahanan utama — file ini HANYA untuk Admin API.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diset di environment variables server."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
