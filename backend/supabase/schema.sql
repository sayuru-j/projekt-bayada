-- Bayada / HolmanMap — Schema, RLS, RPC
-- Run in Supabase SQL Editor (enable PostGIS first if needed)

create extension if not exists postgis;

create type public.app_role as enum ('user', 'contributor', 'admin');
create type public.submission_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  role public.app_role default 'user' not null,
  avatar_url text,
  display_name text,
  created_at timestamptz default now()
);

create table public.haunted_places (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in (
    'mohini_sighting',
    'colonial_bungalow',
    'haunted_junction',
    'cemetery',
    'folklore_curse',
    'abandoned_building',
    'other'
  )),
  spookiness_rating int check (spookiness_rating between 1 and 5),
  location geography(Point, 4326) not null,
  latitude double precision not null,
  longitude double precision not null,
  nearest_city text not null,
  status public.submission_status default 'pending' not null,
  reviewed_by uuid references public.profiles(id),
  rejection_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index haunted_places_geo_idx on public.haunted_places using gist (location);
create index haunted_places_status_idx on public.haunted_places (status);
create index haunted_places_created_by_idx on public.haunted_places (created_by);

create table public.evidence_media (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.haunted_places(id) on delete cascade not null,
  media_type text not null check (media_type in ('image', 'youtube')),
  url text not null,
  youtube_id text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.place_visits (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.haunted_places(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  check_in_lat double precision not null,
  check_in_lng double precision not null,
  visited_at timestamptz default now(),
  unique(place_id, user_id)
);

create index place_visits_user_idx on public.place_visits (user_id);
create index place_visits_place_idx on public.place_visits (place_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'preferred_username'), ''),
    nullif(trim(split_part(coalesce(new.email, 'haunt'), '@', 1)), ''),
    'haunt'
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  if length(base_username) < 3 then
    base_username := 'haunt';
  end if;
  final_username := left(base_username, 20);

  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := left(base_username, 16) || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url, role)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', final_username),
    new.raw_user_meta_data->>'avatar_url',
    'user'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers for RLS
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user'::public.app_role);
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('contributor', 'admin');
$$;

-- GPS verification RPC
create or replace function public.verify_and_log_visit(
  p_place_id uuid,
  p_user_lat double precision,
  p_user_lng double precision
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_place_loc geography;
  v_distance_meters double precision;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Unauthorized');
  end if;

  select location into v_place_loc
  from public.haunted_places
  where id = p_place_id and status = 'approved';

  if not found then
    return json_build_object('success', false, 'message', 'Location not found or not approved');
  end if;

  v_distance_meters := ST_Distance(
    v_place_loc,
    ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
  );

  if v_distance_meters <= 500 then
    insert into public.place_visits (place_id, user_id, check_in_lat, check_in_lng)
    values (p_place_id, v_user_id, p_user_lat, p_user_lng)
    on conflict (place_id, user_id) do nothing;

    return json_build_object(
      'success', true,
      'distance', round(v_distance_meters::numeric, 1),
      'message', 'Verified! You survived.'
    );
  else
    return json_build_object(
      'success', false,
      'distance', round(v_distance_meters::numeric, 1),
      'message', 'Too far away. Must be within 500m.'
    );
  end if;
end;
$$;

-- Sync lat/lng into geography on insert/update
create or replace function public.sync_place_location()
returns trigger
language plpgsql
as $$
begin
  new.location := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326)::geography;
  new.updated_at := now();
  return new;
end;
$$;

create trigger haunted_places_sync_location
  before insert or update of latitude, longitude on public.haunted_places
  for each row execute function public.sync_place_location();

-- RLS
alter table public.profiles enable row level security;
alter table public.haunted_places enable row level security;
alter table public.evidence_media enable row level security;
alter table public.place_visits enable row level security;

-- Profiles
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins update any profile role"
  on public.profiles for update
  using (public.current_role() = 'admin');

-- Haunted places
create policy "Anyone can read approved places"
  on public.haunted_places for select
  using (
    status = 'approved'
    or created_by = auth.uid()
    or public.is_moderator()
  );

create policy "Authenticated users can submit places"
  on public.haunted_places for insert
  with check (auth.uid() = created_by);

create policy "Moderators update place status"
  on public.haunted_places for update
  using (public.is_moderator());

-- Evidence
create policy "Read evidence for visible places"
  on public.evidence_media for select
  using (
    exists (
      select 1 from public.haunted_places hp
      where hp.id = place_id
        and (
          hp.status = 'approved'
          or hp.created_by = auth.uid()
          or public.is_moderator()
        )
    )
  );

create policy "Authenticated users insert evidence"
  on public.evidence_media for insert
  with check (auth.uid() = uploaded_by);

-- Visits (public for leaderboard)
create policy "Visits are publicly readable"
  on public.place_visits for select using (true);

-- Inserts only via security definer RPC
create policy "No direct visit inserts"
  on public.place_visits for insert
  with check (false);

-- Storage bucket (run separately if needed)
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

create policy "Public read evidence bucket"
  on storage.objects for select
  using (bucket_id = 'evidence');

create policy "Auth users upload evidence"
  on storage.objects for insert
  with check (bucket_id = 'evidence' and auth.role() = 'authenticated');

create policy "Users delete own evidence uploads"
  on storage.objects for delete
  using (bucket_id = 'evidence' and auth.uid()::text = (storage.foldername(name))[1]);

-- Bootstrap admin (replace with your user UUID after Google sign-in):
-- update public.profiles set role = 'admin' where username = 'your_username';
