-- Migration: add product variant infrastructure
-- Creates option/value tables, variant table, and links images + products

-- Enable pgcrypto for gen_random_uuid if not already enabled
create extension if not exists "pgcrypto";

-- Product options (e.g. ring color, bead color)
create table if not exists product_options (
  id uuid primary key default gen_random_uuid(),
  "productId" text not null references products(id) on delete cascade,
  key text not null,
  label text not null,
  "displayType" text not null default 'swatch',
  "sortOrder" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists product_options_productid_key_idx
  on product_options ("productId", key);

-- Product option values (e.g. Gold, Silver)
create table if not exists product_option_values (
  id uuid primary key default gen_random_uuid(),
  "optionId" uuid not null references product_options(id) on delete cascade,
  value text not null,
  label text not null,
  "hexValue" text,
  media jsonb,
  "sortOrder" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists product_option_values_optionid_value_idx
  on product_option_values ("optionId", value);

-- Product variants (concrete combinations of option values)
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  "productId" text not null references products(id) on delete cascade,
  title text not null,
  description text,
  sku text,
  stock integer default 0,
  "isActive" boolean not null default true,
  "sortOrder" integer not null default 0,
  "optionValueKey" text not null,
  "badgeHex" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists product_variants_productid_optionvaluekey_idx
  on product_variants ("productId", "optionValueKey");

-- Junction table connecting variants to chosen option values
create table if not exists product_variant_options (
  id uuid primary key default gen_random_uuid(),
  "variantId" uuid not null references product_variants(id) on delete cascade,
  "optionId" uuid not null references product_options(id) on delete cascade,
  "valueId" uuid not null references product_option_values(id) on delete cascade,
  "createdAt" timestamptz not null default now()
);

create unique index if not exists product_variant_options_variant_option_idx
  on product_variant_options ("variantId", "optionId");

-- Link product images to a specific variant when needed
alter table if exists product_images
  add column if not exists "variantId" uuid references product_variants(id) on delete cascade;

create index if not exists product_images_variantid_idx
  on product_images ("variantId");

-- Flag products that use variants and track default variant
alter table if exists products
  add column if not exists "hasVariants" boolean not null default false;

alter table if exists products
  add column if not exists "defaultVariantId" uuid references product_variants(id);

alter table if exists products
  add column if not exists "cardTitle" text;

create index if not exists products_defaultvariantid_idx
  on products ("defaultVariantId");
