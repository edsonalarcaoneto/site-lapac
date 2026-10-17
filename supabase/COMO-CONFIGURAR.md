# Login de verdade (Supabase)

O site é estático: sozinho, ele não guarda contas nem o que os diretores publicam.
O Supabase é o servidor gratuito que faz isso: guarda as contas (e-mail e senha), o conteúdo
publicado pelo painel e os arquivos (fotos e PDFs).

Projeto em uso: **LAPAC SITE** (organização LAPAC, plano Free).
O endereço e a chave pública já estão em `js/conteudo.js`, no bloco `servidor`.

## 1. Tabelas e regras de acesso (feito uma vez)

**SQL Editor → New query**, cole o conteúdo de `configurar.sql` e clique em **Run**.
Rode uma vez só: rodar de novo dá erro de "already exists", sem estragar nada.

## 2. Cadastro público fechado

Em **Authentication → Sign In / Providers**, a opção **Allow new users to sign up** fica desligada.
Assim, ninguém cria conta sozinho; só entra quem a liga cadastrar.

## 3. Cadastrar um diretor

1. **Authentication → Users → Add user → Create new user**: e-mail do diretor e uma senha
   provisória, com **Auto Confirm User** marcado. Passe a senha provisória ao diretor em
   particular (nunca em grupo).
2. No **SQL Editor**, coloque o e-mail na lista de diretores (em letras minúsculas):

   ```sql
   insert into public.diretores (email, nome, cargo)
   values ('email.do.diretor@exemplo.com', 'Nome do Diretor', 'Cargo');
   ```

3. O diretor entra pela aba **Login** do site e troca a senha no botão **Trocar senha** do painel.

Quem tem conta mas não está na lista é desconectado na hora e não publica nada.
Os e-mails dos diretores ficam só no Supabase, nunca no código (o repositório é público).

## 4. Tirar um diretor

No **SQL Editor**:

```sql
delete from public.diretores where email = 'email.do.diretor@exemplo.com';
```

Depois, apague a conta em **Authentication → Users**.

## Senha esquecida

O plano gratuito só envia e-mails para quem é membro da organização no Supabase, então o
"esqueci a senha" por e-mail não chega aos demais diretores. Quando alguém esquecer a senha,
o administrador apaga a conta em **Authentication → Users** e cria de novo com outra senha
provisória (a linha na lista de diretores continua valendo).

## Chaves

- A chave **publishable** (`sb_publishable_…`) é pública por natureza e fica no site.
- A chave **secret** (`sb_secret_…`, ou a antiga `service_role`) **nunca** vai para o site,
  para o GitHub nem para mensagens.

## Observações

- O projeto gratuito é pausado depois de 7 dias sem atividade. Se pausar, reative no painel do
  Supabase; os dados continuam lá.
- A ligação do Supabase com o GitHub não é necessária para o site funcionar. Ela só serve para
  aplicar mudanças no banco automaticamente a partir do repositório.
