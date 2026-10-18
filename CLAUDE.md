# CLAUDE.md: site da LAPAC

Contexto para o Claude Code trabalhar neste repositório. Escreva e responda em **português do Brasil**.

A LAPAC é a Liga Acadêmica de Patologia Clínica da PUC Goiás. O site mostra aulas para profissionais de
saúde e para a população, artigos da liga e atividades. Quem cuida do site é a diretoria (hoje, o Diretor
de Extensão, Edson Alarcão). Explique o que fez em linguagem clara, defina cada termo técnico na primeira
vez que ele aparece e diga o que a pessoa precisa fazer do lado dela (clicar, colar, conferir).

## Regras de segurança (o repositório é público)

- Nunca coloque no código, nos commits nem nas mensagens:
  - a chave `secret`/`service_role` do Supabase;
  - senhas de qualquer tipo, incluindo a **senha padrão** do primeiro acesso;
  - a chave da API do serviço de e-mail (Resend);
  - e-mails ou telefones dos diretores e qualquer outro dado pessoal.
- Os e-mails dos diretores ficam **só** no Supabase (tabela `diretores` e `auth.users`).
- A chave `publishable` do Supabase em `js/conteudo.js` é pública de propósito. Quem protege os dados são
  as regras de acesso (RLS) em `supabase/configurar.sql`.
- Não crie contas nem digite senhas pelo Edson, mesmo que ele peça. Ele digita senhas e chaves.
- Peça autorização antes de cada mudança em:
  - configurações de Auth e de segurança do Supabase;
  - DNS do domínio;
  - configurações do repositório no GitHub.
- Fotos com pessoas e qualquer lista de participantes exigem consentimento (LGPD).
- Todo link que vem de dados (painel ou `conteudo.js`) passa por `U.linkSeguro` antes de virar `href`:
  só passam `http`/`https` ou caminhos do próprio site. Use `C.linkExterno` ou `C.botaoBaixar`, que já
  fazem isso. O painel recusa salvar `link` ou `material` que não comecem com `https://`.
- O `index.html` tem uma CSP (Content Security Policy) em `<meta>`. Se entrar um serviço novo (outro
  CDN, outro projeto do Supabase, outro serviço de formulário), acrescente o endereço nela, ou o navegador
  bloqueia.
- O `supabase-js` é carregado com `integrity` (SRI). Ao trocar de versão, gere o hash novo:
  `curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A`.

## O que é o site

- Página única estática no **GitHub Pages**, branch `main`, domínio **lapac.space** (arquivo `CNAME`).
- Não tem build, framework nem `npm`: é HTML, CSS e JavaScript puro.
- O JavaScript segue o estilo antigo do projeto (`var`, `function`, IIFE). Mantenha esse estilo.
- As rotas usam `#` no endereço:
  - abas: `#artigos`, `#profissionais`, `#populacao`, `#contato`, `#atividades`, `#login`;
  - página de uma aula: `#aula-<id>`.
- `artigos.html`, `profissionais.html` etc. só redirecionam endereços antigos para a aba certa.

### Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | o site inteiro; carrega os scripts na ordem abaixo |
| `js/conteudo.js` | `window.LAPAC`: configurações da liga e conteúdo base (aulas, produções, atividades) |
| `js/util.js` | `App.util` (`U`): utilidades, datas, mini-markdown, busca sem acento (`U.semAcento`, `U.termosBusca`, `U.combina`, `U.destacar`) |
| `js/armazem.js` | `App.armazem` (`A`): leitura e gravação de dados, login, envio de arquivos |
| `js/componentes.js` | `App.comp` (`C`): `App.SECOES`, cartões, ficha de produção, barra de busca (`C.busca`) |
| `js/paginas.js` | `App.paginas`: cada aba e a página da aula |
| `js/painel.js` | `App.painel`: aba Login/Painel (entrar, primeiro acesso, senha, formulários de edição) |
| `js/app.js` | menu, rotas, rodapé; liga tudo |
| `css/estilo.css` | cores (variáveis em `:root`, com modo escuro), letras e layout |
| `img/` | logo, foto do orientador, fotos das atividades, capas das aulas (`img/aulas/`) |
| `supabase/` | SQL do servidor, passo a passo (`COMO-CONFIGURAR.md`), modelos de e-mail |
| `ferramentas/versao.py` | marca a versão dos arquivos no `index.html` (ver "Publicar") |

