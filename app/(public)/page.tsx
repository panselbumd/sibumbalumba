import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { StatCard } from "@/components/shared/StatCard";

/**
 * CATATAN: angka statistik di bawah masih PLACEHOLDER ("Menunggu data").
 * Begitu Supabase asli tersambung, ganti dengan query nyata, contoh:
 *
 *   const supabase = await createClient();
 *   const { count: jumlahBumd } = await supabase
 *     .from("bumd").select("*", { count: "exact", head: true });
 *
 * lalu jadikan komponen ini async Server Component. Dashboard publik
 * (/dashboard) HANYA menampilkan data berstatus 'published' — sesuai
 * FR-23 (transparansi publik) dan RLS Tahap 12
 * (`evaluasi_bumd_read_published_public`), BUKAN data mentah/draft.
 */
export default function PublicLandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero dengan foto Kota Batu sebagai background transparan */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/hero-batu.jpg"
              alt="Pemandangan Kota Batu dari udara"
              fill
              priority
              className="object-cover opacity-25 dark:opacity-15"
            />
            {/* Overlay gradient Biru Air -> Orange, memastikan teks tetap terbaca */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 55%, transparent) 0%, var(--color-surface) 85%), linear-gradient(120deg, color-mix(in srgb, var(--color-primary) 22%, transparent), color-mix(in srgb, var(--color-accent) 14%, transparent))",
              }}
            />
          </div>

          <div className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center flex flex-col items-center gap-5">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full border backdrop-blur"
              style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
            >
              Pemerintah Kota Batu
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              SIBUMBALUMBA
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-xl text-base md:text-lg">
              Satu sistem terpadu untuk pembinaan, monitoring, evaluasi, dan
              seleksi Badan Usaha Milik Daerah (BUMD) dan Badan Layanan Umum
              Daerah (BLUD) Kota Batu.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="rounded-md px-5 py-2.5 text-sm text-white shadow-sm"
                style={{ background: "var(--color-primary)" }}
              >
                Lihat Dashboard Publik
              </Link>
              <Link
                href="/seleksi"
                className="rounded-md px-5 py-2.5 text-sm text-white shadow-sm"
                style={{ background: "var(--color-accent)" }}
              >
                Info Seleksi Terbuka
              </Link>
            </div>
            <p className="text-xs text-gray-400 max-w-sm pt-1">
              Dashboard publik dapat diakses tanpa login — seluruh data yang
              ditampilkan telah melalui proses kurasi dan publikasi resmi oleh
              admin, sesuai ketentuan keterbukaan informasi publik.
            </p>
          </div>
        </section>

        {/* Statistik ringkas */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="BUMD Terdaftar" value="Menunggu data" hint="Akan tampil setelah admin menginput" />
            <StatCard label="BLUD Terdaftar" value="Menunggu data" hint="Akan tampil setelah admin menginput" />
            <StatCard label="Rata-rata Skor Kinerja" value="Menunggu data" hint="Dipublikasikan tiap periode evaluasi" />
            <StatCard label="Seleksi Berjalan" value="Menunggu data" hint="Akan tampil saat ada pengumuman aktif" />
          </div>
        </section>

        {/* Modul */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <h2 className="text-lg font-medium mb-4">Layanan Utama</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: "var(--color-border)", borderTop: "3px solid var(--color-primary)" }}
            >
              <h3 className="font-medium mb-1">Monitoring &amp; Evaluasi</h3>
              <p className="text-sm text-gray-500">
                Pantau kinerja BUMD dan BLUD berbasis indikator resmi.
              </p>
            </div>
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: "var(--color-border)", borderTop: "3px solid var(--color-accent)" }}
            >
              <h3 className="font-medium mb-1">Seleksi Terbuka &amp; Internal</h3>
              <p className="text-sm text-gray-500">
                Direksi, Dewan Pengawas, Komisaris, dan Pegawai BLUD.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
