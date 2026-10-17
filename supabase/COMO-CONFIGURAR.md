# Como ligar o login de verdade (Supabase)

O site é estático: sozinho, ele não guarda contas nem o que os diretores publicam.
O Supabase é o servidor gratuito que faz isso: guarda as contas (e-mail e senha), o conteúdo
publicado pelo painel e os arquivos (fotos e PDFs).

## 1. Criar o projeto

1. Entre em supabase.com com o Gmail da liga e crie um projeto (plano Free).
2. Anote a senha do banco num lugar seguro (ela não vai para o site).

## 2. Criar as tabelas e as regras de acesso

1. No projeto, abra **SQL Editor → New query**.
2. Cole o conteúdo de `configurar.sql` e clique em **Run**. Rode uma vez só.

## 3. Fechar o cadastro público

Em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up**.
Assim, ninguém cria conta sozinho; só entra quem a liga cadastrar.

## 4. Cadastrar cada diretor

1. **Authentication → Users → Add user → Create new user**: e-mail e senha do diretor,
   com a confirmação automática marcada.
2. No **SQL Editor**, coloque o e-mail na lista de diretores (em letras minúsculas):

   ```sql
   insert into public.diretores (email, nome, cargo)
   values ('email.do.diretor@exemplo.com', 'Nome do Diretor', 'Cargo');
   ```

Quem tem conta mas não está na lista consegue entrar, mas é desconectado na hora e não publica nada.

## 5. Ligar o site ao projeto

Em **Project Settings → API**, copie a **Project URL** e a chave **anon / public**
e cole em `js/conteudo.js`, no bloco `servidor`.
Essa chave é pública por natureza; quem protege os dados são as regras do passo 2.
**Nunca** coloque no site a chave `service_role` (secreta).

## Observações

- O projeto gratuito é pausado depois de 7 dias com pouca atividade. Visitas ao site contam como
  atividade. Se pausar, reative no painel do Supabase; os dados continuam lá.
- Para trocar a senha de um diretor: **Authentication → Users**, no diretor, redefina a senha.
