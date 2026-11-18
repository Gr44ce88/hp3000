-- Платные публикации: анкета живёт скрытой, пока не оплачена комиссия.

alter table hookers add column is_published boolean not null default true;

create table payments (
  id uuid primary key default gen_random_uuid(),
  hooker_id uuid not null references hookers (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  amount int not null check (amount > 0),
  currency text not null default 'RUB' check (char_length(currency) = 3),
  method text not null check (method in ('card', 'sbp', 'crypto')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  merchant_order_id text not null unique,
  provider text not null default 'freekassa',
  intid bigint,
  payer_account text,
  commission numeric(10, 2),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index payments_hooker_idx on payments (hooker_id);
create index payments_user_idx on payments (user_id, created_at desc);
