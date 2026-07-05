import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole =
  | "super_admin"
  | "admin_bpsda"
  | "admin_bumd"
  | "admin_blud"
  | "panitia_seleksi"
  | "tim_ukk"
  | "peserta";

export type SessionProfile = {
  id: string;
  role: UserRole;
  entityId: string | null;
};

/**
 * Mengambil profil (termasuk role) dari sesi server saat ini.
 * SELALU dipanggil ulang di server — TIDAK PERNAH mempercayai
 * role yang dikirim dari client (lihat Tahap 13 §8).
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, entity_id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    role: profile.role as UserRole,
    entityId: profile.entity_id,
  };
}

/**
 * Guard eksplisit untuk Server Action / Route Handler.
 * Melempar error jika role user tidak termasuk allowedRoles.
 *
 * Ini adalah lapisan pertahanan KEDUA (defense in depth) —
 * lapisan pertama tetap RLS di database (Tahap 12).
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<SessionProfile> {
  const profile = await getSessionProfile();

  if (!profile) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new Error("FORBIDDEN");
  }

  return profile;
}

/**
 * Varian untuk halaman (Server Component). requireRole() di atas tetap
 * throw error mentah — itu benar untuk Server Action (supaya caller bisa
 * menampilkan pesan error terkontrol). Untuk halaman, kita ingin redirect
 * ke halaman "akses ditolak" yang ramah, bukan error boundary teknis.
 */
export async function requireRoleForPage(
  allowedRoles: UserRole[]
): Promise<SessionProfile> {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect("/internal/tidak-berwenang");
  }

  return profile;
}
