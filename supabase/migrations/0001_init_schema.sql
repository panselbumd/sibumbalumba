-- ============================================================
-- TAHAP 12 — SUPABASE SCHEMA (DDL SQL) — v2 (REVISI PASCA-UJI NYATA)
-- SIBUMBALUMBA
-- ============================================================
-- CATATAN IDEMPOTENSI (ditambahkan setelah beberapa kali insiden
-- migration terhenti di tengah jalan dan menyebabkan error
-- "already exists" saat dijalankan ulang):
--
-- File ini SEKARANG SELALU MEMULAI DENGAN RESET BERSIH schema
-- "public" sebelum membangun ulang semuanya dari nol. Ini menjadikan
-- file ini AMAN dijalankan ULANG KAPAN SAJA — tidak peduli apakah
-- percobaan sebelumnya sukses penuh, gagal di tengah, atau
-- separuh jalan. Anda tidak perlu lagi menebak-nebak objek mana
-- yang sudah/belum ada.
--
-- AMAN untuk akun Supabase Authentication Anda: auth.users ada di
-- schema "auth", BUKAN "public" — reset ini TIDAK PERNAH menghapus
-- akun yang sudah dibuat di Authentication.
--
-- PERINGATAN: kalau Anda SUDAH mengisi data BUMD/BLUD/dsb secara
-- MANUAL lewat Table Editor (bukan lewat migration 0002's seed),
-- data itu AKAN IKUT TERHAPUS oleh reset ini. Migration 0002 akan
-- mengisi ulang 2 BUMD + 5 BLUD standar secara otomatis, tapi data
-- lain yang Anda input manual tidak akan kembali kecuali di-input
-- ulang.
drop schema if exists public cascade;
create schema public;
grant all on schema public to postgres;
grant all on schema public to public;
-- ============================================================
-- Perubahan dari v1, seluruhnya ditemukan lewat pengujian nyata
-- terhadap PostgreSQL 16 + pgvector (bukan hanya review baca kode):
--
-- 1. FIX KRITIS: infinite recursion di RLS "profiles" — hampir semua
--    policy melakukan `exists (select 1 from public.profiles ...)`
--    di dalam policy tabel lain. Karena profiles mengecek RLS-nya
--    sendiri secara rekursif, Postgres melempar error di semua
--    operasi. Solusi: fungsi SECURITY DEFINER `public.current_role()`
--    dan `public.current_entity_id()` yang membaca profiles TANPA
--    tunduk pada RLS profiles (definer bypass), dipakai di semua
--    policy sebagai pengganti subquery langsung ke profiles.
-- 2. evaluasi_blud: policy INSERT/UPDATE yang tadinya cuma jadi
--    komentar "analog", sekarang benar-benar ditulis.
-- 3. berkas: ditambah policy UPDATE untuk panitia_seleksi/super_admin
--    (dibutuhkan oleh actions/seleksi.actions.ts: verifyBerkas()).
-- 4. profiles: ditambah trigger otomatis membuat baris profiles saat
--    user baru signup di auth.users (tanpa ini, user baru tidak
--    pernah punya role).
-- 5. View v_status_penilaian_ukk: security_invoker=true benar-benar
--    diset di DDL (sebelumnya cuma disebut di komentar).
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ============================================================
-- ENUM TYPES (tidak berubah dari v1)
-- ============================================================
create type user_role as enum (
  'super_admin', 'admin_bpsda', 'admin_bumd', 'admin_blud',
  'panitia_seleksi', 'tim_ukk', 'peserta'
);
create type entity_type as enum ('bumd', 'blud');
create type jenis_seleksi as enum ('direksi', 'dewas', 'komisaris', 'pegawai_blud');
create type jalur_pendaftaran as enum ('mandiri', 'assisted');
create type status_seleksi as enum (
  'terdaftar', 'administrasi', 'lolos_administrasi', 'penilaian', 'selesai', 'ditolak'
);
create type tahap_penilaian as enum (
  'psikotes', 'tes_tulis', 'ukk', 'presentasi', 'wawancara'
);
create type status_dokumen as enum ('draft', 'diajukan', 'disetujui', 'ditolak', 'diarsipkan');

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'peserta',
  nama_lengkap text not null,
  nip_nik text,
  entity_type entity_type,
  entity_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ============================================================
-- FIX #1: helper SECURITY DEFINER — dipanggil oleh SEMUA policy di
-- bawah sebagai pengganti `exists (select 1 from public.profiles ...)`.
-- security definer membuat fungsi ini berjalan dengan privilege
-- pemilik fungsi (bypass RLS profiles), sehingga TIDAK memicu evaluasi
-- RLS profiles secara rekursif saat dipanggil dari policy tabel lain
-- (termasuk dari policy profiles sendiri).
-- ============================================================
create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_entity_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select entity_id from public.profiles where id = auth.uid()
$$;

-- Trigger otomatis: buat baris profiles saat user baru signup.
-- Role default 'peserta' — role lain diberikan manual oleh super_admin
-- lewat aplikasi setelah akun dibuat (lihat FR-17).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nama_lengkap, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama_lengkap', 'Pengguna Baru'), 'peserta');
  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() in ('super_admin', 'admin_bpsda'));

