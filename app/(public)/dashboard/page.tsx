import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { StatCard } from "@/components/shared/StatCard";
import { createClient } from "@/lib/supabase/server";

/**
 * DASHBOARD PUBLIK — SENGAJA TIDAK ADA GUARD LOGIN DI HALAMAN INI.
 *
 * Ini bukan kelalaian: sesuai FR-23 (transparansi publik) dan arahan
 * eksplisit bahwa data di sini "sudah melalui seleksi dari admin",
 * halaman ini memang harus bisa diakses tanpa login, berbeda dari
 * /internal/dashboard yang memang mewajibkan login+role.
 *
 * Keamanannya BUKAN di guard halaman ini, tapi di RLS Supabase:
 * - evaluasi_bumd_read_published_public / evaluasi_blud_...
 *   hanya mengizinkan baris dengan status = 'published' terlihat
 *   oleh role anon (Tahap 12 v2).
 * - peserta_direksi_public_read hanya izinkan jenis_seleksi='direksi'.
 * Jadi meskipun query di bawah dijalankan tanpa sesi (anon), data
 * yang benar-benar sensitif tetap tidak akan pernah ikut terambil,
 * dijamin di level database — bukan disaring di komponen ini.
 */
export default async function PublicDashboardPage() {
  const supabase = await createClient();

  // Setiap query dibungkus try/catch terpisah: kalau Supabase belum
  // tersambung (masih placeholder) atau salah satu query gagal,
  // halaman tetap tampil dengan status yang jujur, bukan crash total.
  const [bumdCount, bludCount, evaluasiPublished, seleksiAktif] =
    await Promise.allSettled([
      supabase.from("bumd").select("*", { count: "exact", head: true }),
      supabase.from("blud").select("*", { count: "exact", head: true }),
      supabase
        .from("evaluasi_bumd")
        .select("skor_total")
        .eq("status", "published"),
      supabase
        .from("peserta_seleksi")
        .select("*", { count: "exact", head: true })
        .eq("jenis_seleksi", "direksi"),
    ]);

  const getCount = (r: PromiseSettledResult<{ count: number | null }>) =>
    r.status === "fulfilled" ? r.value.count : null;

  const jumlahBumd = getCount(bumdCount);
  const jumlahBlud = getCount(bludCount);
  const jumlahSeleksiDireksi = getCount(seleksiAktif);

  const rataRataSkor =
    evaluasiPublished.status === "fulfilled" && evaluasiPublished.value.data?.length
      ? (
          evaluasiPublished.value.data.reduce(
            (sum, row) => sum + (row.skor_total ?? 0),
            0
          ) / evaluasiPublished.value.data.length
        ).toFixed(1)
      : null;

  const fmt = (v: number | string | null, suffix = "") =>
    v === null ? "Belum ada data" : `${v}${suffix}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Dashboard Publik</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Data berikut adalah data yang sudah dipublikasikan resmi oleh
            admin. Belum termasuk data draf/dalam proses evaluasi internal.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="BUMD Terdaftar" value={fmt(jumlahBumd)} />
          <StatCard label="BLUD Terdaftar" value={fmt(jumlahBlud)} />
          <StatCard label="Rata-rata Skor Kinerja (Published)" value={fmt(rataRataSkor)} />
          <StatCard label="Pendaftar Seleksi Direksi" value={fmt(jumlahSeleksiDireksi)} />
        </div>

        <div
          className="rounded-xl border p-5 text-sm text-gray-500"
          style={{ borderColor: "var(--color-border)" }}
        >
          Grafik tren kinerja, daftar BUMD/BLUD per entitas, dan pengumuman
          seleksi aktif akan tampil di sini begitu modul terkait selesai
          diimplementasikan dan Supabase project produksi tersambung.
        </div>
      </main>

      <Footer />
    </div>
  );
}
