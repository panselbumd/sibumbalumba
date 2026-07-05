"use client";

import { useState } from "react";
import { createUserAccount } from "@/actions/user-management.actions";

const ROLE_OPTIONS = [
  { value: "admin_bpsda", label: "Admin BPSDA" },
  { value: "admin_bumd", label: "Admin BUMD" },
  { value: "admin_blud", label: "Admin BLUD" },
  { value: "panitia_seleksi", label: "Panitia Seleksi (Ketua Pansel)" },
  { value: "tim_ukk", label: "Tim UKK" },
  { value: "super_admin", label: "Super Admin" },
] as const;

export function UserManagementForm() {
  const [form, setForm] = useState({
    username: "",
    namaLengkap: "",
    password: "",
    role: "admin_bpsda" as string,
    entityId: "",
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const butuhEntitas = form.role === "admin_bumd" || form.role === "admin_blud";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const result = await createUserAccount({
      username: form.username,
      namaLengkap: form.namaLengkap,
      password: form.password,
      role: form.role,
      entityType: form.role === "admin_bumd" ? "bumd" : form.role === "admin_blud" ? "blud" : null,
      entityId: butuhEntitas ? form.entityId || null : null,
    });

    setLoading(false);

    if (!result.success) {
      setStatus({ type: "error", message: result.error });
      return;
    }

    setStatus({ type: "success", message: `Akun "${result.data.username}" berhasil dibuat.` });
    setForm({ username: "", namaLengkap: "", password: "", role: "admin_bpsda", entityId: "" });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-5 flex flex-col gap-4"
      style={{ borderColor: "var(--color-border)" }}
    >
      <h2 className="font-medium text-sm">Buat Akun Baru</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm flex flex-col gap-1">
          Username
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="mis. admin.pkmbatu"
            className="border rounded-md px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--color-border)" }}
          />
        </label>

        <label className="text-sm flex flex-col gap-1">
          Nama Lengkap
          <input
            required
            value={form.namaLengkap}
            onChange={(e) => setForm({ ...form, namaLengkap: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--color-border)" }}
          />
        </label>

        <label className="text-sm flex flex-col gap-1">
          Kata Sandi Awal
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--color-border)" }}
          />
        </label>

        <label className="text-sm flex flex-col gap-1">
          Role
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--color-border)" }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        {butuhEntitas && (
          <label className="text-sm flex flex-col gap-1 md:col-span-2">
            UUID Entitas ({form.role === "admin_bumd" ? "BUMD" : "BLUD"})
            <input
              required
              value={form.entityId}
              onChange={(e) => setForm({ ...form, entityId: e.target.value })}
              placeholder="lihat DAFTAR_AKUN_DAN_ROLE_SIBUMBALUMBA.md untuk UUID entitas"
              className="border rounded-md px-3 py-2 text-sm bg-transparent font-mono"
              style={{ borderColor: "var(--color-border)" }}
            />
          </label>
        )}
      </div>

      {status && (
        <p
          role="alert"
          className="text-sm rounded-md px-3 py-2"
          style={{
            color: status.type === "error" ? "var(--color-danger)" : "var(--color-accent)",
            background:
              status.type === "error"
                ? "color-mix(in srgb, var(--color-danger) 10%, transparent)"
                : "color-mix(in srgb, var(--color-accent) 10%, transparent)",
          }}
        >
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-md px-4 py-2 text-sm text-white disabled:opacity-50"
        style={{ background: "var(--color-primary)" }}
      >
        {loading ? "Membuat akun..." : "Buat Akun"}
      </button>
    </form>
  );
}
