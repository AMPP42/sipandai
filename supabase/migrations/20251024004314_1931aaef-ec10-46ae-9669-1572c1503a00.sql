-- Create app_role enum for user roles
create type public.app_role as enum ('admin_pusat', 'admin_unit', 'viewer');

-- Create work_units table
create table public.work_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on work_units
alter table public.work_units enable row level security;

-- Create profiles table for user data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  unit text,
  status text default 'pending' check (status in ('active', 'pending', 'rejected', 'suspended')),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create security definer function to approve user accounts
create or replace function public.approve_user_account(
  target_user_id uuid,
  approver_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set 
    status = 'active',
    approved_at = now(),
    approved_by = approver_id
  where id = target_user_id;
end;
$$;

-- Create security definer function to reject user accounts
create or replace function public.reject_user_account(
  target_user_id uuid,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set 
    status = 'rejected',
    rejection_reason = reason
  where id = target_user_id;
end;
$$;

-- RLS Policies for work_units
create policy "Everyone can view active work units"
on public.work_units for select
using (is_active = true);

create policy "Admin pusat can manage work units"
on public.work_units for all
using (public.has_role(auth.uid(), 'admin_pusat'));

-- RLS Policies for profiles
create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Admin pusat can view all profiles"
on public.profiles for select
using (public.has_role(auth.uid(), 'admin_pusat'));

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "Admin pusat can update all profiles"
on public.profiles for update
using (public.has_role(auth.uid(), 'admin_pusat'));

-- RLS Policies for user_roles
create policy "Users can view their own roles"
on public.user_roles for select
using (auth.uid() = user_id);

create policy "Admin pusat can view all roles"
on public.user_roles for select
using (public.has_role(auth.uid(), 'admin_pusat'));

create policy "Admin pusat can manage all roles"
on public.user_roles for all
using (public.has_role(auth.uid(), 'admin_pusat'));

-- Create trigger function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, unit, status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'unit',
    'pending'
  );
  return new;
end;
$$;

-- Create trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert default work units
insert into public.work_units (code, name, category) values
  ('BKD', 'Badan Kepegawaian Daerah', 'Badan'),
  ('DISDIK', 'Dinas Pendidikan', 'Dinas'),
  ('DINKES', 'Dinas Kesehatan', 'Dinas'),
  ('DPUPR', 'Dinas Pekerjaan Umum dan Penataan Ruang', 'Dinas'),
  ('DISHUB', 'Dinas Perhubungan', 'Dinas')
on conflict (code) do nothing;

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger update_work_units_updated_at
  before update on public.work_units
  for each row execute function public.update_updated_at_column();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();