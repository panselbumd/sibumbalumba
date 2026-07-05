-- ============================================================
-- PATCH 2 — Penilaian Independen 5 Tim UKK + Rekap Hasil Final
-- SIBUMBALUMBA
-- Jalankan SETELAH Tahap12_v2.sql dan Patch_Username_dan_SeedData.sql
-- ============================================================
-- Perubahan model bisnis: awalnya nilai_ukk didesain 1 nilai per
-- peserta per tahap (unique peserta_id+tahap). Ternyata proses nyata
-- melibatkan 5 anggota Tim UKK yang MENILAI SECARA MANDIRI/INDEPENDEN
-- setiap peserta di semua tahap (psikotes, tes tulis, wawancara,
-- presentasi), lalu kelima nilai itu DIREKAP (dirata-rata) untuk
-- menetapkan Hasil UKK final. Ini beda arsitektur, bukan sekadar
-- tambahan kolom.

-- ============================================================
-- BAGIAN 1 — UBAH CONSTRAINT nilai_ukk: izinkan 5 baris per
-- peserta+tahap (satu per tim_ukk_id), bukan cuma 1 baris.
-- ============================================================
alter table public.nilai_ukk drop constraint if exists nilai_ukk_peserta_id_tahap_key;
alter table public.nilai_ukk drop constraint if exists nilai_ukk_peserta_tahap_penilai_key;
alter table public.nilai_ukk
  add constraint nilai_ukk_peserta_tahap_penilai_key
  unique (peserta_id, tahap, tim_ukk_id);

-- ============================================================
-- BAGIAN 2 — TABEL HASIL FINAL (hasil rekap resmi, terkunci)
-- ============================================================
-- Ini tabel BARU, terpisah dari nilai_ukk mentah — mengikuti prinsip
-- yang sama dengan v_status_penilaian_ukk: panitia_seleksi BOLEH
-- melihat hasil FINAL yang sudah direkap (karena itu memang produk
-- resmi yang harus mereka terima untuk membuat Berita Acara), tapi
-- TETAP TIDAK PERNAH melihat 5 nilai mentah individual di nilai_ukk
-- (FR-17a tidak berubah).
create table if not exists public.hasil_ukk_final (
  id uuid primary key default gen_random_uuid(),
  peserta_id uuid not null references public.peserta_seleksi(id) on delete cascade,
  tahap tahap_penilaian not null,
  skor_rata_rata numeric not null,
  jumlah_penilai int not null,
  ditetapkan_at timestamptz not null default now(),
  unique (peserta_id, tahap)
);
alter table public.hasil_ukk_final enable row level security;

drop policy if exists "hasil_ukk_final_select_internal" on public.hasil_ukk_final;
create policy "hasil_ukk_final_select_internal"
  on public.hasil_ukk_final for select
  using (
    public.current_role() in ('super_admin','admin_bpsda','panitia_seleksi','tim_ukk')
    or exists (
      select 1 from public.peserta_seleksi ps
      where ps.id = hasil_ukk_final.peserta_id and ps.user_id = auth.uid()
    )
  );
-- SENGAJA TIDAK ADA POLICY INSERT/UPDATE/DELETE UNTUK ROLE MANAPUN —
-- satu-satunya cara baris ini terisi adalah lewat trigger di Bagian 3
-- (SECURITY DEFINER, jalan sebagai pemilik tabel, otomatis bypass RLS).
-- Ini mencegah SIAPA PUN — termasuk tim_ukk atau super_admin lewat
-- client biasa — "menetapkan" hasil final secara manual/curang.

-- ============================================================
-- BAGIAN 3 — TRIGGER: begitu 5 penilai submit is_final untuk
-- peserta+tahap yang sama, otomatis hitung rata-rata dan kunci.
-- ============================================================
-- JUMLAH_PENILAI_DIHARAPKAN = 5 sesuai struktur Tim UKK Anda saat ini.
-- Kalau jumlah anggota Tim UKK berubah di masa depan, angka ini
-- HARUS diubah di sini (idealnya dipindah ke tabel konfigurasi seperti
-- konfigurasi_bobot — dicatat sebagai perbaikan lanjutan, bukan
-- dikerjakan sekarang supaya tidak memperbesar scope patch ini).
create or replace function public.cek_dan_finalisasi_hasil_ukk()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jumlah_penilai constant int := 5;
  v_count int;
  v_rata_rata numeric;
begin
  if new.is_final = true then
    select count(distinct tim_ukk_id), avg(skor)
      into v_count, v_rata_rata
      from public.nilai_ukk
      where peserta_id = new.peserta_id
        and tahap = new.tahap
        and is_final = true;

    if v_count >= v_jumlah_penilai then
      insert into public.hasil_ukk_final (peserta_id, tahap, skor_rata_rata, jumlah_penilai)
      values (new.peserta_id, new.tahap, round(v_rata_rata, 2), v_count)
      on conflict (peserta_id, tahap) do nothing;
      -- do nothing (bukan do update): hasil final yang sudah tercatat
      -- TIDAK PERNAH ditimpa otomatis, meski ada penilaian susulan
      -- aneh (mis. duplikat tim_ukk_id yang seharusnya tidak mungkin
      -- karena unique constraint Bagian 1). Perubahan hasil final
      -- yang sudah terbentuk harus lewat proses koreksi eksplisit,
      -- bukan trigger diam-diam.
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_finalisasi_hasil_ukk
  after insert or update on public.nilai_ukk
  for each row execute function public.cek_dan_finalisasi_hasil_ukk();

-- ============================================================
-- BAGIAN 4 — VIEW PROGRES REKAP (untuk panitia: "3 dari 5 penilai
-- sudah submit", tanpa lihat skor individual)
-- ============================================================
create or replace view public.v_progres_penilaian_ukk as
  select
    peserta_id,
    tahap,
    count(distinct tim_ukk_id) filter (where is_final) as penilai_sudah_submit,
    5 as penilai_diharapkan
  from public.nilai_ukk
  group by peserta_id, tahap;
-- Sama seperti v_status_penilaian_ukk sebelumnya: SENGAJA tidak
-- security_invoker=true, karena ini jalur resmi panitia melihat
-- progres tanpa RLS nilai_ukk menghalangi (lihat penjelasan di
-- Tahap12_Catatan_Revisi_v1_ke_v2.md).
