-- ============================================
-- UMAR BREND — Supabase baza sxemasi
-- Buni Supabase loyihangizda: SQL Editor > New query > shu faylni joylashtiring > Run
-- ============================================

-- Kategoriyalar
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- Mahsulotlar
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric not null default 0,
  image text default '',
  description text default '',
  sizes jsonb not null default '[]', -- masalan: [{"size":"39","qty":5},{"size":"40","qty":3}]
  created_at timestamptz default now()
);

-- Sotuvlar tarixi
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  size text,
  qty integer not null default 1,
  sold_price numeric not null default 0,
  sold_at timestamptz default now()
);

-- Do'kon sozlamalari (bitta qator)
create table if not exists settings (
  id integer primary key default 1,
  shop_name text default 'Umar Brend',
  telegram text default '',
  instagram text default '',
  phone text default ''
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- Boshlang'ich kategoriyalar
insert into categories (name) values ('Erkak') on conflict do nothing;
insert into categories (name) values ('Ayol') on conflict do nothing;

-- ============================================
-- XAVFSIZLIK QOIDALARI (Row Level Security)
-- Mijozlar: faqat o'qiy oladi (mahsulot, kategoriya, sozlamalar)
-- Admin (tizimga kirgan): qo'sha/o'zgartira/o'chira oladi
-- ============================================
alter table categories enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table settings enable row level security;

-- Hammaga o'qishga ruxsat (mijozlar sayt ochganda ko'rishi uchun)
create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read settings" on settings for select using (true);
-- Sotuvlar tarixi faqat adminga ko'rinadi
create policy "admin read sales" on sales for select using (auth.role() = 'authenticated');

-- Faqat tizimga kirgan admin o'zgartira oladi
create policy "admin write categories" on categories for insert with check (auth.role() = 'authenticated');
create policy "admin update categories" on categories for update using (auth.role() = 'authenticated');
create policy "admin delete categories" on categories for delete using (auth.role() = 'authenticated');

create policy "admin write products" on products for insert with check (auth.role() = 'authenticated');
create policy "admin update products" on products for update using (auth.role() = 'authenticated');
create policy "admin delete products" on products for delete using (auth.role() = 'authenticated');

create policy "admin write sales" on sales for insert with check (auth.role() = 'authenticated');
create policy "admin update sales" on sales for update using (auth.role() = 'authenticated');
create policy "admin delete sales" on sales for delete using (auth.role() = 'authenticated');

create policy "admin update settings" on settings for update using (auth.role() = 'authenticated');