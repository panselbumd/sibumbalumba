import { z } from "zod";

export const INTERNAL_ROLES = [
  "super_admin",
  "admin_bpsda",
  "admin_bumd",
  "admin_blud",
  "panitia_seleksi",
  "tim_ukk",
] as const;
// Sengaja TIDAK termasuk "peserta" — akun peserta dibuat mandiri oleh
// peserta sendiri lewat portal pendaftaran, bukan oleh Super Admin
// lewat form ini (kecuali jalur assisted-entry Dewas/Komisaris yang
// sudah punya action terpisah: assistedRegisterPeserta).

export const createUserAccountSchema = z
  .object({
    username: z
      .string()
      .min(3, "Minimal 3 karakter")
      .max(50)
      .regex(/^[a-z0-9._-]+$/, "Hanya huruf kecil, angka, titik, garis bawah/hubung"),
    namaLengkap: z.string().min(2).max(200),
    password: z.string().min(8, "Minimal 8 karakter"),
    role: z.enum(INTERNAL_ROLES),
    entityType: z.enum(["bumd", "blud"]).nullable().optional(),
    entityId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) =>
      (data.role !== "admin_bumd" && data.role !== "admin_blud") ||
      (data.entityType && data.entityId),
    {
      message: "admin_bumd/admin_blud wajib memilih entitas yang dikelola",
      path: ["entityId"],
    }
  );
