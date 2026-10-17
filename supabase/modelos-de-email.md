# Modelos de e-mail do Supabase

O site confirma o e-mail e cria a senha nova pelo **link** que chega no e-mail: quem toca no
link volta ao site já conectado (no caso da senha nova, o site abre pedindo a senha nova).

O Supabase só deixa editar os modelos depois que o serviço de envio próprio (SMTP, no fim deste
arquivo) estiver ligado. Até lá, os e-mails saem em inglês, com o remetente do Supabase; o link
funciona do mesmo jeito.

Onde trocar: **Authentication → Emails → Templates**. Em cada modelo, troque o assunto
(**Subject**) e o corpo (**Body**, aba de código) e clique em **Save changes**.

## Confirm sign up (confirmação do primeiro acesso)

**Subject**

```
Confirme o seu e-mail no site da LAPAC
```

**Body**

```html
<h2>Confirme o seu e-mail</h2>
<p>Toque no botão abaixo para ativar a sua conta de diretor no site da LAPAC:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 20px;background:#8c1d2c;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:bold">Confirmar e entrar</a></p>
<p>Se você não pediu, pode ignorar este e-mail.</p>
<p>LAPAC – Liga Acadêmica de Patologia Clínica · PUC Goiás</p>
```

## Reset password (esqueci minha senha)

**Subject**

```
Crie uma senha nova no site da LAPAC
```

**Body**

```html
<h2>Senha nova</h2>
<p>Toque no botão abaixo para criar uma senha nova no site da LAPAC:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 20px;background:#8c1d2c;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:bold">Criar senha nova</a></p>
<p>Se você não pediu, pode ignorar este e-mail; a sua senha continua a mesma.</p>
<p>LAPAC – Liga Acadêmica de Patologia Clínica · PUC Goiás</p>
```

## Serviço de envio (SMTP) com o domínio lapac.space

Sem ele, o Supabase só entrega e-mails para quem é da equipe do projeto, no máximo 2 por hora.
Com ele, os e-mails saem como **LAPAC <nao-responda@lapac.space>** para qualquer endereço
(limite inicial de 30 por hora, ajustável em **Authentication → Rate Limits**).

1. Crie a conta no Resend (resend.com).
2. Em **Domains → Add Domain**, cadastre `lapac.space`. Coloque na Whois os registros de DNS
   que o Resend mostrar e clique em **Verify**.
3. Em **API Keys → Create API Key**, crie uma chave com permissão de envio. Ela é secreta:
   só você digita, e ela nunca vai para o site.
4. No Supabase, **Authentication → Emails → SMTP Settings**, ligue **Enable custom SMTP**:

   | Campo | Valor |
   |---|---|
   | Sender email | `nao-responda@lapac.space` |
   | Sender name | `LAPAC` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | a chave do passo 3 |
