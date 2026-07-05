import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export default function BeritaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Berita &amp; Pengumuman</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kabar terbaru seputar pembinaan BUMD/BLUD dan proses seleksi Kota
            Batu.
          </p>
        </div>

        <div
          className="rounded-xl border p-6 text-sm text-gray-500 text-center"
          style={{ borderColor: "var(--color-border)" }}
        >
          Belum ada berita yang dipublikasikan. Admin BPSDA dapat menambahkan
          berita lewat modul Digital Office begitu modul tersebut aktif.
        </div>
      </main>
      <Footer />
    </div>
  );
}
