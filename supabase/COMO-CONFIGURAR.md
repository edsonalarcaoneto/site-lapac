# Login de verdade (Supabase)

O site é estático: sozinho, ele não guarda contas nem o que os diretores publicam.
O Supabase é o servidor gratuito que faz isso: guarda as contas (e-mail e senha), o conteúdo
publicado pelo painel e os arquivos (fotos e PDFs).

Projeto em uso: **LAPAC SITE** (organização LAPAC, plano Free). Site: https://lapac.space
O endereço e a chave pública já estão em `js/conteudo.js`, no bloco `servidor`.

## 1. Tabelas e regras de acesso (feito uma vez)

**SQL Editor → New query**, cole o conteúdo de `configurar.sql` e clique em **Run**.
Rode uma vez só: rodar de novo dá erro de "already exists", sem estragar nada.

## 2. Primeiro acesso com senha padrão (feito uma vez)

1. **SQL Editor → New query**, cole o conteúdo de `primeiro-acesso.sql` e clique em **Run**.
2. Em **Authentication → Sign In / Providers**: **Allow new users to sign up** ligado e
   **Confirm email** ligado. Clique em **Save changes**. Quem barra quem não é diretor é a
   senha padrão; a confirmação garante que o e-mail digitado é mesmo da pessoa.
3. Troque os modelos de e-mail para mostrar o código: veja `modelos-de-email.md`.
4. Ligue um serviço de envio (SMTP) com o domínio `lapac.space`: também em
   `modelos-de-email.md`. Sem isso, os códigos só chegam aos e-mails da equipe do Supabase.
5. Defina a senha padrão no **SQL Editor** (só você digita; ela fica guardada embaralhada):

   ```sql
   select privado.definir_convite('a senha padrão aqui');
   ```

## 3. Como um diretor cria a conta

1. Você passa a senha padrão ao diretor em particular (nunca em grupo nem no código do site).
2. No site, aba **Login → Primeiro acesso**:
   - passo 1: e-mail e senha padrão;
   - passo 2: nome, cargo, a nova senha e a nova senha de novo;
   - passo 3: o código que chega no e-mail.
3. Se as senhas não baterem ou a senha padrão estiver errada, a conta não é criada.
4. Só depois do código o diretor entra na lista de diretores e o painel abre. Um e-mail
   digitado errado nunca chega à lista.

Quando todos tiverem criado a conta, desligue o primeiro acesso:

```sql
select privado.definir_convite(null);
```

Para a próxima gestão, defina uma senha padrão nova com o mesmo comando do passo 2.5.

Quem tem conta mas não está na lista de diretores é desconectado na hora e não publica nada.
Os e-mails dos diretores ficam só no Supabase, nunca no código (o repositório é público).

## 4. Tirar um diretor

No **SQL Editor**:

```sql
delete from public.diretores where email = 'email.do.diretor@exemplo.com';
```

Depois, apague a conta em **Authentication → Users**.

## Senha esquecida

Na aba **Login**, o botão **Esqueci minha senha** envia um código ao e-mail; com ele, o diretor
cria uma senha nova. Depende do serviço de envio do passo 2.4.

Contas criadas pelo botão **Add user** do painel do Supabase são barradas pela regra da senha
padrão; use sempre o **Primeiro acesso** do site.

## Chaves

- A chave **publishable** (`sb_publishable_…`) é pública por natureza e fica no site.
- A chave **secret** (`sb_secret_…`, ou a antiga `service_role`) **nunca** vai para o site,
  para o GitHub nem para mensagens.

## Observações

- O projeto gratuito é pausado depois de 7 dias sem atividade. Se pausar, reative no painel do
  Supabase; os dados continuam lá.
- A ligação do Supabase com o GitHub não é necessária para o site funcionar. Ela só serve para
  aplicar mudanças no banco automaticamente a partir do repositório.
