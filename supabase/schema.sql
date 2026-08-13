-- Kridavana schema
-- Run this in the Supabase SQL editor on a fresh project.

-- ---------------------------------------------------------------------------
-- Cached game data (from TheGamesDB). Shared, readable by any signed-in user.
-- ---------------------------------------------------------------------------
create table if not exists games (
  id bigint generated always as identity primary key,
  thegamesdb_id integer unique not null,
  name text not null,
  cover_url text,
  summary text,
  first_release_date date,
  genres text[] default '{}',
  platforms text[] default '{}',
  developer text,
  publishers text[] default '{}',
  rating text,
  youtube text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Private per-user data: logs, watchlist, lists
-- ---------------------------------------------------------------------------
create type log_status as enum (
  'playing', 'completed', 'dropped', 'on_hold', 'backlog', 'wishlist'
);

create table if not exists logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id bigint not null references games (id) on delete cascade,
  status log_status not null default 'backlog',
  platform text,
  rating numeric(3, 1) check (rating >= 0 and rating <= 10),
  review text,
  hours_played numeric(6, 1),
  started_on date,
  finished_on date,
  created_at timestamptz default now()
);

create table if not exists watchlist (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id bigint not null references games (id) on delete cascade,
  note text,
  added_at timestamptz default now(),
  unique (user_id, game_id)
);

create table if not exists lists (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  is_ranked boolean default false,
  is_pinned boolean default false,
  kind text default 'custom', -- 'custom' | 'best_100' | 'top_10_year'
  created_at timestamptz default now()
);

create table if not exists list_items (
  id bigint generated always as identity primary key,
  list_id bigint not null references lists (id) on delete cascade,
  game_id bigint not null references games (id) on delete cascade,
  rank integer,
  added_at timestamptz default now(),
  unique (list_id, game_id)
);

-- ---------------------------------------------------------------------------
-- Social layer: public profiles, reviews, likes, comments
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

-- auto-create a profile when a user signs up; prefers the username chosen
-- at signup (stored in raw_user_meta_data), falls back to the email prefix,
-- and dedupes collisions with a numeric suffix.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  chosen text;
  base text;
  i int := 0;
begin
  base := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'user_' || substr(new.id::text, 1, 8)
  );
  chosen := base;
  while exists (select 1 from public.profiles where username = chosen) loop
    i := i + 1;
    chosen := base || i::text;
  end loop;
  insert into public.profiles (id, username)
  values (new.id, chosen);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- One public review per user per game. Log entries that include a written
-- review are mirrored here so the whole community can see them.
-- FK targets point at profiles (which cascades to auth.users) so that
-- PostgREST can embed profiles(username) directly in review queries.
create table if not exists reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  game_id bigint not null references games (id) on delete cascade,
  log_id bigint references logs (id) on delete set null,
  rating numeric(3, 1) check (rating >= 0 and rating <= 10),
  body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, game_id)
);

create table if not exists review_likes (
  id bigint generated always as identity primary key,
  review_id bigint not null references reviews (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz default now(),
  unique (review_id, user_id)
);

create table if not exists review_comments (
  id bigint generated always as identity primary key,
  review_id bigint not null references reviews (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table games enable row level security;
alter table logs enable row level security;
alter table watchlist enable row level security;
alter table lists enable row level security;
alter table list_items enable row level security;
alter table profiles enable row level security;
alter table reviews enable row level security;
alter table review_likes enable row level security;
alter table review_comments enable row level security;

-- games: shared cached data, any signed-in user can read / add
create policy "games are readable by any authenticated user"
  on games for select using (auth.role() = 'authenticated');
create policy "games are insertable by any authenticated user"
  on games for insert with check (auth.role() = 'authenticated');

-- private per-user data
create policy "users manage their own logs"
  on logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage their own watchlist"
  on watchlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage their own lists"
  on lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage items in their own lists"
  on list_items for all using (
    exists (select 1 from lists where lists.id = list_items.list_id and lists.user_id = auth.uid())
  ) with check (
    exists (select 1 from lists where lists.id = list_items.list_id and lists.user_id = auth.uid())
  );

-- profiles: everyone reads, you edit your own
create policy "profiles are readable by any authenticated user"
  on profiles for select using (auth.role() = 'authenticated');
create policy "users update their own profile"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- reviews: public, owner manages
create policy "reviews are readable by any authenticated user"
  on reviews for select using (auth.role() = 'authenticated');
create policy "users manage their own reviews"
  on reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- likes: public, one row per user
create policy "likes are readable by any authenticated user"
  on review_likes for select using (auth.role() = 'authenticated');
create policy "users manage their own likes"
  on review_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- comments: public, owner manages
create policy "comments are readable by any authenticated user"
  on review_comments for select using (auth.role() = 'authenticated');
create policy "users manage their own comments"
  on review_comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
