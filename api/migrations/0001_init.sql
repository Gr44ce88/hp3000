-- Начальная схема: пользователи, сессии, анкеты, отзывы, избранное, просмотры.

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null check (char_length(name) between 2 and 60),
  phone text not null default '',
  avatar_url text not null default '',
  password_hash text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index users_email_lower_idx on users (lower(email));

create table sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index sessions_user_idx on sessions (user_id);

create table hookers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users (id) on delete set null,
  name text not null check (char_length(name) between 2 and 60),
  age int not null check (age between 18 and 80),
  city text not null,
  district text not null default '',
  region text not null check (char_length(region) between 2 and 60),
  phone text not null check (char_length(phone) between 10 and 20),
  height int not null check (height between 140 and 210),
  price_per_hour int not null check (price_per_hour > 0),
  services text[] not null default '{}',
  about text not null default '' check (char_length(about) <= 255),
  photos text[] not null default '{}',
  kind text not null default 'project',
  is_new boolean not null default true,
  created_at timestamptz not null default now()
);

create index hookers_price_idx on hookers (price_per_hour);
create index hookers_created_idx on hookers (created_at desc);
create index hookers_city_idx on hookers (lower(city));
create index hookers_owner_idx on hookers (owner_id);

-- Один отзыв на анкету от одного автора — дубль режет сама БД.
create table reviews (
  id uuid primary key default gen_random_uuid(),
  hooker_id uuid not null references hookers (id) on delete cascade,
  author_id uuid not null references users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 10 and 1000),
  created_at timestamptz not null default now(),
  unique (hooker_id, author_id)
);

create index reviews_hooker_idx on reviews (hooker_id);
create index reviews_author_idx on reviews (author_id);

create table favorites (
  user_id uuid not null references users (id) on delete cascade,
  hooker_id uuid not null references hookers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, hooker_id)
);

create index favorites_user_idx on favorites (user_id, created_at desc);

create table history (
  user_id uuid not null references users (id) on delete cascade,
  hooker_id uuid not null references hookers (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, hooker_id)
);
