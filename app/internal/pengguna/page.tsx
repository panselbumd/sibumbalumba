import { requireRoleForPage } from "@/lib/auth/rbac";
import { listUserAccounts } from "@/actions/user-management.actions";
import { UserManagementForm } from "./UserManagementForm";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin_bpsda: "Admin BPSDA",
  admin_bumd: "Admin BUMD",
  admin_blud: "Admin BLUD",
  panitia_seleksi: "Panitia Seleksi",
  tim_ukk: "Tim UKK",
};

export default async function ManajemenPenggunaPage() {
  // Halaman ini HANYA pernah selesai dirender untuk super_admin —
  // konsisten dengan pola requireRoleForPage di halaman internal lain.
  await requireRoleForPage(["super_admin"]);

  const result = await listUserAccounts();
  const akunList = result.success ? result.data : [];

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-medium">Manajemen Pengguna</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-xl">
          Semua akun internal (Admin BPSDA, Admin BUMD/BLUD, Panitia Seleksi,
          Tim UKK) dibuat dari sini oleh Super Admin. Akun Peserta Seleksi
          TIDAK dibuat di sini — peserta mendaftar mandiri lewat portal
          publik.
        </p>
      </div>

      <UserManagementForm />

      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Akun Internal Saat Ini
        </h2>
        {akunList.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada akun internal dibuat.</p>
        ) : (
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <th className="p-3">Username</th>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {akunList.map((akun) => (
                  <tr key={akun.id} className="border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
                    <td className="p-3 font-mono text-xs">{akun.username ?? "(belum diset)"}</td>
                    <td className="p-3">{akun.nama_lengkap}</td>
                    <td className="p-3">{ROLE_LABEL[akun.role] ?? akun.role}</td>
                    <td className="p-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: akun.is_active
                            ? "color-mix(in srgb, var(--color-accent) 15%, transparent)"
                            : "color-mix(in srgb, var(--color-danger) 15%, transparent)",
                          color: akun.is_active ? "var(--color-accent)" : "var(--color-danger)",
                        }}
                      >
                        {akun.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
