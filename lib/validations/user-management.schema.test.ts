import { describe, it, expect } from "vitest";
import { createUserAccountSchema } from "@/lib/validations/user-management.schema";

describe("createUserAccountSchema", () => {
  it("menerima input valid untuk admin_bpsda (tanpa entitas)", () => {
    const result = createUserAccountSchema.safeParse({
      username: "admin.bpsda1",
      namaLengkap: "Budi Santoso",
      password: "sandiaman123",
      role: "admin_bpsda",
    });
    expect(result.success).toBe(true);
  });

  it("menolak admin_bumd TANPA entityId (wajib pilih entitas)", () => {
    const result = createUserAccountSchema.safeParse({
      username: "admin.amongtirto",
      namaLengkap: "Siti Aminah",
      password: "sandiaman123",
      role: "admin_bumd",
    });
    expect(result.success).toBe(false);
  });

  it("menerima admin_blud DENGAN entityId lengkap", () => {
    const result = createUserAccountSchema.safeParse({
      username: "admin.pkmbatu",
      namaLengkap: "Andi Wijaya",
      password: "sandiaman123",
      role: "admin_blud",
      entityType: "blud",
      entityId: "b0000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(true);
  });

  it("menolak username dengan huruf kapital/spasi", () => {
    const result = createUserAccountSchema.safeParse({
      username: "Admin BPSDA",
      namaLengkap: "Test",
      password: "sandiaman123",
      role: "admin_bpsda",
    });
    expect(result.success).toBe(false);
  });

  it("menolak password kurang dari 8 karakter", () => {
    const result = createUserAccountSchema.safeParse({
      username: "admin.test",
      namaLengkap: "Test",
      password: "pendek",
      role: "admin_bpsda",
    });
    expect(result.success).toBe(false);
  });

  it("menolak role 'peserta' — akun peserta tidak dibuat lewat form ini", () => {
    const result = createUserAccountSchema.safeParse({
      username: "peserta.coba",
      namaLengkap: "Test",
      password: "sandiaman123",
      role: "peserta",
    });
    expect(result.success).toBe(false);
  });
});