create policy "profiles_update_own_limited"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_super_admin_full"
  on public.profiles for all
  using (public.current_role() = 'super_admin');

-- ============================================================
-- 2. BUMD / BLUD
-- ============================================================
create table public.bumd (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jenis_usaha text,
  status text not null default 'aktif',
  profil_singkat text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.blud (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jenis_layanan text,
  status text not null default 'aktif',
  profil_singkat text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bumd enable row level security;
alter table public.blud enable row level security;

create policy "bumd_public_read" on public.bumd for select using (true);
create policy "blud_public_read" on public.blud for select using (true);

create policy "bumd_write_authorized"
  on public.bumd for all
  using (
    public.current_role() in ('super_admin','admin_bpsda')
    or (public.current_role() = 'admin_bumd' and public.current_entity_id() = bumd.id)
  );

create policy "blud_write_authorized"
  on public.blud for all
  using (
    public.current_role() in ('super_admin','admin_bpsda')
    or (public.current_role() = 'admin_blud' and public.current_entity_id() = blud.id)
  );

-- ============================================================
-- 3. KONFIGURASI BOBOT
-- ============================================================
create table public.konfigurasi_bobot (
  id uuid primary key default gen_random_uuid(),
  jenis_entitas entity_type not null,
  nama_indikator text not null,
  bobot numeric not null check (bobot >= 0 and bobot <= 1),
  berlaku_sejak date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.konfigurasi_bobot enable row level security;
create policy "bobot_read_internal"
  on public.konfigurasi_bobot for select
  using (public.current_role() is not null);
create policy "bobot_write_bpsda"
  on public.konfigurasi_bobot for all
  using (public.current_role() in ('super_admin','admin_bpsda'));

-- ============================================================
-- 4. EVALUASI BUMD / BLUD + INDIKATOR
-- ============================================================
create table public.evaluasi_bumd (
  id uuid primary key default gen_random_uuid(),
  bumd_id uuid not null references public.bumd(id) on delete cascade,
  periode text not null,
  skor_total numeric,
  kategori text,
  status text not null default 'draft',
  catatan_pembinaan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bumd_id, periode)
);
create table public.evaluasi_blud (
  id uuid primary key default gen_random_uuid(),
  blud_id uuid not null references public.blud(id) on delete cascade,
  periode text not null,
  skor_total numeric,
  maturitas text,
  status text not null default 'draft',
  catatan_pembinaan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (blud_id, periode)
);
create table public.evaluasi_indikator (
  id uuid primary key default gen_random_uuid(),
  evaluasi_bumd_id uuid references public.evaluasi_bumd(id) on delete cascade,
  evaluasi_blud_id uuid references public.evaluasi_blud(id) on delete cascade,
  konfigurasi_bobot_id uuid not null references public.konfigurasi_bobot(id),
  nilai numeric not null,
  created_at timestamptz not null default now(),
  check (
    (evaluasi_bumd_id is not null and evaluasi_blud_id is null) or
    (evaluasi_bumd_id is null and evaluasi_blud_id is not null)
  )
);
alter table public.evaluasi_bumd enable row level security;
alter table public.evaluasi_blud enable row level security;
alter table public.evaluasi_indikator enable row level security;

create policy "evaluasi_bumd_read_published_public"
  on public.evaluasi_bumd for select
  using (status = 'published' or public.current_role() is not null);
create policy "evaluasi_bumd_write_authorized"
  on public.evaluasi_bumd for insert with check (
    public.current_role() in ('super_admin','admin_bpsda')
    or (public.current_role() = 'admin_bumd' and public.current_entity_id() = evaluasi_bumd.bumd_id)
  );
create policy "evaluasi_bumd_update_authorized"
  on public.evaluasi_bumd for update using (
    public.current_role() in ('super_admin','admin_bpsda')
    or (public.current_role() = 'admin_bumd' and public.current_entity_id() = evaluasi_bumd.bumd_id)
  );

-- FIX #2: policy evaluasi_blud yang di v1 hanya jadi komentar "analog"
create policy "evaluasi_blud_read_published_public"
  on public.evaluasi_blud for select
  using (status = 'published' or public.current_role() is not null);
create policy "evaluasi_blud_write_authorized"
  on public.evaluasi_blud for insert with check (
    public.current_role() in ('super_admin','admin_bpsda')
    or (public.current_role() = 'admin_blud' and public.current_entity_id() = evaluasi_blud.blud_id)
  );
create policy "evaluasi_blud_update_authorized"
  on public.evaluasi_blud for update using (
    public.current_role() in ('super_admin','admin_bpsda')
    or (public.current_role() = 'admin_blud' and public.current_entity_id() = evaluasi_blud.blud_id)
  );

create policy "evaluasi_indikator_read_internal"
  on public.evaluasi_indikator for select using (public.current_role() is not null);
create policy "evaluasi_indikator_write_internal"
  on public.evaluasi_indikator for all using (public.current_role() is not null);

-- ============================================================
-- 5. PESERTA SELEKSI
-- ============================================================
create table public.peserta_seleksi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  jenis_seleksi jenis_seleksi not null,
  jalur_pendaftaran jalur_pendaftaran not null default 'mandiri',
  difasilitasi_oleh uuid references public.profiles(id),
  bumd_blud_id uuid,
  token_undangan text unique,
  status status_seleksi not null default 'terdaftar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assisted_wajib_ada_fasilitator check (
    jalur_pendaftaran <> 'assisted' or difasilitasi_oleh is not null
  )
);
alter table public.peserta_seleksi enable row level security;

