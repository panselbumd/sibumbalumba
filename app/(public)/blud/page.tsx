import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function BludPage() {
  const supabase = await createClient();
  const { data: daftarBlud, error } = await supabase
    .from("blud")
    .select("id, nama, jenis_layanan, status, profil_singkat")
    .order("nama");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Badan Layanan Umum Daerah (BLUD)</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Daftar BLUD Kota Batu beserta jenis layanan masing-masing.
          </p>
        </div>

        {error || !daftarBlud?.length ? (
          <div
            className="rounded-xl border p-5 text-sm text-gray-500"
            style={{ borderColor: "var(--color-border)" }}
          >
            Data BLUD belum tersedia — akan tampil begitu Supabase project
            produksi tersambung dan data sudah dipublikasikan admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daftarBlud.map((blud) => (
              <div
                key={blud.id}
                className="rounded-xl border p-5"
                style={{ borderColor: "var(--color-border)", borderTop: "3px solid var(--color-accent)" }}
              >
                <h2 className="font-medium">{blud.nama}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Jenis layanan: {blud.jenis_layanan ?? "—"}
                </p>
                <span
                  className="inline-block mt-3 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                    color: "var(--color-primary)",
                  }}
                >
                  {blud.status}
                </span>
                {blud.profil_singkat && (
                  <p className="text-sm text-gray-500 mt-3">{blud.profil_singkat}</p>
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
