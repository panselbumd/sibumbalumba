# SIBUMBALUMBA — Scaffold Tahap 14

Scaffold ini adalah hasil Tahap 14 (Coding) dari rangkaian 18 tahap pengembangan
SIBUMBALUMBA. Fokusnya: membuktikan pola arsitektur keamanan (RBAC + RLS +
segregation of duties untuk nilai UKK) benar-benar berjalan, bukan cuma
didokumentasikan.

## Status

- ✅ `next build` sukses (Next.js 15.3.9, TypeScript strict mode) — 7 route
- ✅ 16 unit test lolos (`npm run test`)
- ✅ Landing page modern (navbar sticky, hero gradient, stat card, dark/light mode) sesuai Tahap 9
- ✅ Halaman login diperbarui (pesan error tidak membocorkan info akun) + halaman "akses ditolak" ramah pengguna
- ⏳ Belum terhubung ke project Supabase nyata (pakai placeholder di `.env.example`) — **inilah sebabnya jika di-deploy apa adanya, `/internal/*` tidak akan merespons benar**
- ⏳ Modul bisnis (BUMD, BLUD, Monitoring, Evaluasi, AI Assistant, Digital Office, Knowledge Base, Berita) belum diimplementasi — lihat `GAP_ANALYSIS_SIBUMBALUMBA.md`

Catatan: ada 1 build warning non-fatal soal Edge Runtime dari `@supabase/supabase-js` yang dipakai di `middleware.ts` — ini dikenal umum di ekosistem Supabase+Next.js, tidak menggagalkan build atau deployment, aman diabaikan.

## Lokasi File SQL (Migration)

Semua SQL migration ada di `supabase/migrations/`, dijalankan **berurutan sesuai nomor**:

| File | Isi |
|---|---|
| `0001_init_schema.sql` | Skema inti: tabel, enum, RLS, trigger dasar (Tahap 12 v2 — sudah termasuk perbaikan bug infinite recursion RLS) |
| `0002_username_login_dan_seed_data.sql` | Kolom `username`, fungsi resolusi login, seed data 2 BUMD + 5 BLUD asli |
| `0003_rekap_5_tim_ukk.sql` | Skema penilaian independen 5 Tim UKK + rekap otomatis Hasil UKK final |

Jalankan lewat Supabase SQL Editor (copy-paste isi tiap file secara berurutan) atau via Supabase CLI:
```bash
supabase db push
```
(pastikan ketiga file ada di `supabase/migrations/` dengan urutan nama yang benar seperti di atas — Supabase CLI menjalankan migration berdasarkan urutan nama file).

## Setup Cepat

```bash
npm install
cp .env.example .env.local
# isi .env.local dengan kredensial Supabase project development Anda
npm run dev
```

## Menjalankan Test & Build

```bash
npm run test     # unit test (Vitest) — 16 test, ~1 detik
npm run build    # verifikasi production build + type-check
```

## Struktur Penting

| Path | Isi |
|---|---|
| `actions/nilai-ukk.actions.ts` | Server Action paling sensitif — hanya `tim_ukk` yang bisa memanggilnya |
| `actions/seleksi.actions.ts` | Administrasi seleksi — termasuk `assistedRegisterPeserta` (khusus `super_admin`) |
| `lib/auth/rbac.ts` | `requireRole()` — guard server-side, lapisan kedua setelah RLS |
| `middleware.ts` | Route protection per role (lapisan UX, bukan satu-satunya penjaga keamanan) |
| `lib/validations/*.schema.ts` | Skema Zod, dipisah dari action agar mudah diuji |
| `types/database.types.ts` | **STUB** — ganti dengan `supabase gen types typescript` dari project asli |

## Yang Perlu Dilakukan Sebelum Production

1. Jalankan migration `Tahap12_Supabase_Schema_SIBUMBALUMBA.sql` ke project Supabase.
2. Generate ulang `types/database.types.ts` dari project itu, pasang kembali generic `<Database>` di `lib/supabase/client.ts` dan `server.ts`.
3. Tambahkan integration test terhadap RLS asli (lihat `Tahap15_Testing_SIBUMBALUMBA.md` §3 — daftar skenario negatif yang masih `[ ]`).
4. Review manual halaman `assisted-entry` dan `penilaian-ukk` oleh reviewer selain penulis kode (four-eyes principle).
5. Gabungkan dengan struktur/halaman yang sudah ada di repo `sibumbaluba` — lihat `Tahap16_Deployment_GitHub_SIBUMBALUMBA.md` untuk langkah penggabungan yang aman.

## Dokumentasi Lengkap

Scaffold ini adalah turunan dari 18 dokumen tahap (Tahap 1–18) yang dibuat
bersamaan dengannya. Rujuk dokumen tersebut untuk konteks arsitektur, RBAC
matrix, dan alasan setiap keputusan desain.
