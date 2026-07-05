import { getSessionProfile } from "@/lib/auth/rbac";
import Link from "next/link";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin_bpsda: "Admin BPSDA",
  admin_bumd: "Admin BUMD",
  admin_blud: "Admin BLUD",
  panitia_seleksi: "Panitia Seleksi",
  tim_ukk: "Tim UKK",
  peserta: "Peserta",
};

export default async function TidakBerwenangPage() {
  const profile = await getSessionProfile();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="max-w-sm flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
          style={{ background: "color-mix(in srgb, var(--color-warning) 15%, transparent)" }}
        >
          🔒
        </div>
        <h1 className="text-lg font-medium">Anda tidak memiliki akses ke halaman ini</h1>
        <p className="text-sm text-gray-500">
          {profile
            ? `Akun Anda saat ini terdaftar sebagai ${ROLE_LABEL[profile.role] ?? profile.role}. Halaman ini dibatasi untuk role lain sesuai kebijakan keamanan sistem.`
            : "Sesi Anda tidak ditemukan. Silakan masuk kembali."}
        </p>
        <Link
          href="/internal/dashboard"
          className="mt-2 rounded-md px-4 py-2 text-sm text-white"
          style={{ background: "var(--color-primary)" }}
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </main>
  );
}