### Duas camadas de conteúdo

1. **Base:** `js/conteudo.js`, que vem com o site.
2. **Painel:** o que os diretores publicam pela aba Login. Fica na tabela `conteudos` do Supabase.

Como `A.itens(colecao)` junta as duas:

- As coleções são `aulas`, `producoes` e `atividades`.
- Itens com o mesmo `id` ficam com a versão do painel.
- Um item do painel com `{ removido: true }` esconde o item base de mesmo `id`.
- Itens com `status: "rascunho"` só aparecem no painel.

`A.modo` diz de onde vêm os dados do painel:

- `supabase`: o site publicado;
- `local`: demonstração, que salva só no navegador;
- `base`: sem servidor, só o conteúdo base;
- `claude`: a prévia antiga dentro do Claude.

### Campos de uma aula

| Campo | O que guarda |
|---|---|
| `id` | identificador da aula |
| `titulo` | título |
| `publico` | `"profissionais"`, `"populacao"` ou `"ambos"` |
| `area` | área ou tema |
| `status` | `"publicado"` ou `"rascunho"` |
| `data` | `"AAAA-MM-DD"` |
| `ministrante` | quem dá a aula |
| `youtube` | link do vídeo |
| `capa` | `{ src` ou `asset, descricao }` |
| `resumo` | resumo curto |
| `texto` | mini-markdown: `## ` subtítulo, `- ` lista, `1. ` lista numerada, `**negrito**` |
| `material` | material de apoio |
| `referencias` | referências |

- Use os ajudantes `C.publicosDaAula`, `C.aulaServe`, `C.secaoDaAula` e `C.nomePublico` em vez de comparar
  `publico` direto.
- Uma aula `"ambos"` aparece nas duas abas, com a etiqueta "Também para…".

### Seções e cores

Cada aba tem a cor da tampa de um tubo de coleta de sangue, na ordem de coleta. A ordem e as cores fazem
parte da identidade do site; não mude sem o Edson pedir.

| Aba | Tubo | Cor |
|---|---|---|
| Artigos | citrato | azul-claro |
| Para profissionais | soro | vermelho |
| Para a população | soro com gel | amarelo |
| Contato | heparina | verde |
| Atividades | EDTA | roxo |
| Login | fluoreto | cinza |

- As variáveis ficam em `css/estilo.css` (`--tubo-citrato`, `--tubo-soro`, `--tubo-gel`, `--tubo-heparina`,
  `--tubo-edta`, `--tubo-fluoreto`) e a lista em `App.SECOES`.
- Com um diretor conectado, a aba Login aparece como "Painel" (`C.nomeSecao`) e o menu mostra "Sair".
- Cor principal: carmim `#8C1D2C`.
- Fontes:
  - Source Serif 4 nos títulos;
  - Atkinson Hyperlegible no texto;
  - IBM Plex Mono nos rótulos.

## Servidor (Supabase)

### Projeto

- Projeto "LAPAC SITE", ref `xrzctbqxlcfwatgddvwr`, plano Free, região us-east-1.
- Cliente: `supabase-js` 2.45.4 (UMD, pelo jsDelivr), criado sem opções, então no fluxo padrão
  (implicit). Os links de e-mail voltam com `#access_token=…` no endereço.

### Tabelas, função e arquivos

| O quê | Detalhe |
|---|---|
| `public.diretores` | `email`, `nome`, `cargo`; pela RLS, cada diretor lê só a própria linha |
| `public.conteudos` | `colecao`, `id`, `dados` (jsonb), `atualizado_em`: a camada do painel |
| `eh_diretor()` | função que as regras usam para liberar a escrita |
| bucket `arquivos` | público, com as pastas `fotos/` e `materiais/` |

