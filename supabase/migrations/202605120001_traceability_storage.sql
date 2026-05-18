create extension if not exists pgcrypto with schema extensions;

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  password text not null,
  role text not null default 'operator',
  created_at timestamptz not null default now()
);

create table if not exists public.batches (
  id uuid primary key,
  batch_code text not null unique,
  tea_type text not null,
  garden_block text,
  harvest_date text,
  notes text,
  workflow_mode text not null default 'dynamic-multi-path',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  created_by text,
  trace jsonb not null default '{}'::jsonb,
  stages jsonb not null default '[]'::jsonb
);

create table if not exists public.batch_history (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.batches(id) on delete cascade,
  batch_code text not null,
  stage_name text,
  event_type text not null,
  action text not null,
  status text not null default 'pending_external',
  operator text,
  reason text,
  payload jsonb,
  data jsonb,
  ipfs_cid text,
  ipfs_url text,
  ipfs_name text,
  tx_hash text,
  tx_url text,
  network text,
  chain_id integer,
  contract_address text,
  mock jsonb,
  error_message text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists batches_created_at_idx on public.batches (created_at desc);
create index if not exists batch_history_batch_id_idx on public.batch_history (batch_id);
create index if not exists batch_history_recorded_at_idx on public.batch_history (recorded_at);

alter table public.users enable row level security;
alter table public.batches enable row level security;
alter table public.batch_history enable row level security;

drop policy if exists "anon can read users for app login" on public.users;
drop policy if exists "anon can insert users for app seed import" on public.users;
drop policy if exists "anon can update users for app seed import" on public.users;
drop policy if exists "anon can read batches" on public.batches;
drop policy if exists "anon can insert batches" on public.batches;
drop policy if exists "anon can update batches" on public.batches;
drop policy if exists "anon can read batch history" on public.batch_history;
drop policy if exists "anon can insert batch history" on public.batch_history;
drop policy if exists "anon can update batch history" on public.batch_history;

create policy "anon can read users for app login"
on public.users for select
to anon
using (true);

create policy "anon can insert users for app seed import"
on public.users for insert
to anon
with check (true);

create policy "anon can update users for app seed import"
on public.users for update
to anon
using (true)
with check (true);

create policy "anon can read batches"
on public.batches for select
to anon
using (true);

create policy "anon can insert batches"
on public.batches for insert
to anon
with check (true);

create policy "anon can update batches"
on public.batches for update
to anon
using (true)
with check (true);

create policy "anon can read batch history"
on public.batch_history for select
to anon
using (true);

create policy "anon can insert batch history"
on public.batch_history for insert
to anon
with check (true);

create policy "anon can update batch history"
on public.batch_history for update
to anon
using (true)
with check (true);

insert into public.users (id, name, email, password, role)
values ('u-001', 'Admin Tea Factory', 'admin@teh.local', 'admin123', 'admin')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  password = excluded.password,
  role = excluded.role;
