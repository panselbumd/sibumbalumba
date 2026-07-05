"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Login berbasis username: resolusi username -> email dulu lewat
      // fungsi SECURITY DEFINER `get_email_for_username` (lihat
      // Patch_Username_dan_SeedData_SIBUMBALUMBA.sql), baru panggil
      // signInWithPassword seperti biasa. Kalau username tidak ditemukan,
      // fungsi mengembalikan null — kita SENGAJA tidak membedakan pesan
      // errornya dari "password salah", supaya tidak membocorkan info
      // username mana yang terdaftar (lihat catatan keamanan di patch SQL).
      const { data: email, error: resolveError } = await supabase.rpc(
        "get_email_for_username",
        { p_username: username.trim() }
      );

      if (resolveError || !email) {
        setError("Username atau kata sandi salah. Coba lagi.");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Username atau kata sandi salah. Coba lagi.");
        return;
      }

      // SENGAJA pakai window.location, bukan router.push() Next.js.
      // router.push() melakukan client-side transition yang kadang
      // tidak konsisten membawa cookie sesi yang BARU SAJA diset oleh
      // signInWithPassword() ke request RSC berikutnya — middleware
      // di server bisa saja masih membaca cookie lama (belum ada
      // sesi) dan melempar balik ke /login, membuat login TERLIHAT
      // gagal padahal sebenarnya sudah berhasil (persis gejala yang
      // dilaporkan: signInWithPassword sukses & last_sign_in_at
      // terupdate, tapi user terpental balik ke halaman login).
      // window.location.assign memaksa full page reload, memastikan
      // browser mengirim cookie terbaru secara penuh.
      window.location.assign("/internal/dashboard");
    } catch (err) {
      // Menangkap error tak terduga (mis. env var Supabase belum
      // benar/tidak terjangkau) supaya pengguna tetap melihat pesan,
      // bukan form yang diam-diam gagal tanpa keterangan.
      console.error("Login error:", err);
      setError(
        "Terjadi kendala teknis saat mencoba masuk. Silakan coba lagi atau hubungi admin."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(900px 300px at 50% -10%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent)",
      }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            SIBUMBALUMBA
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            Portal internal Kota Batu
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="border rounded-xl p-6 flex flex-col gap-4 shadow-sm"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <label className="text-sm flex flex-col gap-1">
            Username
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "var(--color-border)" }}
            />
          </label>

          <label className="text-sm flex flex-col gap-1">
            Kata sandi
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded-md pl-3 pr-10 py-2 text-sm bg-transparent w-full"
                style={{ borderColor: "var(--color-border)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          {error && (
            <p
              role="alert"
              className="text-sm rounded-md px-3 py-2"
              style={{ color: "var(--color-danger)", background: "color-mix(in srgb, var(--color-danger) 10%, transparent)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-md px-3 py-2.5 text-sm text-white disabled:opacity-50 transition-opacity"
            style={{ background: "var(--color-primary)" }}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Akun peserta seleksi Direksi bisa daftar mandiri lewat halaman
            pengumuman seleksi. Akun internal (admin, panitia, tim UKK)
            dibuat oleh Super Admin.
          </p>
        </form>
      </div>
    </main>
  );
}