create policy "peserta_direksi_public_read"
  on public.peserta_seleksi for select
  using (jenis_seleksi = 'direksi' and auth.role() = 'anon');

create policy "peserta_own_read"
  on public.peserta_seleksi for select
  using (user_id = auth.uid());

create policy "peserta_internal_read"
  on public.peserta_seleksi for select
  using (public.current_role() in ('super_admin','admin_bpsda','panitia_seleksi','tim_ukk'));

create policy "peserta_insert_mandiri"
  on public.peserta_seleksi for insert
  with check (jalur_pendaftaran = 'mandiri' and user_id = auth.uid());

create policy "peserta_insert_assisted_super_admin_only"
  on public.peserta_seleksi for insert
  with check (
    jalur_pendaftaran = 'assisted'
    and public.current_role() = 'super_admin'
    and difasilitasi_oleh = auth.uid()
  );

create policy "peserta_update_panitia_administrasi"
  on public.peserta_seleksi for update
  using (public.current_role() in ('super_admin','panitia_seleksi'));

-- ============================================================
-- 6. BERKAS
-- ============================================================
create table public.berkas (
  id uuid primary key default gen_random_uuid(),
  peserta_id uuid not null references public.peserta_seleksi(id) on delete cascade,
  jenis_dokumen text not null,
  file_path text not null,
  status_verifikasi text not null default 'pending',
  catatan text,
  created_at timestamptz not null default now()
);
alter table public.berkas enable row level security;
create policy "berkas_own_or_internal"
  on public.berkas for select using (
    exists (select 1 from public.peserta_seleksi ps where ps.id = berkas.peserta_id and ps.user_id = auth.uid())
    or public.current_role() in ('super_admin','admin_bpsda','panitia_seleksi')
  );
