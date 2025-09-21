-- Migration: add personalization support for customizable products
-- Creates personalization config tables and stores personalization payloads on cart/order items

create extension if not exists "pgcrypto";

-- Flag products that require personalization flow
alter table if exists products
  add column if not exists "isPersonalizable" boolean not null default false;

-- Personalization configuration per product
create table if not exists product_personalization_configs (
  id uuid primary key default gen_random_uuid(),
  "productId" uuid not null references products(id) on delete cascade,
  "requireCompletion" boolean not null default true,
  "stepCount" integer not null default 2,
  settings jsonb not null default '{}',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists product_personalization_configs_productid_idx
  on product_personalization_configs("productId");

-- Individual fields/questions that will be asked to the customer
create table if not exists product_personalization_fields (
  id uuid primary key default gen_random_uuid(),
  "configId" uuid not null references product_personalization_configs(id) on delete cascade,
  key text not null,
  label text not null,
  type text not null,
  placeholder text,
  "helperText" text,
  "isRequired" boolean not null default false,
  "sortOrder" integer not null default 0,
  options jsonb,
  metadata jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists product_personalization_fields_configid_idx
  on product_personalization_fields("configId");

create unique index if not exists product_personalization_fields_config_key_idx
  on product_personalization_fields("configId", key);

-- Store personalization payloads along with cart items and order items
alter table if exists cart_items
  add column if not exists personalization jsonb;

alter table if exists order_items
  add column if not exists personalization jsonb;
