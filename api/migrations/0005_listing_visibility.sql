alter table hookers
  add column paused boolean not null default false,
  add column confirmed_at timestamptz,
  add column telegram text not null default '',
  add column show_house boolean not null default true;
-- Существующие анкеты сохраняют выбранный при публикации публичный адрес.
alter table hookers alter column show_house set default false;