As fotos das atividades ficam guardadas assim:

- O arquivo vai para `arquivos/fotos/`.
- A descrição fica em `conteudos.dados.fotos[].descricao`.
- As fotos do IV SIMED estão no repositório, em `img/atividades/`.

### Primeiro acesso dos diretores

O SQL está em `supabase/primeiro-acesso.sql`.

- O schema `privado` não é exposto pela API. A tabela `privado.convite` guarda só o hash bcrypt da senha
  padrão (`pgcrypto`, no schema `extensions`).
- O trigger `conferir_convite` (BEFORE INSERT em `auth.users`) recusa o cadastro sem a senha padrão
  correta.
- O trigger `diretor_confirmado` (AFTER UPDATE) cria a linha em `diretores` quando o e-mail é confirmado.
- Para desligar o primeiro acesso, depois que todos os diretores se cadastrarem, rode
  `select privado.definir_convite(null);`.
- "Add user" no painel do Supabase é bloqueado pelo trigger. Diretores entram pelo primeiro acesso do
  site.

### Configuração de Auth

- Cadastros ligados, confirmação de e-mail ligada, Site URL `https://lapac.space`.
- O SMTP padrão do Supabase só entrega para membros da organização, no máximo 2 por hora.
- Os modelos de e-mail só ficam editáveis com SMTP próprio. O plano é usar o Resend. Os modelos em
  português estão prontos em `supabase/modelos-de-email.md`.

### Mudanças no banco

- Escreva o SQL em um arquivo dentro de `supabase/`, idempotente (`create or replace`,
  `if not exists`).
- O Edson roda o SQL no SQL Editor do Supabase.

## Fluxo do login (`js/painel.js` + `js/armazem.js`)

### Entrar

E-mail e senha.

### Esqueci minha senha

1. O site envia um link por e-mail.
2. O link volta com `type=recovery`.
3. O site abre a tela de trocar a senha.

### Primeiro acesso, em 3 etapas

1. E-mail e senha padrão.
2. Nome, cargo e senha nova digitada duas vezes. A senha precisa ter pelo menos 8 caracteres e ser
   diferente da senha padrão.
3. Aviso para confirmar pelo **link** enviado por e-mail.

- Por decisão do Edson **não há tela de código**: a confirmação é só pelo link.
- Os campos de senha têm botão Mostrar/Ocultar (`aria-pressed`).

### Volta dos links de e-mail

- `A.retornoEmail` lê o `#access_token` ou o erro antes do cliente do Supabase.
- `lerRota` em `app.js` manda esses endereços para a aba Login.
- `limparEnderecoDoEmail()` limpa o endereço depois.

## Formulário de contato (Web3Forms)

- A aba Contato tem um formulário com nome, e-mail, assunto (texto livre) e mensagem. O envio passa pelo
  Web3Forms, que entrega a mensagem em `lapacpucgoias@gmail.com`.
- A chave fica em `contato.formularioChave`, em `js/conteudo.js`. Ela é pública de propósito: só serve
  para mandar mensagens a esse e-mail. A conta do Web3Forms é do e-mail da liga.
- O e-mail chega com o assunto "Site da LAPAC: <assunto>", e o "Responder" do Gmail vai para quem
  escreveu (`replyto`).
- O campo invisível `botcheck` barra robôs de spam. O plano grátis entrega até 250 mensagens por mês.
- O cartão de e-mail continua com o botão "Copiar e-mail" para quem prefere escrever por fora.
- Para testar sem mandar e-mail de verdade, troque `window.fetch` por uma função falsa que responda
  `{ success: true }` para `api.web3forms.com`.

## Domínio

- `lapac.space` é registrado na Whois.com, com DNS em `ns1`–`ns4.whois.com`.
- Os registros apontam para o GitHub Pages, e o domínio é verificado no GitHub por um registro TXT.
- O TTL mínimo aceito pela Whois é 7200.

