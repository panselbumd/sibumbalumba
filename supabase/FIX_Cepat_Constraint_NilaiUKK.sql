-- ============================================================
-- PERBAIKAN LANGSUNG — jalankan ini SEKALI untuk membersihkan
-- constraint/index yang nyangkut dari percobaan sebelumnya
-- ============================================================
alter table public.nilai_ukk drop constraint if exists nilai_ukk_peserta_tahap_penilai_key;
drop index if exists public.nilai_ukk_peserta_tahap_penilai_key;

-- Setelah ini berhasil (harus muncul "ALTER TABLE" / "DROP INDEX",
-- boleh muncul NOTICE "does not exist, skipping" — itu normal),
-- baru jalankan ulang 0003_rekap_5_tim_ukk.sql dari zip TERBARU.
