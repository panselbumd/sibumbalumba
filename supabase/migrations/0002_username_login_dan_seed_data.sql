-- ============================================================
-- PATCH — Username Login + Seed Data BUMD/BLUD
-- SIBUMBALUMBA
-- Jalankan SETELAH Tahap12_Supabase_Schema_SIBUMBALUMBA_v2.sql
-- ============================================================

-- ============================================================
-- BAGIAN 1 — LOGIN BERBASIS USERNAME
-- ============================================================
-- Supabase Auth secara native berbasis email, bukan username.
-- Pola yang aman: simpan username di profiles, sediakan fungsi
-- SECURITY DEFINER yang meresolusi username -> email, lalu FRONTEND
-- memanggil signInWithPassword({email, password}) seperti biasa
-- dengan email hasil resolusi tersebut.
--
-- CATATAN KEAMANAN PENTING (dijelaskan, bukan disembunyikan):
-- Fungsi ini WAJIB dipanggil oleh anon (sebelum login), sehingga
-- secara desain ia "membocorkan" satu bit informasi: apakah suatu
-- username terdaftar (dari ada/tidaknya hasil), sama seperti hampir
-- semua sistem login berbasis username di dunia nyata. Untuk
-- meminimalkan risiko user enumeration:
--   1. Frontend TETAP menampilkan pesan error generik ("Username
--      atau kata sandi salah") baik saat username tidak ditemukan
--      MAUPUN saat password salah — tidak pernah dibedakan.
--   2. Aktifkan rate limiting di Supabase Auth settings (Dashboard
--      → Authentication → Rate Limits) untuk membatasi percobaan.
--   3. Fungsi HANYA mengembalikan email, tidak ada kolom lain
--      (role, nama, dsb.) — permukaan kebocorannya diminimalkan.

alter table public.profiles add column if not exists username text unique;

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
  where p.username = p_username
    and p.is_active = true
  limit 1
$$;

-- Hanya anon & authenticated yang perlu memanggil ini (saat proses login)
revoke all on function public.get_email_for_username(text) from public;
grant execute on function public.get_email_for_username(text) to anon, authenticated;

-- ============================================================
-- BAGIAN 2 — SEED DATA BUMD & BLUD ASLI KOTA BATU
-- ============================================================
-- UUID ditulis eksplisit (bukan gen_random_uuid()) supaya ID ini
-- stabil dan bisa dirujuk konsisten saat membuat akun admin_bumd/
-- admin_blud di Bagian 3 skrip lain (lihat DAFTAR_AKUN_DAN_ROLE.md).

insert into public.bumd (id, nama, jenis_usaha, status) values
  ('a0000000-0000-0000-0000-000000000001', 'Perumdam Among Tirto', 'Air Minum', 'aktif'),
  ('a0000000-0000-0000-0000-000000000002', 'PT. Batu Wisata Resource', 'Pariwisata', 'aktif')
on conflict (id) do update set nama = excluded.nama, jenis_usaha = excluded.jenis_usaha;

insert into public.blud (id, nama, jenis_layanan, status) values
  ('b0000000-0000-0000-0000-000000000001', 'PKM Batu', 'Puskesmas', 'aktif'),
  ('b0000000-0000-0000-0000-000000000002', 'PKM Beji', 'Puskesmas', 'aktif'),
  ('b0000000-0000-0000-0000-000000000003', 'PKM Bumiaji', 'Puskesmas', 'aktif'),
  ('b0000000-0000-0000-0000-000000000004', 'PKM Junrejo', 'Puskesmas', 'aktif'),
  ('b0000000-0000-0000-0000-000000000005', 'PKM Sisir', 'Puskesmas', 'aktif')
on conflict (id) do update set nama = excluded.nama, jenis_layanan = excluded.jenis_layanan;

-- ============================================================
-- BAGIAN 3 — TRIGGER handle_new_user DIPERBARUI (opsional, untuk akun
-- yang dibuat via API/Admin di masa depan dengan metadata username)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nama_lengkap, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama_lengkap', 'Pengguna Baru'),
    new.raw_user_meta_data->>'username',
    'peserta'
  );
  return new;
end;
$$;
-- (trigger trg_handle_new_user yang sudah ada otomatis memakai versi
-- fungsi terbaru ini, tidak perlu drop/create ulang triggernya)

-- ============================================================
-- BAGIAN 4 — CONTOH: MENGISI USERNAME UNTUK AKUN YANG SUDAH DIBUAT
-- ============================================================
-- Anda menyebut sudah membuat akun di Authentication (artinya baris
-- auth.users + profiles otomatis sudah ada lewat trigger). Langkah
-- berikutnya: isi kolom username dan role untuk tiap akun tersebut.
-- GANTI '<uuid-user-1>' dengan UUID asli dari Dashboard Authentication.
--
-- update public.profiles set username = 'admin.bumd.amongtirto', role = 'admin_bumd',
--   entity_type = 'bumd', entity_id = 'a0000000-0000-0000-0000-000000000001'
--   where id = '<uuid-user-1>';
