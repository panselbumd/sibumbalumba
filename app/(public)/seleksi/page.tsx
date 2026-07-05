import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import Link from "next/link";

const JENIS_SELEKSI = [
  {
    judul: "Seleksi Direksi BUMD",
    sifat: "Terbuka",
    warna: "var(--color-primary)",
    deskripsi:
      "Pendaftaran terbuka untuk umum yang memenuhi syarat. Peserta membuat akun sendiri, mengunggah berkas, dan dapat memantau status seleksi secara real-time.",
  },
  {
    judul: "Seleksi Dewan Pengawas & Komisaris BUMD",
    sifat: "Internal / Restricted-Access",
    warna: "var(--color-accent)",
    deskripsi:
      "Khusus ASN Eselon II/III yang telah diverifikasi eligibilitasnya. Pendaftaran lewat token undangan (mandiri) atau difasilitasi Super Admin.",
  },
  {
    judul: "Seleksi Pegawai BLUD",
    sifat: "Terbuka",
    warna: "var(--color-primary)",
    deskripsi:
      "Meliputi tahap administrasi, CAT, tes kompetensi, dan wawancara sesuai kebutuhan masing-masing BLUD.",
  },
];

export default function SeleksiPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Informasi Seleksi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Jadwal dan pengumuman resmi akan tampil di halaman ini begitu
            panitia menerbitkannya.
          </p>
        </div>

        <div
          className="rounded-xl border p-4 mb-8 text-sm"
          style={{ borderColor: "var(--color-border)" }}
        >
          Belum ada pengumuman seleksi yang aktif saat ini. Pantau halaman ini
          secara berkala, atau berlangganan notifikasi lewat akun peserta
          Anda.
        </div>

        <div className="flex flex-col gap-4">
          {JENIS_SELEKSI.map((item) => (
            <div
              key={item.judul}
              className="rounded-xl border p-5"
              style={{ borderColor: "var(--color-border)", borderLeft: `3px solid ${item.warna}` }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-medium">{item.judul}</h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "color-mix(in srgb, " + item.warna + " 15%, transparent)", color: item.warna }}
                >
                  {item.sifat}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{item.deskripsi}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/login"
            className="rounded-md px-5 py-2.5 text-sm text-white"
            style={{ background: "var(--color-primary)" }}
          >
            Daftar / Masuk Akun Peserta
          </Link>
          <Link
            href="/regulasi"
            className="rounded-md px-5 py-2.5 text-sm border"
            style={{ borderColor: "var(--color-border)" }}
          >
            Lihat Regulasi Terkait
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
