-- =====================================================================
-- PR PET - Schema completo do Supabase com RLS (Multi-tenancy)
-- =====================================================================
-- Execute este arquivo no SQL Editor do Supabase
-- Project Settings -> SQL Editor -> New query
-- =====================================================================

-- ============ 1. TABELAS ============

create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  asaas_customer_id text,
  asaas_subscription_id text,
  subscription_status text default 'TRIAL',
  payment_link text,
  created_at timestamptz default now()
);

alter table public.establishments
  alter column subscription_status set default 'TRIAL';

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  cpf_cnpj text,
  business_id uuid references public.establishments(id) on delete cascade,
  role text default 'admin' check (role in ('admin','user')),
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  created_at timestamptz default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.establishments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  breed text,
  created_at timestamptz default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  barcode text,
  stock integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.establishments(id) on delete cascade,
  client_id uuid not null references public.clients(id),
  pet_id uuid not null references public.pets(id),
  service_id uuid not null references public.services(id),
  scheduled_at timestamptz not null,
  status text default 'scheduled',
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.establishments(id) on delete cascade,
  operator_id uuid references auth.users(id),
  client_id uuid references public.clients(id),
  total numeric(10,2) not null,
  payment_method text not null,
  status text default 'paid',
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.establishments(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id),
  service_id uuid references public.services(id),
  name text,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  total numeric(10,2) not null,
  created_at timestamptz default now()
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.establishments(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric(10,2) not null,
  payment_method text,
  description text,
  sale_id uuid references public.sales(id),
  created_at timestamptz default now()
);

-- ============ 2. INDICES ============
create index if not exists idx_clients_business on public.clients(business_id);
create index if not exists idx_pets_business on public.pets(business_id);
create index if not exists idx_appointments_business on public.appointments(business_id, scheduled_at);
create index if not exists idx_sales_business on public.sales(business_id, created_at);
create index if not exists idx_tx_business on public.financial_transactions(business_id, created_at);

-- ============ 3. TRIGGER: criar establishment + profile no signup ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_business_id uuid;
  v_role text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'admin');

  if v_role = 'admin' then
    insert into public.establishments (name, owner_id, subscription_status)
    values (coalesce(new.raw_user_meta_data->>'business_name', 'Meu Petshop'), new.id, 'TRIAL')
    returning id into new_business_id;
  else
    new_business_id := (new.raw_user_meta_data->>'business_id')::uuid;
  end if;

  insert into public.profiles (id, email, full_name, phone, cpf_cnpj, business_id, role)
  values (
    new.id, new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf_cnpj',
    new_business_id,
    v_role
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ 4. RLS ============
alter table public.establishments enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.pets enable row level security;
alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.appointments enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.financial_transactions enable row level security;

-- Helper function: pega business_id do usuário logado
create or replace function public.current_business_id()
returns uuid language sql stable security definer as $$
  select business_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Establishments: dono vê o próprio
drop policy if exists est_select on public.establishments;
create policy est_select on public.establishments for select using (id = public.current_business_id());
drop policy if exists est_update on public.establishments;
create policy est_update on public.establishments for update using (id = public.current_business_id() and public.current_role() = 'admin');

-- Profiles: usuário vê os do mesmo negócio
drop policy if exists prof_select on public.profiles;
create policy prof_select on public.profiles for select using (business_id = public.current_business_id() or id = auth.uid());
drop policy if exists prof_insert on public.profiles;
create policy prof_insert on public.profiles for insert with check (id = auth.uid() or public.current_role() = 'admin');
drop policy if exists prof_update on public.profiles;
create policy prof_update on public.profiles for update using (id = auth.uid() or public.current_role() = 'admin');

-- Macro para tabelas de negócio
do $$
declare t text;
begin
  for t in select unnest(array['clients','pets','services','products','appointments','sales','sale_items','financial_transactions']) loop
    execute format('drop policy if exists %I_all on public.%I', t, t);
    execute format('create policy %I_all on public.%I for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id())', t, t);
  end loop;
end $$;

-- Funcionários não veem fechamento financeiro (financial_transactions)
drop policy if exists tx_select_admin on public.financial_transactions;
create policy tx_select_admin on public.financial_transactions for select using (
  business_id = public.current_business_id() and public.current_role() = 'admin'
);
-- recriamos a policy para 'all' apenas para admin
drop policy if exists financial_transactions_all on public.financial_transactions;
create policy financial_transactions_admin on public.financial_transactions for all
  using (business_id = public.current_business_id() and public.current_role() = 'admin')
  with check (business_id = public.current_business_id());
-- Operador pode inserir entrada quando faz uma venda
create policy financial_transactions_insert_user on public.financial_transactions for insert
  with check (business_id = public.current_business_id() and type = 'income');

-- ============ FIM ============
