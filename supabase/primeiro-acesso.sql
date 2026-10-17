-- =====================================================================
-- Primeiro acesso dos diretores com a senha padrão (código de convite)
-- Rode depois de configurar.sql, uma vez: SQL Editor → New query → colar → Run.
--
-- Como funciona:
-- - No site, aba Login → "Primeiro acesso", o diretor informa o e-mail, a senha padrão,
--   o nome, o cargo e a nova senha (duas vezes), e depois o código que chega no e-mail.
-- - A conta só é criada se a senha padrão estiver certa, e o diretor só entra na lista
--   de diretores quando confirma o e-mail. A senha padrão não fica guardada na conta dele.
-- - A senha padrão fica guardada só como hash (embaralhada), nunca no código do site.
--
-- Para definir ou trocar a senha padrão (rode você mesmo, no SQL Editor):
--   select privado.definir_convite('a senha padrão aqui');
-- Para desligar o primeiro acesso (depois que todos criarem a conta):
--   select privado.definir_convite(null);
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Esquema fora da API: nada aqui é visível pelo site.
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
grant usage on schema privado to supabase_auth_admin;

create table if not exists privado.convite (
  id          boolean primary key default true check (id),
  codigo_hash text
);
alter table privado.convite enable row level security;
revoke all on privado.convite from public, anon, authenticated;

create or replace function privado.definir_convite(codigo text)
returns text
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into privado.convite (id, codigo_hash)
  values (true, case when coalesce(codigo, '') = '' then null
                     else extensions.crypt(codigo, extensions.gen_salt('bf', 10)) end)
  on conflict (id) do update set codigo_hash = excluded.codigo_hash;
  return case when coalesce(codigo, '') = '' then 'Primeiro acesso desligado.'
              else 'Senha padrão definida.' end;
end;
$$;
revoke all on function privado.definir_convite(text) from public, anon, authenticated;

-- Coloca o e-mail na lista de diretores, com o nome e o cargo informados no primeiro acesso.
create or replace function privado.registrar_diretor(p_email text, p_meta jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_nome  text := nullif(trim(p_meta ->> 'nome'), '');
  v_cargo text := nullif(trim(p_meta ->> 'cargo'), '');
begin
  insert into public.diretores (email, nome, cargo)
  values (lower(p_email), coalesce(v_nome, split_part(p_email, '@', 1)), v_cargo)
  on conflict (email) do update
    set nome  = excluded.nome,
        cargo = coalesce(excluded.cargo, public.diretores.cargo);
end;
$$;
revoke all on function privado.registrar_diretor(text, jsonb) from public, anon, authenticated;

-- Antes de criar a conta: confere a senha padrão e tira ela dos dados da conta.
-- Se a conta já nasce confirmada (confirmação de e-mail desligada), cadastra o diretor na hora.
create or replace function privado.conferir_convite()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  h        text;
  v_codigo text := new.raw_user_meta_data ->> 'convite';
begin
  select codigo_hash into h from privado.convite where id;
  if h is null or v_codigo is null or extensions.crypt(v_codigo, h) <> h then
    raise exception 'convite_invalido';
  end if;

  new.raw_user_meta_data := new.raw_user_meta_data - 'convite';

  if new.email_confirmed_at is not null then
    perform privado.registrar_diretor(new.email, new.raw_user_meta_data);
  end if;
  return new;
end;
$$;
revoke all on function privado.conferir_convite() from public, anon, authenticated;

drop trigger if exists conferir_convite on auth.users;
create trigger conferir_convite
  before insert on auth.users
  for each row execute function privado.conferir_convite();

-- Quando o diretor confirma o e-mail com o código, ele entra na lista de diretores.
-- Assim, um e-mail digitado errado nunca chega à lista.
create or replace function privado.diretor_confirmado()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform privado.registrar_diretor(new.email, new.raw_user_meta_data);
  return new;
end;
$$;
revoke all on function privado.diretor_confirmado() from public, anon, authenticated;

drop trigger if exists diretor_confirmado on auth.users;
create trigger diretor_confirmado
  after update on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function privado.diretor_confirmado();
