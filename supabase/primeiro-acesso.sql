-- =====================================================================
-- Primeiro acesso dos diretores com a senha padrão (código de convite)
-- Rode depois de configurar.sql, uma vez: SQL Editor → New query → colar → Run.
--
-- Como funciona:
-- - No site, aba Login → "Primeiro acesso", o diretor informa o e-mail (duas vezes),
--   a senha padrão, o nome, o cargo e a nova senha (duas vezes).
-- - A conta só é criada se a senha padrão estiver certa. O diretor entra na lista
--   de diretores na mesma hora, e a senha padrão não fica guardada na conta dele.
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

-- Confere a senha padrão antes de criar a conta e já cadastra o diretor.
create or replace function privado.conferir_convite()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  h        text;
  v_codigo text := new.raw_user_meta_data ->> 'convite';
  v_nome   text := nullif(trim(new.raw_user_meta_data ->> 'nome'), '');
  v_cargo  text := nullif(trim(new.raw_user_meta_data ->> 'cargo'), '');
begin
  select codigo_hash into h from privado.convite where id;
  if h is null or v_codigo is null or extensions.crypt(v_codigo, h) <> h then
    raise exception 'convite_invalido';
  end if;

  -- A senha padrão não fica guardada nos dados da conta.
  new.raw_user_meta_data := new.raw_user_meta_data - 'convite';

  insert into public.diretores (email, nome, cargo)
  values (lower(new.email), coalesce(v_nome, split_part(new.email, '@', 1)), v_cargo)
  on conflict (email) do update
    set nome  = excluded.nome,
        cargo = coalesce(excluded.cargo, public.diretores.cargo);
  return new;
end;
$$;
revoke all on function privado.conferir_convite() from public, anon, authenticated;

drop trigger if exists conferir_convite on auth.users;
create trigger conferir_convite
  before insert on auth.users
  for each row execute function privado.conferir_convite();
