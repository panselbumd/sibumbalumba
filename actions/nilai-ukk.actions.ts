"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/rbac";
import { inputNilaiSchema, submitFinalSchema } from "@/lib/validations/nilai-ukk.schema";

/**
 * FILE INI SENGAJA DIPISAH dari actions/seleksi.actions.ts
 * (lihat Tahap 11 §"Keputusan Struktur Penting" poin 2).
 *
 * ATURAN KERAS:
 * - Hanya role 'tim_ukk' yang boleh memanggil action di file ini.
 * - Tidak ada, dan tidak akan pernah ada, action untuk role
 *   'panitia_seleksi' di sini (lihat Tahap 13 §4).
 */

export async function inputNilaiUkk(input: unknown) {
  // Lapisan 1: guard role di server (defense in depth, RLS = lapisan utama)
  const profile = await requireRole(["tim_ukk"]);

  const parsed = inputNilaiSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nilai_ukk")
    .upsert(
      {
        peserta_id: parsed.data.pesertaId,
        tahap: parsed.data.tahap,
        skor: parsed.data.skor,
        tim_ukk_id: profile.id, // dipaksa = user yang login, tidak bisa dispoof dari client
      },
      { onConflict: "peserta_id,tahap,tim_ukk_id" }
      // CATATAN: constraint diubah dari (peserta_id,tahap) menjadi
      // (peserta_id,tahap,tim_ukk_id) — lihat Patch2_Rekap_5_TimUKK.
      // Ini mengizinkan 5 anggota Tim UKK menilai peserta+tahap yang
      // sama secara independen; hasil akhir direkap otomatis lewat
      // trigger database, bukan di kode aplikasi ini.
    )
    .select()
    .single();

  if (error) {
    // RLS akan menolak di sini juga jika is_final sudah true —
    // pesan error digeneralisasi agar tidak membocorkan detail skema.
    return { success: false as const, error: "Gagal menyimpan nilai" };
  }

  return { success: true as const, data };
}

export async function submitNilaiFinal(input: unknown) {
  const profile = await requireRole(["tim_ukk"]);
  const parsed = submitFinalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();

  // Idempotency check: tolak jika sudah final sebelumnya
  const { data: existing } = await supabase
    .from("nilai_ukk")
    .select("is_final, tim_ukk_id")
    .eq("id", parsed.data.nilaiId)
    .single();

  if (!existing) {
    return { success: false as const, error: "Data nilai tidak ditemukan" };
  }
  if (existing.is_final) {
    return { success: false as const, error: "Nilai sudah dikunci sebelumnya" };
  }
  if (existing.tim_ukk_id !== profile.id) {
    return { success: false as const, error: "Tidak berwenang" };
  }

  const { error } = await supabase
    .from("nilai_ukk")
    .update({ is_final: true, submitted_at: new Date().toISOString() })
    .eq("id", parsed.data.nilaiId);

  if (error) {
    return { success: false as const, error: "Gagal mengunci nilai" };
  }

  return { success: true as const };
}

/**
 * Untuk panitia_seleksi: HANYA lewat view agregat, tidak pernah
 * menyentuh tabel nilai_ukk mentah.
 */
export async function getStatusAgregatUkk(pesertaId: string) {
  await requireRole(["panitia_seleksi", "super_admin", "admin_bpsda"]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_status_penilaian_ukk")
    .select("*")
    .eq("peserta_id", pesertaId)
    .single();

  if (error) {
    return { success: false as const, error: "Gagal mengambil status" };
  }

  return { success: true as const, data };
}

/**
 * Progres rekap 5 Tim UKK ("3 dari 5 penilai sudah submit") — untuk
 * panitia memantau proses tanpa melihat skor individual mana pun.
 */
export async function getProgresPenilaianUkk(pesertaId: string) {
  await requireRole(["panitia_seleksi", "super_admin", "admin_bpsda", "tim_ukk"]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_progres_penilaian_ukk")
    .select("*")
    .eq("peserta_id", pesertaId);

  if (error) {
    return { success: false as const, error: "Gagal mengambil progres" };
  }

  return { success: true as const, data };
}

/**
 * Hasil UKK final (rata-rata 5 penilai) — HANYA terisi otomatis oleh
 * trigger database `cek_dan_finalisasi_hasil_ukk` setelah kelima Tim
 * UKK submit. Tidak ada action untuk MEMBUAT baris ini secara manual
 * — dan memang tidak boleh ada (lihat RLS hasil_ukk_final: tanpa
 * policy INSERT untuk role apa pun).
 */
export async function getHasilUkkFinal(pesertaId: string, tahap: string) {
  await requireRole(["panitia_seleksi", "super_admin", "admin_bpsda", "tim_ukk"]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hasil_ukk_final")
    .select("skor_rata_rata, jumlah_penilai, ditetapkan_at")
    .eq("peserta_id", pesertaId)
    .eq("tahap", tahap)
    .maybeSingle();

  if (error) {
    return { success: false as const, error: "Gagal mengambil hasil final" };
  }

  return { success: true as const, data };
}
