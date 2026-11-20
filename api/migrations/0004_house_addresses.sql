create table house_addresses (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  street text not null,
  house text not null,
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  metro_ids text[] not null,
  unique (city, street, house, lat, lon)
);
alter table hookers add column address_id uuid references house_addresses(id);
create index hookers_address_id_idx on hookers(address_id);
create index house_addresses_metro_idx on house_addresses using gin(metro_ids);