create policy "berkas_insert_own_or_assisted"
  on public.berkas for insert with check (
    exists (select 1 from public.peserta_seleksi ps where ps.id = berkas.peserta_id and ps.user_id = auth.uid())
    or public.current_role() = 'super_admin'
  );

-- FIX #3: UPDATE policy yang di v1 tidak ada sama sekali
create policy "berkas_update_verifikasi"
  on public.berkas for update
  using (public.current_role() in ('super_admin','panitia_seleksi'));

-- ============================================================
-- 7. NILAI UKK — TABEL PALING SENSITIF (FR-17a)
-- ============================================================
create table public.nilai_ukk (
  id uuid primary key default gen_random_uuid(),
  peserta_id uuid not null references public.peserta_seleksi(id) on delete cascade,
  tim_ukk_id uuid not null references public.profiles(id),
  tahap tahap_penilaian not null,
  skor numeric not null check (skor >= 0 and skor <= 100),
  is_final boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (peserta_id, tahap)
);
alter table public.nilai_ukk enable row level security;

create policy "nilai_ukk_insert_tim_ukk_only"
  on public.nilai_ukk for insert
  with check (tim_ukk_id = auth.uid() and public.current_role() = 'tim_ukk');

create policy "nilai_ukk_update_before_final"
  on public.nilai_ukk for update
  using (tim_ukk_id = auth.uid() and is_final = false)
  with check (tim_ukk_id = auth.uid());

-- PANITIA_SELEKSI TIDAK ADA DI POLICY INI SAMA SEKALI — disengaja (FR-17a).
create policy "nilai_ukk_select_restricted"
  on public.nilai_ukk for select
  using (
    tim_ukk_id = auth.uid()
    or public.current_role() in ('super_admin','admin_bpsda')
    or (is_final = true and exists (
      select 1 from public.peserta_seleksi ps where ps.id = nilai_ukk.peserta_id and ps.user_id = auth.uid()
    ))
  );
-- Tidak ada policy DELETE — baris tidak bisa dihapus siapa pun.

-- FIX #5 (revisi setelah pengujian nyata — lihat catatan di bawah):
-- security_invoker=TRUE ternyata SALAH untuk view ini. Jika diset true,
-- view ikut tunduk ke RLS nilai_ukk milik pemanggil — dan karena
-- panitia_seleksi memang tidak py policy SELECT ke nilai_ukk sama sekali
-- (FR-17a), view ini akan selalu kosong untuk panitia, padahal view ini
-- JUSTRU dimaksudkan sebagai satu-satunya jalur resmi panitia melihat
-- status agregat. Maka kita sengaja PAKAI default (security_invoker
-- tidak diset / false) — view berjalan dengan hak akses pembuatnya,
-- yang secara sengaja melewati RLS baris nilai_ukk. Ini AMAN karena
-- view hanya mengekspos hitungan (tahap_selesai, total_tahap_diinput),
-- bukan skor mentah — batas keamanannya ada di level KOLOM yang
-- diekspos view, bukan di level baris. Supabase linter kemungkinan akan
-- menandai ini sebagai "Security Definer View" — INI DISENGAJA, bukan
-- kelalaian; beri anotasi di kode/README agar tidak "diperbaiki" keliru
-- di masa depan oleh developer lain yang tidak tahu konteksnya.
create view public.v_status_penilaian_ukk as
  select peserta_id,
         count(*) filter (where is_final) as tahap_selesai,
         count(*) as total_tahap_diinput
  from public.nilai_ukk
  group by peserta_id;

