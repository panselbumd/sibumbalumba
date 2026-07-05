import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function BumdPage() {
  const supabase = await createClient();
  const { data: daftarBumd, error } = await supabase
    .from("bumd")
    .select("id, nama, jenis_usaha, status, profil_singkat")
    .order("nama");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Badan Usaha Milik Daerah (BUMD)</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Daftar BUMD Kota Batu beserta bidang usaha masing-masing.
          </p>
        </div>

        {error || !daftarBumd?.length ? (
          <div
            className="rounded-xl border p-5 text-sm text-gray-500"
            style={{ borderColor: "var(--color-border)" }}
          >
            Data BUMD belum tersedia — akan tampil begitu Supabase project
            produksi tersambung dan data sudah dipublikasikan admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daftarBumd.map((bumd) => (
              <div
                key={bumd.id}
                className="rounded-xl border p-5"
                style={{ borderColor: "var(--color-border)", borderTop: "3px solid var(--color-primary)" }}
              >
                <h2 className="font-medium">{bumd.nama}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Bidang usaha: {bumd.jenis_usaha ?? "—"}
                </p>
                <span
                  className="inline-block mt-3 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                    color: "var(--color-accent)",
                  }}
                >
                  {bumd.status}
                </span>
                {bumd.profil_singkat && (
                  <p className="text-sm text-gray-500 mt-3">{bumd.profil_singkat}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
