-- =====================================================================
-- Configuração do servidor do site da LAPAC no Supabase
-- Rode este arquivo UMA vez: Supabase → SQL Editor → New query → colar → Run.
-- =====================================================================

-- 1. Lista de diretores: só quem tem o e-mail aqui pode publicar no site.
create table if not exists public.diretores (
  email text primary key check (email = lower(email)),
  nome  text not null,
  cargo text
);
alter table public.diretores enable row level security;

create policy "diretores leem a lista"
  on public.diretores for select to authenticated
  using (true);

-- Confere se quem está logado é diretor (usada nas regras abaixo).
create or replace function public.eh_diretor()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.diretores
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 2. Conteúdo publicado pelo painel (aulas, artigos e atividades).
create table if not exists public.conteudos (
  colecao       text not null check (colecao in ('aulas', 'producoes', 'atividades')),
  id            text not null,
  dados         jsonb not null,
  atualizado_em timestamptz not null default now(),
  primary key (colecao, id)
);
alter table public.conteudos enable row level security;

-- Visitantes leem tudo, menos rascunhos; diretores leem também os rascunhos.
create policy "todos leem o que está publicado"
  on public.conteudos for select to anon, authenticated
  using (coalesce(dados ->> 'status', 'publicado') <> 'rascunho' or public.eh_diretor());

create policy "diretores publicam"
  on public.conteudos for insert to authenticated
  with check (public.eh_diretor());

create policy "diretores editam"
  on public.conteudos for update to authenticated
  using (public.eh_diretor()) with check (public.eh_diretor());

create policy "diretores removem"
  on public.conteudos for delete to authenticated
  using (public.eh_diretor());

grant select on public.conteudos to anon, authenticated;
grant insert, update, delete on public.conteudos to authenticated;
grant select on public.diretores to authenticated;
grant execute on function public.eh_diretor() to anon, authenticated;

-- 3. Arquivos (fotos das atividades e PDFs das aulas), com leitura pública.
insert into storage.buckets (id, name, public)
values ('arquivos', 'arquivos', true)
on conflict (id) do nothing;

create policy "diretores enviam arquivos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and public.eh_diretor());

create policy "diretores apagam arquivos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and public.eh_diretor());

-- 4. Cadastre os diretores (e-mail em letras minúsculas). Repita a linha para cada um.
-- insert into public.diretores (email, nome, cargo) values
--   ('email.do.diretor@exemplo.com', 'Nome do Diretor', 'Diretor de Extensão');
