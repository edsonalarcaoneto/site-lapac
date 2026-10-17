# Modelos de e-mail do Supabase

O site pede ao diretor o **código** que chega no e-mail (não um link). Para isso, os dois
modelos abaixo precisam mostrar o código, com `{{ .Token }}`.

O Supabase só deixa editar os modelos depois que o serviço de envio próprio (SMTP, no fim deste
arquivo) estiver ligado. Até lá, os e-mails saem com o modelo padrão, que traz um link; o site
também aceita esse link (quem toca nele volta ao site já conectado).

Onde trocar: **Authentication → Emails → Templates**. Em cada modelo, troque o assunto
(**Subject**) e o corpo (**Body**, aba de código) e clique em **Save changes**.

## Confirm signup (confirmação do primeiro acesso)

**Subject**

```
Seu código para ativar a conta no site da LAPAC
```

**Body**

```html
<h2>Confirme o seu e-mail</h2>
<p>Use este código no site da LAPAC para ativar a sua conta de diretor:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>O código vale por pouco tempo. Se você não pediu, pode ignorar este e-mail.</p>
<p>LAPAC – Liga Acadêmica de Patologia Clínica · PUC Goiás</p>
```

## Reset password (esqueci minha senha)

**Subject**

```
Seu código para criar uma senha nova no site da LAPAC
```

**Body**

```html
<h2>Senha nova</h2>
<p>Use este código no site da LAPAC para criar uma senha nova:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>O código vale por pouco tempo. Se você não pediu, pode ignorar este e-mail; a sua senha continua a mesma.</p>
<p>LAPAC – Liga Acadêmica de Patologia Clínica · PUC Goiás</p>
```

## Envio para todos os diretores

O envio que vem com o Supabase só entrega para os e-mails da equipe do projeto e no máximo
2 por hora. Para os códigos chegarem a todos os diretores, ligue um serviço de envio (SMTP)
com o domínio `lapac.space`, em **Authentication → Emails → SMTP Settings**:

1. Crie a conta no serviço (por exemplo, o Resend) e cadastre o domínio `lapac.space`.
2. Coloque na Whois os registros de DNS que o serviço pedir e espere a verificação.
3. No Supabase, ligue **Enable custom SMTP** e preencha com os dados do serviço.
   Remetente sugerido: `nao-responda@lapac.space`, com o nome **LAPAC**.
   A senha/chave do serviço é secreta: só você digita, e ela nunca vai para o site.
