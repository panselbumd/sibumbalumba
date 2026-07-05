"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/rbac";
import { createUserAccountSchema } from "@/lib/validations/user-management.schema";

/**
 * Manajemen akun pengguna — HANYA super_admin yang boleh membuat akun
 * internal (admin_bpsda, admin_bumd, admin_blud, panitia_seleksi,
 * tim_ukk). Akun peserta seleksi TIDAK dibuat lewat sini — peserta
 * mendaftar mandiri sendiri lewat portal publik (lihat
 * actions/seleksi.actions.ts: registerPesertaDireksi), kecuali jalur
 * assisted-entry Dewas/Komisaris yang memang punya action terpisah
 * (assistedRegisterPeserta) karena itu bukan "akun baru dari nol"
 * tapi pendaftaran ke seleksi tertentu.
 */
export async function createUserAccount(input: unknown) {
  // Lapisan 1: guard role di server (RLS profiles juga membatasi,
  // tapi Admin API createUser() memakai service_role yang BYPASS RLS
  // sepenuhnya — jadi guard di sini adalah SATU-SATUNYA pertahanan
  // untuk aksi ini, bukan defense-in-depth kedua seperti action lain.
  // Karena itu pengecekan ini WAJIB dilakukan sebelum baris kode apa
  // pun yang menyentuh createAdminClient().
  await requireRole(["super_admin"]);

  const parsed = createUserAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? "Input tidak valid" };
  }

  const { username, namaLengkap, password, role, entityType, entityId } = parsed.data;

  const supabase = await createClient();

  // Cek duplikasi username lebih dulu lewat client biasa (RLS-safe,
  // fungsi ini sudah ada dari Patch 0002 dan boleh dipanggil siapa
  // saja yang sudah login).
  const { data: existing } = await supabase.rpc("get_email_for_username", {
    p_username: username,
  });
  if (existing) {
    return { success: false as const, error: "Username sudah dipakai, pilih yang lain" };
  }

  const adminClient = createAdminClient();

  // Email internal dummy — tidak pernah dipakai untuk login (login
  // selalu lewat username), hanya supaya Supabase Auth punya kolom
  // email yang valid & unik.
  const internalEmail = `${username}@sibumbalumba.internal`;

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: internalEmail,
    password,
    email_confirm: true, // akun internal tidak perlu verifikasi email
    user_metadata: { nama_lengkap: namaLengkap, username },
  });

  if (createError || !created.user) {
    return {
      success: false as const,
      error: "Gagal membuat akun — kemungkinan email internal bentrok, coba username lain",
    };
  }

  // Trigger handle_new_user (Tahap 12) otomatis membuat baris profiles
  // dengan role default 'peserta' begitu auth.users terisi. Di sini
  // kita SEGERA update ke role/entity yang sebenarnya diminta.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      role,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
    })
    .eq("id", created.user.id);

  if (updateError) {
    // Rollback manual: akun auth sudah terlanjur dibuat, hapus lagi
    // supaya tidak ada akun "yatim" tanpa role yang benar.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return { success: false as const, error: "Gagal mengatur role akun, dibatalkan" };
  }

  return {
    success: true as const,
    data: { id: created.user.id, username, role },
  };
}

/**
 * Daftar akun internal (bukan peserta) — untuk ditampilkan di halaman
 * manajemen pengguna. Hanya kolom non-sensitif.
 */
export async function listUserAccounts() {
  await requireRole(["super_admin"]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, nama_lengkap, role, entity_type, entity_id, is_active")
    .neq("role", "peserta")
    .order("role");

  if (error) {
    return { success: false as const, error: "Gagal mengambil daftar akun" };
  }

  return { success: true as const, data };
}

/**
 * Nonaktifkan akun (soft — bukan hapus). Mempertahankan jejak audit
 * dan histori seleksi/evaluasi yang mungkin masih mereferensikan
 * akun tersebut sebagai foreign key.
 */
export async function nonaktifkanAkun(userId: string) {
  await requireRole(["super_admin"]);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) {
    return { success: false as const, error: "Gagal menonaktifkan akun" };
  }
  return { success: true as const };
}
