# Site da LAPAC

Site estático de página única: arquivos HTML, CSS, JavaScript e imagens. As abas trocam de conteúdo
dentro da mesma página (endereços com #, como `index.html#artigos`), sem abrir outra aba do navegador.

## Como ver no computador

Dê dois cliques em `index.html`.

## O que tem em cada pasta

- `index.html`: o site inteiro.
- `js/conteudo.js`: configurações da liga e o conteúdo que já vem com o site (texto da liga, contatos,
  orientador, diretoria, temas em preparação, aulas, artigos, atividades).
- `js/util.js`, `js/armazem.js`, `js/componentes.js`, `js/paginas.js`, `js/painel.js`, `js/app.js`:
  o funcionamento do site. Não precisa mexer para atualizar conteúdo.
- `css/estilo.css`: cores, letras e layout.
- `img/`: logo, foto do orientador e fotos das atividades.
- `supabase/`: configuração do servidor do login (regras de acesso e passo a passo).
- `artigos.html`, `profissionais.html` etc.: só redirecionam endereços antigos para a aba certa.

## As cores

Cada aba tem a cor de uma tampa de tubo de coleta de sangue, e o menu segue a ordem de coleta:
Artigos (azul-claro), Para profissionais (vermelho), Para a população (amarelo), Contato (verde),
Atividades (roxo), Login (cinza).

## Aba Login

Os diretores entram e publicam aulas (escolhendo profissionais de saúde ou população), artigos e atividades,
com opção de rascunho. O que é publicado pelo painel se soma ao `js/conteudo.js`.

- **Aberto no computador:** modo demonstração. Salva só no navegador de quem está usando.
- **Na prévia do Claude:** funciona de verdade para quem tem acesso de Editor à prévia.
- **No site publicado, com o Supabase configurado:** login de verdade, com e-mail e senha de cada diretor.
  O passo a passo está em `supabase/COMO-CONFIGURAR.md`; as regras de acesso, em `supabase/configurar.sql`.
- **No site publicado, sem servidor:** coloque `demonstracao: false` no bloco `painel` de `js/conteudo.js`,
  para os visitantes não verem o modo demonstração.

## Pendências

- Preencher o e-mail da liga e o link do canal do YouTube em `js/conteudo.js`.
- Confirmar data e local da última atividade.
- Revisar o texto "Quem somos", o resumo do orientador e a aula de coleta de urina (está como rascunho).
- Completar a lista da diretoria em `js/conteudo.js`.
- Configurar o Supabase e preencher o bloco `servidor` em `js/conteudo.js`.
