import { requireRoleForPage } from "@/lib/auth/rbac";

/**
 * Halaman ini SENGAJA tidak pernah menerima role selain tim_ukk/super_admin.
 * requireRoleForPage() akan redirect ke /internal/tidak-berwenang untuk
 * role lain — halaman ini tidak pernah "dirender lalu disembunyikan",
 * tapi memang tidak pernah selesai dirender untuk role yang tidak
 * berwenang (lihat Tahap 8 §4).
 */
export default async function PenilaianUkkPage() {
  await requireRoleForPage(["tim_ukk", "super_admin"]);

  return (
    <main className="p-6">
      <h1 className="text-xl font-medium">Penilaian UKK</h1>
      <p className="text-sm text-gray-500 mt-1">
        Daftar peserta yang ditugaskan ke sesi Anda akan tampil di sini.
      </p>
    </main>
  );
}