## Publicar

1. **Antes de cada push**, rode `python3 ferramentas/versao.py`.
   - O GitHub Pages manda o navegador guardar os arquivos por 10 minutos.
   - O script troca o `?v=` dos `.js` e `.css` no `index.html`, para todo mundo receber a versão nova.
2. Commits em português, com uma frase dizendo o que mudou para quem usa o site. Exemplo: "Busca nas
   abas Artigos, Para profissionais e Para a população".
3. Depois do push, o Pages publica em cerca de 1 minuto. Para ver na hora, use Cmd+Shift+R (recarregar
   sem cache).

## Como testar

Não há testes automáticos versionados.

1. Sirva a pasta com `python3 -m http.server`.
2. Confira no navegador (Playwright):
   - largura de computador e de celular (cerca de 390 px);
   - modo claro e modo escuro;
   - console sem erros.
3. Para testar o login sem mexer no Supabase de verdade, troque `window.supabase` por um objeto falso. Ele
   precisa responder:
   - `signUp`, `signInWithPassword`, `verifyOtp`, `resend`, `resetPasswordForEmail`, `updateUser`;
   - `from().select/upsert/delete`;
   - `storage`.

Nunca crie usuários de teste no projeto real.

## Conteúdo e escrita

### Revisão do orientador

- Todo conteúdo de saúde passa pela revisão do orientador, Prof. Paulo Luiz Carvalho Francescantonio,
  antes de ir ao ar.
- Aula ou texto médico novo entra como `status: "rascunho"` até o Edson confirmar a revisão.

### Aulas para a população

- Linguagem simples.
- Todo termo técnico é explicado na primeira vez que aparece.
- Cada cuidado vem com o seu **por quê**.
- Mostre o que acontece se a coleta der errado (veja a aula `coleta-de-urina`).

### Aulas para profissionais

Seguem os capítulos do Robbins e do Bogliolo.

### Regras para todo o conteúdo

- **Veracidade.** Quando algo varia ou é incerto (prazos entre laboratórios, por exemplo), diga isso entre
  parênteses no próprio ponto do texto, em vez de afirmar como regra.
- **Imagens e acessibilidade.**
  - Toda imagem tem descrição: alt e `descricao` da capa ou da foto.
  - As capas de aula são SVG em `img/aulas/`, 1600×900, na paleta do site.
  - Mantenha contraste, foco visível e rótulos `aria`.

## Pendências (outubro de 2026)

- [ ] Serviço de envio de e-mails (Resend) com o domínio `lapac.space`:
  - o Edson cria a conta e cola a chave SMTP no Supabase;
  - os registros de DNS vão na Whois;
  - depois disso, aplicar os modelos de `supabase/modelos-de-email.md`.
- [x] Marcar "Enforce HTTPS" no GitHub Pages (feito em 18/10/2026: http redireciona para https).
- [ ] Completar `diretoria` em `js/conteudo.js`, só com nome e cargo.
- [ ] Artigos: o Edson anexa o PDF do resumo sobre LTA (leishmaniose tegumentar americana) pelo painel e
      apaga a entrada duplicada.
- [ ] Desligar o primeiro acesso quando todos os diretores tiverem conta.
- [ ] Segurança (revisão de outubro de 2026):
  - o Edson roda `supabase/limites-arquivos.sql` (só JPEG e PDF, até 45 MB por arquivo);
  - Authentication → senha com no mínimo 8 caracteres também no servidor;
  - GitHub → Settings → Emails → "Keep my email addresses private";
  - ver no Web3Forms se dá para ligar verificação anti-robô ou limitar ao domínio `lapac.space`;
  - definir como tirar o acesso de um diretor que sai da liga (apagar da tabela `diretores` e a conta em
    Authentication → Users).
- [ ] Decidir se o repositório continua público.
  - No GitHub Free, o Pages só funciona com repositório público.
  - A alternativa é hospedar em outro serviço, por exemplo o Cloudflare Pages.
