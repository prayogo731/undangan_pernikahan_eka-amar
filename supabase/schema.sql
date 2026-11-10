-- =====================================================================
--  UNDANGAN PERNIKAHAN EKA OKTAVIA & AMAR JULIANSYAH
--  Skema database Supabase (PostgreSQL)
--
--  Cara pakai: Supabase Dashboard -> SQL Editor -> New query
--  -> tempel seluruh isi file ini -> klik RUN (cukup sekali).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

-- Konfirmasi kehadiran (RSVP)
create table if not exists public.rsvp (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  guests      smallint    not null default 1,
  status      text        not null,
  message     text,
  created_at  timestamptz not null default now(),

  constraint rsvp_name_len   check (char_length(btrim(name)) between 2 and 60),
  constraint rsvp_name_safe  check (name !~ '[<>]'),
  constraint rsvp_status     check (status in ('hadir', 'tidak_hadir')),
  -- hadir: 1-10 orang, tidak hadir: 0 orang
  constraint rsvp_guests     check (
    (status = 'hadir' and guests between 1 and 10)
    or (status = 'tidak_hadir' and guests = 0)
  ),
  constraint rsvp_msg_len    check (message is null or char_length(message) <= 500),
  constraint rsvp_msg_safe   check (message is null or message !~ '[<>]')
);

-- Satu nama hanya boleh mengonfirmasi satu kali (tidak peka huruf besar/kecil)
create unique index if not exists rsvp_name_unique
  on public.rsvp (lower(btrim(name)));

create index if not exists rsvp_created_idx on public.rsvp (created_at desc);


-- Ucapan & doa
create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  message     text        not null,
  created_at  timestamptz not null default now(),

  constraint wishes_name_len  check (char_length(btrim(name)) between 2 and 60),
  constraint wishes_name_safe check (name !~ '[<>]'),
  constraint wishes_msg_len   check (char_length(btrim(message)) between 3 and 500),
  constraint wishes_msg_safe  check (message !~ '[<>]')
);

create index if not exists wishes_created_idx on public.wishes (created_at desc);


-- ---------------------------------------------------------------------
-- 2. ANTI-SPAM: batasi jumlah data masuk per menit (seluruh pengunjung)
--    Jika lebih dari 15 data dalam 1 menit, data baru ditolak sementara.
-- ---------------------------------------------------------------------
create or replace function public.limit_insert_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  execute format(
    'select count(*) from public.%I where created_at > now() - interval ''1 minute''',
    tg_table_name
  ) into recent;

  if recent >= 15 then
    raise exception 'Terlalu banyak permintaan, coba lagi sebentar.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists rsvp_rate_limit on public.rsvp;
create trigger rsvp_rate_limit
  before insert on public.rsvp
  for each row execute function public.limit_insert_rate();

drop trigger if exists wishes_rate_limit on public.wishes;
create trigger wishes_rate_limit
  before insert on public.wishes
  for each row execute function public.limit_insert_rate();


-- ---------------------------------------------------------------------
-- 3. KEAMANAN (Row Level Security)
--    Pengunjung (anon) HANYA boleh: membaca dan menambah data.
--    Mengubah / menghapus data hanya bisa lewat Dashboard Supabase.
-- ---------------------------------------------------------------------
alter table public.rsvp   enable row level security;
alter table public.wishes enable row level security;

drop policy if exists "rsvp dapat dibaca semua"    on public.rsvp;
drop policy if exists "rsvp dapat ditambah semua"  on public.rsvp;
drop policy if exists "wishes dapat dibaca semua"   on public.wishes;
drop policy if exists "wishes dapat ditambah semua" on public.wishes;

create policy "rsvp dapat dibaca semua"
  on public.rsvp for select to anon, authenticated using (true);

create policy "rsvp dapat ditambah semua"
  on public.rsvp for insert to anon, authenticated with check (true);

create policy "wishes dapat dibaca semua"
  on public.wishes for select to anon, authenticated using (true);

create policy "wishes dapat ditambah semua"
  on public.wishes for insert to anon, authenticated with check (true);

-- Cabut hak ubah/hapus dari pengunjung (lapisan pengaman tambahan)
revoke update, delete, truncate on public.rsvp   from anon, authenticated;
revoke update, delete, truncate on public.wishes from anon, authenticated;


-- ---------------------------------------------------------------------
-- 4. REALTIME: daftar tamu & ucapan diperbarui otomatis
--    (Jika muncul pesan "already member of publication", abaikan saja.)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.rsvp;
alter publication supabase_realtime add table public.wishes;