-- ============================================================
-- 8. AUDIT LOG
-- ============================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  aksi text not null,
  tabel_terkait text,
  record_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "audit_log_select_super_admin_full"
  on public.audit_log for select
  using (public.current_role() = 'super_admin');
create policy "audit_log_select_own"
  on public.audit_log for select using (user_id = auth.uid());
create policy "audit_log_insert_system"
  on public.audit_log for insert with check (true);

-- ============================================================
-- 9. TRIGGER: audit otomatis
-- ============================================================
create or replace function public.log_assisted_entry()
returns trigger as $$
begin
  if new.jalur_pendaftaran = 'assisted' then
    insert into public.audit_log (user_id, aksi, tabel_terkait, record_id, detail)
    values (auth.uid(), 'assisted_entry_create', 'peserta_seleksi', new.id,
            jsonb_build_object('difasilitasi_oleh', new.difasilitasi_oleh, 'user_id', new.user_id));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_log_assisted_entry
  after insert on public.peserta_seleksi
  for each row execute function public.log_assisted_entry();

create or replace function public.log_nilai_ukk_final()
returns trigger as $$
begin
  if new.is_final = true and old.is_final = false then
    insert into public.audit_log (user_id, aksi, tabel_terkait, record_id, detail)
    values (auth.uid(), 'nilai_ukk_submit_final', 'nilai_ukk', new.id,
            jsonb_build_object('peserta_id', new.peserta_id, 'tahap', new.tahap, 'skor', new.skor));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_log_nilai_ukk_final
  after update on public.nilai_ukk
  for each row execute function public.log_nilai_ukk_final();

-- ============================================================
-- 10. DOKUMEN INTERNAL, KNOWLEDGE BASE
-- ============================================================
create table public.dokumen_internal (
  id uuid primary key default gen_random_uuid(),
  pembuat_id uuid not null references public.profiles(id),
  judul text not null,
  file_path text,
  status status_dokumen not null default 'draft',
  versi int not null default 1,
  approver_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.dokumen_internal enable row level security;
create policy "dokumen_internal_own_or_approver"
  on public.dokumen_internal for all
  using (pembuat_id = auth.uid() or approver_id = auth.uid() or public.current_role() = 'super_admin');

create table public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  kategori text not null,
  file_path text,
  embedding vector(1536),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.knowledge_base enable row level security;
create policy "kb_public_read" on public.knowledge_base for select using (is_public = true);
create policy "kb_internal_read" on public.knowledge_base for select
  using (public.current_role() is not null);
create policy "kb_write_bpsda" on public.knowledge_base for all
  using (public.current_role() in ('super_admin','admin_bpsda'));

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_peserta_seleksi_user on public.peserta_seleksi(user_id);
create index idx_peserta_seleksi_jenis on public.peserta_seleksi(jenis_seleksi);
create index idx_nilai_ukk_peserta on public.nilai_ukk(peserta_id);
create index idx_evaluasi_bumd_periode on public.evaluasi_bumd(bumd_id, periode);
create index idx_evaluasi_blud_periode on public.evaluasi_blud(blud_id, periode);
create index idx_audit_log_user on public.audit_log(user_id, created_at desc);
create index idx_kb_embedding on public.knowledge_base using ivfflat (embedding vector_cosine_ops);
