-- ============================================================
-- PATCH 0004 — Login username case-insensitive
-- SIBUMBALUMBA
-- Jalankan SETELAH 0001, 0002, 0003
-- ============================================================
-- MASALAH YANG DIPERBAIKI:
-- get_email_for_username() (dari 0002) membandingkan username APA
-- ADANYA (case-sensitive). Kalau akun dibuat dengan username
-- "Admin.Bumd" tapi user mengetik "admin.bumd" saat login (atau
-- sebaliknya), fungsi tidak menemukan baris manapun -> frontend
-- menampilkan "Username atau kata sandi salah" walau password benar.
-- Ini salah satu penyebab paling umum laporan "tidak bisa login".
--
-- PERBAIKAN:
-- 1. Fungsi resolusi username sekarang membandingkan lower(trim(...))
--    di kedua sisi.
-- 2. Tambah unique index case-insensitive supaya ke depannya tidak
--    mungkin ada dua akun yang usernamenya cuma beda kapitalisasi
--    (mis. "adminbumd" dan "AdminBumd") yang justru akan membuat hasil
--    pencarian ambigu.

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create or replace function public.get_email_for_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(p_username))
    and p.is_active = true
  limit 1
$$;

-- Grant tidak berubah (sudah ada dari 0002), diulang di sini supaya
-- file ini aman dijalankan berdiri sendiri kalau urutan migration
-- sebelumnya sempat gagal sebagian.
revoke all on function public.get_email_for_username(text) from public;
grant execute on function public.get_email_for_username(text) to anon, authenticated;
