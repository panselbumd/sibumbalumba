import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

/**
 * Daftar regulasi berikut sudah diverifikasi lewat pencarian (nomor,
 * tahun, dan judul resmi), bukan dikarang. Tetap disarankan cross-check
 * dengan JDIH Kemendagri (jdih.kemendagri.go.id) atau JDIH Kota Batu
 * untuk memastikan tidak ada perubahan/pencabutan terbaru.
 */
const REGULASI = [
  {
    kategori: "Dasar Hukum Pemerintahan Daerah",
    items: [
      {
        judul: "UU No. 23 Tahun 2014 tentang Pemerintahan Daerah",
        ringkasan:
          "Dasar hukum utama kewenangan pemerintah daerah, termasuk landasan pembentukan BUMD (menggantikan UU No. 5 Tahun 1962 tentang Perusahaan Daerah).",
      },
    ],
  },
  {
    kategori: "BUMD",
    items: [
      {
        judul: "PP No. 54 Tahun 2017 tentang Badan Usaha Milik Daerah",
        ringkasan:
          "Mengatur pendirian, modal, organ (KPM/RUPS, Dewan Pengawas/Komisaris, Direksi), tata kelola, evaluasi, restrukturisasi, hingga pembubaran BUMD.",
      },
      {
        judul:
          "Permendagri No. 37 Tahun 2018 tentang Pengangkatan dan Pemberhentian Anggota Dewan Pengawas atau Anggota Komisaris dan Anggota Direksi BUMD",
        ringkasan:
          "Mengatur tata cara dan syarat seleksi, pengangkatan, dan pemberhentian organ BUMD — menjadi rujukan utama modul Seleksi Direksi/Dewas/Komisaris di sistem ini.",
      },
    ],
  },
  {
    kategori: "BLUD",
    items: [
      {
        judul: "Permendagri No. 79 Tahun 2018 tentang Badan Layanan Umum Daerah",
        ringkasan:
          "Pedoman pengelolaan keuangan dan status BLUD, menggantikan Permendagri No. 61 Tahun 2007. Mengatur persyaratan penerapan, tata kelola, dan pelaporan BLUD.",
      },
      {
        judul: "PP No. 12 Tahun 2019 tentang Pengelolaan Keuangan Daerah",
        ringkasan:
          "Mengatur keuangan daerah secara umum, termasuk bab khusus mengenai Badan Layanan Umum Daerah. Menggantikan PP No. 58 Tahun 2005.",
      },
    ],
  },
];

export default function RegulasiPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Regulasi BUMD &amp; BLUD</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Peraturan perundang-undangan yang menjadi dasar hukum pembinaan,
            monitoring-evaluasi, dan seleksi BUMD/BLUD.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {REGULASI.map((grup) => (
            <div key={grup.kategori}>
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                {grup.kategori}
              </h2>
              <div className="flex flex-col gap-3">
                {grup.items.map((item) => (
                  <div
                    key={item.judul}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <h3 className="font-medium text-sm">{item.judul}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.ringkasan}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-8 rounded-xl border p-4 text-xs text-gray-400"
          style={{ borderColor: "var(--color-border)" }}
        >
          Dokumen lengkap (PDF) belum ter-upload — akan ditambahkan admin
          BPSDA lewat modul Knowledge Base. Untuk salinan resmi, rujuk JDIH
          Kementerian Dalam Negeri atau JDIH Kota Batu.
        </div>
      </main>
      <Footer />
    </div>
  );
}
