-- LOTAGENT isolated tables (la_*). Do not alter LOTPILOT lp_* tables.

create or replace function public.la_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.la_dealerships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  currency text not null default 'USD',
  tax_rate numeric(8, 4) not null default 0,
  default_destination_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  dealership_id uuid references public.la_dealerships (id) on delete set null,
  full_name text,
  email text,
  role text not null default 'buyer' check (role in ('buyer', 'manager', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_dealership_members (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  user_id uuid not null references public.la_profiles (id) on delete cascade,
  role text not null default 'buyer' check (role in ('buyer', 'manager', 'admin')),
  created_at timestamptz not null default now(),
  unique (dealership_id, user_id)
);

create or replace function public.la_is_member(p_dealership uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.la_dealership_members m
    where m.dealership_id = p_dealership
      and m.user_id = auth.uid()
  );
$$;

create table if not exists public.la_user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.la_profiles (id) on delete cascade,
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  default_desired_profit numeric(12, 2) not null default 1500,
  default_desired_roi numeric(8, 2) not null default 12,
  default_risk_reserve numeric(12, 2) not null default 250,
  default_transportation_rate numeric(8, 4) not null default 1.35,
  acquisition_budget numeric(14, 2) not null default 185000,
  default_fee_schedule_id uuid,
  comfort_margin_percent numeric(8, 2) not null default 8,
  caution_margin_percent numeric(8, 2) not null default 3,
  min_roi_percent numeric(8, 2) not null default 8,
  min_profit numeric(12, 2) not null default 500,
  elevated_risk_score_below integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_auctions (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  name text not null,
  auction_key text not null,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_auction_fee_schedules (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  name text not null,
  auction_key text not null,
  sample_data boolean not null default true,
  active boolean not null default true,
  buyer_fee_kind text not null default 'flat' check (buyer_fee_kind in ('flat', 'percentage', 'tiered')),
  buyer_fee_flat numeric(12, 2) not null default 0,
  buyer_fee_percent numeric(8, 4) not null default 0,
  buyer_fee_min numeric(12, 2) not null default 0,
  buyer_fee_max numeric(12, 2),
  internet_fee numeric(12, 2) not null default 0,
  gate_fee numeric(12, 2) not null default 0,
  title_fee numeric(12, 2) not null default 0,
  documentation_fee numeric(12, 2) not null default 0,
  storage_fee numeric(12, 2) not null default 0,
  late_payment_fee numeric(12, 2) not null default 0,
  tax_treatment text not null default 'none',
  tax_rate numeric(8, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_auction_fee_tiers (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.la_auction_fee_schedules (id) on delete cascade,
  min_bid numeric(12, 2) not null default 0,
  max_bid numeric(12, 2),
  flat numeric(12, 2) not null default 0,
  percent numeric(8, 4) not null default 0
);

create table if not exists public.la_vehicles (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  year integer not null,
  make text not null,
  model text not null,
  trim text,
  mileage integer not null default 0,
  exterior_color text,
  interior_color text,
  title_status text not null default 'clean',
  auction_name text,
  auction_location text,
  auction_key text,
  stock_number text,
  image_url text,
  notes text,
  condition_score integer not null default 7,
  auction_date timestamptz,
  vin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_acquisition_worksheets (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  vehicle_id uuid not null references public.la_vehicles (id) on delete cascade,
  assigned_buyer text,
  status text not null default 'draft',
  expected_selling_price numeric(12, 2) not null default 0,
  desired_min_profit numeric(12, 2) not null default 1500,
  desired_roi numeric(8, 2) not null default 12,
  expected_holding_period integer not null default 21,
  estimated_days_to_sell integer not null default 18,
  sales_commission numeric(12, 2) not null default 0,
  advertising_cost numeric(12, 2) not null default 0,
  negotiation_discount numeric(12, 2) not null default 0,
  created_by uuid references public.la_profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_acquisition_costs (
  id uuid primary key default gen_random_uuid(),
  worksheet_id uuid not null unique references public.la_acquisition_worksheets (id) on delete cascade,
  current_bid numeric(12, 2) not null default 0,
  expected_winning_bid numeric(12, 2) not null default 0,
  auction_buyer_fee numeric(12, 2) not null default 0,
  internet_bidding_fee numeric(12, 2) not null default 0,
  gate_fee numeric(12, 2) not null default 0,
  title_fee numeric(12, 2) not null default 0,
  documentation_fee numeric(12, 2) not null default 0,
  sales_tax numeric(12, 2) not null default 0,
  transportation numeric(12, 2) not null default 0,
  mechanical_repairs numeric(12, 2) not null default 0,
  body_repairs numeric(12, 2) not null default 0,
  tires numeric(12, 2) not null default 0,
  brakes numeric(12, 2) not null default 0,
  detailing numeric(12, 2) not null default 0,
  reconditioning numeric(12, 2) not null default 0,
  inspection numeric(12, 2) not null default 0,
  keys numeric(12, 2) not null default 0,
  fuel numeric(12, 2) not null default 0,
  storage numeric(12, 2) not null default 0,
  floor_plan_fees numeric(12, 2) not null default 0,
  financing_interest numeric(12, 2) not null default 0,
  risk_reserve numeric(12, 2) not null default 0,
  other_costs numeric(12, 2) not null default 0,
  custom_rows jsonb not null default '[]'::jsonb,
  fee_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_vehicle_values (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null unique references public.la_vehicles (id) on delete cascade,
  trade_in numeric(12, 2) not null default 0,
  wholesale numeric(12, 2) not null default 0,
  retail numeric(12, 2) not null default 0,
  quick_sale numeric(12, 2) not null default 0,
  local_market_average numeric(12, 2) not null default 0,
  low_market numeric(12, 2) not null default 0,
  high_market numeric(12, 2) not null default 0,
  source text,
  retrieved_at timestamptz,
  confidence numeric(8, 2) not null default 50,
  manual_override boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_condition_items (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.la_vehicles (id) on delete cascade,
  flag text not null,
  selected boolean not null default false,
  dollar_adjustment numeric(12, 2) not null default 0
);

create table if not exists public.la_saved_locations (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  name text not null,
  kind text not null default 'other',
  zip text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_transportation_estimates (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  worksheet_id uuid references public.la_acquisition_worksheets (id) on delete set null,
  pickup_zip text,
  delivery_zip text,
  estimated_distance numeric(10, 2) not null default 0,
  cost_per_mile numeric(8, 4) not null default 0,
  flat_pickup_charge numeric(12, 2) not null default 0,
  inoperable_surcharge numeric(12, 2) not null default 0,
  enclosed_surcharge numeric(12, 2) not null default 0,
  urgent_surcharge numeric(12, 2) not null default 0,
  toll_estimate numeric(12, 2) not null default 0,
  carrier_name text,
  pickup_status text not null default 'not_scheduled',
  delivery_status text not null default 'not_scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_watchlist_items (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  worksheet_id uuid not null references public.la_acquisition_worksheets (id) on delete cascade,
  created_by uuid references public.la_profiles (id),
  created_at timestamptz not null default now(),
  unique (dealership_id, worksheet_id)
);

create table if not exists public.la_purchases (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  worksheet_id uuid not null references public.la_acquisition_worksheets (id) on delete cascade,
  status text not null default 'won',
  winning_bid numeric(12, 2) not null default 0,
  auction_fees numeric(12, 2) not null default 0,
  transportation numeric(12, 2) not null default 0,
  repairs numeric(12, 2) not null default 0,
  reconditioning numeric(12, 2) not null default 0,
  total_cost numeric(12, 2) not null default 0,
  listed_price numeric(12, 2) not null default 0,
  sold_price numeric(12, 2) not null default 0,
  sale_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.la_purchase_status_history (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.la_purchases (id) on delete cascade,
  status text not null,
  note text,
  at timestamptz not null default now()
);

create table if not exists public.la_comparable_vehicles (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  worksheet_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.la_activity_logs (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.la_dealerships (id) on delete cascade,
  user_id uuid references public.la_profiles (id),
  message text not null,
  entity_type text,
  entity_id text,
  created_at timestamptz not null default now()
);

alter table public.la_dealerships
  add constraint la_dealerships_default_destination_fk
  foreign key (default_destination_id) references public.la_saved_locations (id) on delete set null;

create index if not exists la_vehicles_dealership_idx on public.la_vehicles (dealership_id);
create index if not exists la_worksheets_dealership_idx on public.la_acquisition_worksheets (dealership_id);
create index if not exists la_purchases_dealership_idx on public.la_purchases (dealership_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'la_dealerships','la_profiles','la_user_settings','la_auctions','la_auction_fee_schedules',
    'la_vehicles','la_acquisition_worksheets','la_acquisition_costs','la_vehicle_values',
    'la_saved_locations','la_transportation_estimates','la_purchases'
  ]
  loop
    execute format(
      'drop trigger if exists %I on public.%I; create trigger %I before update on public.%I for each row execute function public.la_set_updated_at();',
      t || '_updated', t, t || '_updated', t
    );
  end loop;
end $$;

alter table public.la_dealerships enable row level security;
alter table public.la_profiles enable row level security;
alter table public.la_dealership_members enable row level security;
alter table public.la_user_settings enable row level security;
alter table public.la_auctions enable row level security;
alter table public.la_auction_fee_schedules enable row level security;
alter table public.la_auction_fee_tiers enable row level security;
alter table public.la_vehicles enable row level security;
alter table public.la_acquisition_worksheets enable row level security;
alter table public.la_acquisition_costs enable row level security;
alter table public.la_vehicle_values enable row level security;
alter table public.la_condition_items enable row level security;
alter table public.la_saved_locations enable row level security;
alter table public.la_transportation_estimates enable row level security;
alter table public.la_watchlist_items enable row level security;
alter table public.la_purchases enable row level security;
alter table public.la_purchase_status_history enable row level security;
alter table public.la_comparable_vehicles enable row level security;
alter table public.la_activity_logs enable row level security;

create policy la_profiles_self on public.la_profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy la_members_read on public.la_dealership_members
  for select using (public.la_is_member(dealership_id) or user_id = auth.uid());

create policy la_dealerships_member on public.la_dealerships
  for all using (public.la_is_member(id));

create policy la_settings_member on public.la_user_settings
  for all using (user_id = auth.uid() or public.la_is_member(dealership_id))
  with check (user_id = auth.uid());

create policy la_auctions_member on public.la_auctions
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));
create policy la_fees_member on public.la_auction_fee_schedules
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));
create policy la_fee_tiers_member on public.la_auction_fee_tiers
  for all using (
    exists (select 1 from public.la_auction_fee_schedules s where s.id = schedule_id and public.la_is_member(s.dealership_id))
  );
create policy la_vehicles_member on public.la_vehicles
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));
create policy la_worksheets_member on public.la_acquisition_worksheets
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));
create policy la_costs_member on public.la_acquisition_costs
  for all using (
    exists (select 1 from public.la_acquisition_worksheets w where w.id = worksheet_id and public.la_is_member(w.dealership_id))
  );
create policy la_values_member on public.la_vehicle_values
  for all using (
    exists (select 1 from public.la_vehicles v where v.id = vehicle_id and public.la_is_member(v.dealership_id))
  );
create policy la_condition_member on public.la_condition_items
  for all using (
    exists (select 1 from public.la_vehicles v where v.id = vehicle_id and public.la_is_member(v.dealership_id))
  );
create policy la_locations_member on public.la_saved_locations
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));
create policy la_transport_member on public.la_transportation_estimates
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));
create policy la_watch_member on public.la_watchlist_items
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));
create policy la_purchases_member on public.la_purchases
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));
create policy la_purchase_hist_member on public.la_purchase_status_history
  for all using (
    exists (select 1 from public.la_purchases p where p.id = purchase_id and public.la_is_member(p.dealership_id))
  );
create policy la_comparables_member on public.la_comparable_vehicles
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));
create policy la_activity_member on public.la_activity_logs
  for all using (public.la_is_member(dealership_id)) with check (public.la_is_member(dealership_id));

create or replace function public.la_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d uuid;
begin
  insert into public.la_dealerships (name)
  values (coalesce(new.raw_user_meta_data->>'dealership', 'New dealership'))
  returning id into d;

  insert into public.la_profiles (id, dealership_id, full_name, email, role)
  values (
    new.id,
    d,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'admin'
  );

  insert into public.la_dealership_members (dealership_id, user_id, role)
  values (d, new.id, 'admin');

  insert into public.la_user_settings (user_id, dealership_id)
  values (new.id, d);

  return new;
end;
$$;

drop trigger if exists la_on_auth_user on auth.users;
create trigger la_on_auth_user
  after insert on auth.users
  for each row execute function public.la_handle_new_user();

