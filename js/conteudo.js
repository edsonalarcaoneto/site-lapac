/*
  CONTEÚDO BASE DO SITE DA LAPAC
  ------------------------------
  Configurações da liga e o conteúdo que já vem com o site.
  O que os diretores publicarem pela aba Login se soma a isto
  (e, quando editam um item daqui, a versão deles passa a valer).

  Regras simples para editar à mão:
  - Textos ficam entre aspas "assim".
  - Cada item de uma lista termina com vírgula, menos o último.
  - Datas no formato "AAAA-MM-DD" (ex.: "2026-10-30"). O site mostra 30/10/2026.
  - status: "publicado" aparece no site; "rascunho" só aparece na aba Login.
*/

window.LAPAC = {

  liga: {
    sigla: "LAPAC",
    nome: "Liga Acadêmica de Patologia Clínica",
    instituicao: "PUC Goiás",
    lema: "Da coleta ao laudo.",
    // Texto curto sobre quem é a LAPAC
    sobre:
      "A LAPAC é a Liga Acadêmica de Patologia Clínica da PUC Goiás. Reunimos estudantes de Medicina " +
      "interessados na medicina laboratorial, a área que transforma uma amostra de sangue, urina ou outro " +
      "material biológico em informação para o cuidado do paciente. Produzimos aulas e materiais de estudo " +
      "para estudantes e profissionais de saúde e conteúdos de educação em saúde para a população."
  },

  contato: {
    email: "lapacpucgoias@gmail.com",
    instagram: "https://www.instagram.com/lapac_pucgo/",
    instagramUsuario: "@lapac_pucgo",
    youtube: "https://www.youtube.com/@lapacpucgoias",
    youtubeUsuario: "@lapacpucgoias",
    // Bloco "Onde estamos" da aba Contato
    onde: "Área I - Escola de Ciências Médicas e da Vida da PUC Goiás",
    cidade: "Goiânia, GO",
    // Formulário da aba Contato: o Web3Forms entrega as mensagens no e-mail da liga.
    // A chave é pública por natureza (só serve para enviar mensagens a esse e-mail).
    formularioChave: "b4b95ac5-3971-4c9d-a74b-95e78dae1160"
  },

  /*
    SERVIDOR DO LOGIN (Supabase)
    Dados do projeto "LAPAC SITE" no Supabase (Settings → API Keys).
    A chave "publishable" é pública por natureza: quem protege os dados são as regras
    do arquivo supabase/configurar.sql. Nunca coloque aqui a chave secreta (secret / service_role).
  */
  servidor: {
    supabaseUrl: "https://xrzctbqxlcfwatgddvwr.supabase.co",
    supabaseChave: "sb_publishable_tCCW652fNZkYgrdHAOYgow_9jXmuoMA"
  },

  painel: {
    demonstracao: false   // true = mostra o modo demonstração quando o servidor não carrega
  },

  // Usado no login de demonstração da aba Login. Complete com os demais diretores.
  diretoria: [
    { nome: "Edson Alarcão", cargo: "Diretor de Extensão" }
  ],

  orientador: {
    nome: "Prof. Paulo Luiz Carvalho Francescantonio",
    papel: "Orientador da LAPAC",
    foto: "img/orientador.jpg",
    // Resumo feito a partir do Currículo Lattes (texto informado pelo autor).
    resumo: [
      "Médico especialista em Patologia Clínica/Medicina Laboratorial pela SBPC/ML (Sociedade Brasileira de " +
      "Patologia Clínica/Medicina Laboratorial), biomédico e mestre em Ciências Ambientais e Saúde. É professor " +
      "de Interpretação dos Exames Laboratoriais e de Patologia Clínica/Medicina Laboratorial no curso de " +
      "Medicina da PUC Goiás, que já coordenou.",
      "Coordenou os Consensos Brasileiros para padronização dos laudos de FAN (fator antinuclear, exame usado " +
      "na investigação de doenças autoimunes) em células HEp-2. Em 2014, a proposta brasileira se tornou " +
      "padronização internacional, e hoje ele é um dos representantes do Brasil no consenso internacional sobre " +
      "o tema. É membro titular da Academia Goiana de Medicina e dá nome ao Centro Acadêmico Paulo " +
      "Francescantonio (CAPF)."
    ],
    lattes: "http://lattes.cnpq.br/7355650780047625"
  },

  // Sugestões que aparecem no campo "Área" do formulário de aula
  areas: {
    profissionais: ["Patologia geral", "Patologia dos sistemas", "Hematologia", "Bioquímica clínica",
                    "Urinálise", "Microbiologia clínica", "Imunologia clínica"],
    populacao: ["Antes do exame", "Exames de sangue", "Exames de urina", "Exames de fezes", "Entendendo o laudo"]
  },

  // Temas mostrados como "em preparação" enquanto as seções não têm aulas publicadas
  emPreparacao: {
    profissionais: ["Lesão e morte celular", "Inflamação aguda e crônica", "Reparo tecidual",
                    "Distúrbios hemodinâmicos", "Hemograma: do tubo ao laudo"],
    populacao: ["Jejum: quando precisa e quando não precisa", "Urina de 24 horas", "Coleta de fezes",
                "Biotina e exames de tireoide", "Exercício na véspera do exame"]
  },

  /*
    AULAS
    publico: "profissionais" ou "populacao"
    youtube: link completo do vídeo ou só o código
    texto: parágrafos separados por linha em branco; "## " abre um subtítulo;
           "- " faz uma lista; "1. " faz uma lista numerada; **assim** fica em negrito.
  */
  aulas: [
    {
      id: "coleta-de-urina",
      titulo: "Como coletar urina para exame",
      publico: "populacao",
      area: "Exames de urina",
      status: "publicado",
      data: "2026-10-17",
      ministrante: "",
      youtube: "",
      capa: {
        src: "img/aulas/coleta-de-urina.svg",
        descricao: "Ilustração: o primeiro e o último jato de urina são descartados e o jato do meio é coletado no frasco estéril, que deve chegar ao laboratório em até 1 hora."
      },
      resumo: "O passo a passo da coleta, o porquê de cada cuidado e o que acontece com o resultado quando a coleta dá errado.",
      texto: [
        "Esse jeito de coletar serve para dois exames. O exame de urina comum (também chamado de urina tipo 1, EAS ou sumário de urina) avalia o aspecto, as substâncias e as células da urina. A urocultura procura bactérias que estejam causando infecção.",
        "",
        "## Antes de começar",
        "- Use o frasco esterilizado do laboratório ou da farmácia. Pote de casa, mesmo lavado, pode ter bactérias e restos de comida ou sabão.",
        "- Prefira a primeira urina da manhã, ou fique pelo menos 2 horas sem urinar antes da coleta. A urina que passa mais tempo na bexiga fica mais concentrada, e o exame enxerga melhor o que há nela. (O tempo mínimo varia entre laboratórios; siga o que o seu pedir.)",
        "- Não beba muita água só para conseguir urinar. A urina fica diluída e algumas alterações deixam de aparecer.",
        "- Se estiver menstruada, avise o laboratório. O sangue da menstruação aparece no exame como se viesse do rim ou da bexiga, e o mais comum é esperar a menstruação acabar.",
        "- Se estiver tomando antibiótico, avise também. O antibiótico pode esconder uma infecção na urocultura.",
        "",
        "## Passo a passo",
        "1. Lave as mãos.",
        "2. Lave a região íntima com água e sabão, enxágue bem e seque. Mulheres: afaste os lábios e lave da frente para trás. Homens: puxe a pele do pênis para trás e lave a ponta. **Por quê:** a pele tem bactérias normais que não causam doença, mas que crescem na cultura se entrarem no frasco.",
        "3. Comece a urinar no vaso e deixe o primeiro jato ir embora. **Por quê:** o começo do canal da urina tem bactérias normalmente, e o primeiro jato lava esse caminho.",
        "4. Sem interromper o xixi, coloque o frasco e colete o jato do meio, até a marca indicada.",
        "5. Termine de urinar no vaso.",
        "6. Feche bem o frasco sem tocar na parte de dentro dele nem da tampa, e escreva seu nome.",
        "7. Leve ao laboratório o quanto antes, de preferência em até 1 hora. Se não der, guarde na geladeira (nunca no congelador) e pergunte ao laboratório o prazo. (Os prazos variam entre laboratórios e entre os dois exames.)",
        "",
        "## O que acontece se a coleta der errado",
        "- **Sem lavar ou sem descartar o primeiro jato:** bactérias de fora entram no frasco. A cultura pode dar positiva sem haver infecção, o que pode levar a um antibiótico desnecessário, ou vir como \"contaminada\", e aí o exame precisa ser repetido.",
        "- **Secreção vaginal no frasco:** traz glóbulos brancos e células da vagina, e o exame parece mostrar uma inflamação na urina que não existe.",
        "- **Sangue da menstruação:** aparece como sangue na urina e pode levar a uma investigação desnecessária.",
        "- **Demora fora da geladeira:** as bactérias se multiplicam dentro do frasco e a cultura fica falsamente alta. Além disso, a urina muda de acidez com o tempo, algumas estruturas que o laboratório procura se desfazem, e as bactérias consomem açúcar presente na urina, o que pode esconder uma alteração real."
      ].join("\n"),
      material: "",
      referencias: ""
    }
  ],

  /*
    PRODUÇÕES CIENTÍFICAS (aba Artigos)
    tipo: "Artigo", "Resumo em congresso", "Pôster" ou "Apresentação oral"
  */
  producoes: [
  ],

  /*
    ATIVIDADES
    tipo: "Extensão", "Ensino", "Pesquisa", "Evento científico" ou "Outra"
  */
  atividades: [
    {
      id: "iv-simed",
      titulo: "IV SIMED",
      tipo: "Evento científico",
      status: "publicado",
      data: "2026-09-21",
      local: "PUC Goiás",
      texto:
        "Participar do IV SIMED representou uma oportunidade única de atualização e troca de experiências. " +
        "O evento proporcionou contato com discussões atuais, diferentes perspectivas e um ambiente favorável " +
        "ao diálogo entre estudantes, profissionais e pesquisadores. O aprendizado construído de forma coletiva " +
        "reforça o compromisso com uma formação crítica, baseada em evidências e no cuidado integral.\n\n" +
        "Nós da LAPAC registramos a nossa gratidão à organização e a todos os envolvidos na realização do IV SIMED.",
      link: "https://www.instagram.com/lapac_pucgo/",
      fotos: [
        { src: "img/atividades/2026-iv-simed/01.jpg", descricao: "Plateia no auditório durante a atividade" },
        { src: "img/atividades/2026-iv-simed/02.jpg", descricao: "Mesa de palestrantes diante da apresentação sobre IgE total e IgE específica" },
        { src: "img/atividades/2026-iv-simed/03.jpg", descricao: "Palestrantes à mesa durante a apresentação sobre alergia no prontuário" },
        { src: "img/atividades/2026-iv-simed/04.jpg", descricao: "Palestrante ao púlpito" },
        { src: "img/atividades/2026-iv-simed/05.jpg", descricao: "Vista do auditório a partir do fundo da sala" },
        { src: "img/atividades/2026-iv-simed/06.jpg", descricao: "Mesa do lanche depois da atividade" },
        { src: "img/atividades/2026-iv-simed/07.jpg", descricao: "Três participantes posam para foto no auditório" },
        { src: "img/atividades/2026-iv-simed/08.jpg", descricao: "Foto em grupo ao fim da atividade" },
        { src: "img/atividades/2026-iv-simed/09.jpg", descricao: "Outra foto em grupo ao fim da atividade" },
        { src: "img/atividades/2026-iv-simed/10.jpg", descricao: "Participantes posam para foto no auditório" }
      ]
    }
  ]
};
