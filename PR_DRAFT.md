# Draf Commit Message & Pull Request
## Untuk penggabungan scaffold Tahap 14 ke `panselbumdkwb-commits/sibumbaluba`

---

## Commit Message

```
feat: fondasi RBAC & segregation of duties untuk nilai UKK (FR-17a)

Menambahkan lapisan keamanan berlapis (RLS + server-side guard) untuk
memastikan panitia_seleksi tidak pernah punya akses tulis maupun baca
mentah ke tabel nilai_ukk, dan menambahkan model pendaftaran hybrid
(mandiri/assisted) untuk seleksi Dewan Pengawas & Komisaris.

- lib/auth/rbac.ts: requireRole() guard, dipanggil di setiap Server
  Action dan halaman sensitif sebagai defense-in-depth kedua setelah RLS
- actions/nilai-ukk.actions.ts: input & submit nilai UKK, hanya tim_ukk,
  dengan idempotency check saat mengunci nilai final
- actions/seleksi.actions.ts: registrasi Direksi, verifikasi berkas,
  dan assisted-entry (khusus super_admin, tercatat di audit_log)
- middleware.ts: route protection per role untuk /internal/seleksi/*
- 16 unit test baru (Vitest), termasuk pembuktian otomatis bahwa
  panitia_seleksi ditolak mengakses fungsi nilai UKK

Referensi: Tahap 1 FR-17a, Tahap 7 RBAC Matrix, Tahap 12 RLS policies.

Test: npm run test (16 passed), npm run build (sukses)
```

---

## Pull Request Description

**Judul:** feat: RBAC segregation of duties untuk nilai UKK + hybrid registration Dewas/Komisaris

**Ringkasan**

PR ini menambahkan fondasi keamanan untuk dua requirement kritis dari proses seleksi BUMD:

1. **Panitia seleksi tidak bisa mengintervensi penilaian UKK** — ditegakkan di dua lapisan: RLS database (lihat migration terlampir di dokumentasi Tahap 12) dan guard server-side (`requireRole`) di setiap Server Action/halaman terkait.
2. **Pendaftaran Dewan Pengawas/Komisaris bersifat hybrid** — peserta ASN eligible bisa mendaftar mandiri lewat token undangan, atau dibantu oleh `super_admin` (assisted-entry), dengan setiap aksi assisted-entry tercatat otomatis ke audit log.

**Apa yang berubah**
- 8 file baru: 2 Server Action file, 1 RBAC helper, 1 middleware, 2 file skema validasi, 2 halaman baru (login, assisted-entry) + 1 halaman guard (penilaian-ukk)
- 3 file test baru, 16 test case, seluruhnya lolos

**Cara menguji**
```bash
npm install
npm run test    # harus 16 passed
npm run build   # harus sukses tanpa error TypeScript
```
Untuk uji end-to-end penuh (butuh Supabase project dengan migration Tahap 12 ter-apply):
1. Login sebagai `panitia_seleksi` → pastikan `/internal/seleksi/penilaian-ukk` redirect
2. Login sebagai `tim_ukk` → input nilai, submit final, coba submit lagi → harus ditolak (idempotency)
3. Login sebagai selain `super_admin` → coba akses `/internal/seleksi/dewas-komisaris/assisted-entry` → harus redirect

**Checklist sebelum merge**
- [ ] Preview deployment Vercel sudah dicek manual (lihat Tahap 17 §4)
- [ ] Migration Tahap 12 sudah di-apply ke Supabase project yang dipakai preview
- [ ] Tidak ada breaking change terhadap route publik yang sudah ada (khususnya untuk menghindari kasus route collision `(internal)/seleksi/` vs `(public)/seleksi/` yang pernah terjadi sebelumnya)
- [ ] Review manual oleh minimal 1 orang lain untuk bagian assisted-entry & penilaian-ukk

**Referensi dokumen**
Tahap 1 (FR-17a, FR-13–15), Tahap 6 §6–8, Tahap 7 (RBAC Matrix), Tahap 12 (RLS policies), Tahap 15 (Testing).
