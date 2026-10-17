/* As páginas públicas do site. Cada função devolve o conteúdo da página. */
(function () {
  "use strict";
  var App = window.LAPACApp;
  var U = App.util;
  var C = App.comp;
  var A = App.armazem;
  var el = U.el;
  var D = window.LAPAC || {};
  var P = (App.paginas = {});

  function linkInterno(href, texto, classe) {
    return el("a", { href: href, class: classe || "link-seta", text: texto });
  }

  function bloco(rotulo, conteudo, classe) {
    return el("section", { class: "bloco" + (classe ? " " + classe : "") }, [
      el("h2", { class: "rotulo", text: rotulo })
    ].concat(conteudo));
  }

  function chipsFiltro(opcoes, atual, aoEscolher) {
    return el("div", { class: "filtros", role: "group", "aria-label": "Filtrar por tipo" }, opcoes.map(function (o) {
      return el("button", {
        type: "button",
        class: "filtro",
        "aria-pressed": o === atual ? "true" : "false",
        text: o,
        onclick: function () { aoEscolher(o); }
      });
    }));
  }

  function temasEmPreparacao(publico) {
    var temas = (D.emPreparacao && D.emPreparacao[publico]) || [];
    if (!temas.length) return null;
    return el("div", { class: "preparo" }, [
      el("p", { class: "preparo__titulo", text: "Temas em preparação" }),
      el("ul", { class: "preparo__lista" }, temas.map(function (t) { return el("li", { text: t }); }))
    ]);
  }

  /* ---------- Início ---------- */
  P.inicio = function () {
    var liga = D.liga || {};
    var aulas = A.itens("aulas");
    var ultima = aulas[0];

    var abertura = el("section", { class: "abertura" }, [
      el("div", { class: "envoltorio abertura__grade" }, [
        el("div", { class: "abertura__texto" }, [
          el("p", { class: "heroi__olho", text: (liga.nome || "") + " · " + (liga.instituicao || "") }),
          el("h1", { class: "abertura__titulo", text: liga.lema || "Da coleta ao laudo." }),
          el("p", { class: "abertura__convite", text: "Escolha um tubo para começar." })
        ]),
        C.estante()
      ])
    ]);

    /* Última aula */
    var conteudoAula = ultima
      ? [C.cartaoAula(ultima)]
      : [C.emBreve({ titulo: "A primeira aula está em produção", texto: "Quando for publicada, ela aparece aqui com o vídeo e o material de apoio.", selo: "Em gravação" })];
    var portas = el("nav", { class: "portas", "aria-label": "Todas as aulas" }, [
      el("p", { class: "portas__titulo", text: "Todas as aulas" }),
      linkInterno("#profissionais", "Para profissionais de saúde"),
      linkInterno("#populacao", "Para a população")
    ]);
    var blocoAula = bloco("Última aula", [el("div", { class: "bloco__miolo" }, conteudoAula), portas], "bloco--aula");

    /* Orientador */
    var o = D.orientador || {};
    var resumo = Array.isArray(o.resumo) ? o.resumo : [o.resumo || ""];
    var blocoOrientador = bloco("Orientador", [
      el("div", { class: "orientador" }, [
        o.foto ? el("img", { class: "orientador__foto", src: o.foto, alt: "Foto de " + o.nome, width: "540", height: "720" }) : null,
        el("div", { class: "orientador__texto" }, [
          el("h3", { class: "titulo-item", text: o.nome }),
          el("p", { class: "orientador__papel", text: o.papel }),
          el("div", { class: "texto-corrido" }, resumo.map(function (t) { return el("p", { text: t }); })),
          o.lattes ? C.linkExterno(o.lattes, "Currículo Lattes") : null
        ])
      ])
    ]);

    /* Produções */
    var prods = A.itens("producoes").slice(0, 2);
    var blocoProd = bloco("Produções científicas recentes", [
      prods.length
        ? el("div", { class: "grade-fichas grade-fichas--duas" }, prods.map(C.fichaProducao))
        : C.emBreve({ titulo: "Em preparação", texto: "Os primeiros trabalhos da liga, como resumos, artigos e apresentações em congressos, vão aparecer aqui.", icone: C.SVG.doc, selo: "Em breve", compacto: true }),
      linkInterno("#artigos", "Ver todos os artigos")
    ]);

    /* Atividade */
    var at = A.itens("atividades")[0];
    var blocoAt = bloco("Última atividade", [
      at ? C.atividade(at) : C.emBreve({ titulo: "Em breve", texto: "As atividades da liga vão aparecer aqui.", icone: C.SVG.foto }),
      linkInterno("#atividades", "Ver todas as atividades")
    ]);

    return el("div", { class: "pagina" }, [
      abertura,
      el("div", { class: "envoltorio inicio" }, [
        el("section", { class: "bloco apresentacao", "aria-labelledby": "t-sobre" }, [
          el("h2", { class: "rotulo", id: "t-sobre", text: "Quem somos" }),
          el("p", { class: "apresentacao__texto", text: liga.sobre || "" })
        ]),
        el("div", { class: "grade-dupla" }, [blocoAula, blocoOrientador]),
        blocoProd,
        blocoAt
      ])
    ]);
  };

  /* ---------- Aulas (profissionais ou população) ---------- */
  function paginaAulas(publico) {
    var secao = App.secao(publico);
    var aulas = A.itens("aulas").filter(function (a) { return (a.publico || "profissionais") === publico; });
    var corpo = el("div", { class: "envoltorio pagina-corpo" });

    if (!aulas.length) {
      corpo.appendChild(C.emBreve({
        titulo: publico === "populacao" ? "Os primeiros conteúdos chegam em breve" : "A primeira aula chega em breve",
        texto: publico === "populacao"
          ? "Os primeiros conteúdos estão sendo preparados. Quando forem publicados, aparecem aqui com o vídeo e o passo a passo."
          : "As aulas estão sendo gravadas. Quando a primeira for publicada, ela aparece aqui com o vídeo e o material de apoio.",
        selo: "Em gravação",
        extra: temasEmPreparacao(publico)
      }));
    } else {
      var grupos = {};
      var ordem = [];
      aulas.forEach(function (a) {
        var g = a.area || "Outros temas";
        if (!grupos[g]) { grupos[g] = []; ordem.push(g); }
        grupos[g].push(a);
      });
      ordem.forEach(function (g) {
        corpo.appendChild(el("section", { class: "grupo" }, [
          el("h2", { class: "rotulo", text: g }),
          el("div", { class: "grade-cartoes" }, grupos[g].map(C.cartaoAula))
        ]));
      });
    }

    corpo.appendChild(el("aside", { class: "sugestao" }, [
      el("div", null, [
        el("p", { class: "sugestao__titulo", text: "Quer ver um tema aqui?" }),
        el("p", { class: "texto-suave", text: "A liga recebe sugestões de tema pelo Instagram e pelo e-mail." })
      ]),
      linkInterno("#contato", "Sugerir um tema", "botao botao--contorno")
    ]));

    return el("div", { class: "pagina" }, [C.cabecalhoPagina(secao), corpo]);
  }
  P.profissionais = function () { return paginaAulas("profissionais"); };
  P.populacao = function () { return paginaAulas("populacao"); };

  /* ---------- Página de uma aula ---------- */
  function podeIncorporarVideo() {
    try { return window.top === window && /^https?:$/.test(location.protocol); } catch (e) { return false; }
  }

  P.aula = function (id) {
    var a = A.item("aulas", id);
    var ehDiretor = !!A.sessao;
    if (!a || ((a.status || "publicado") !== "publicado" && !ehDiretor)) return P.naoEncontrada();
    var publico = a.publico === "populacao" ? "populacao" : "profissionais";
    var secao = App.secao(publico);
    var yt = U.youtubeId(a.youtube);

    var trilha = el("p", { class: "heroi__olho" }, [
      el("span", { class: "heroi__ponto", "aria-hidden": "true" }),
      el("span", null, [el("a", { href: "#" + publico, text: secao.nome }), a.area ? " / " + a.area : ""])
    ]);
    var meta = [U.dataBR(a.data), a.ministrante ? "com " + a.ministrante : ""].filter(Boolean).join(" · ");

    var video;
    if (yt && podeIncorporarVideo()) {
      video = el("div", { class: "video" }, [
        el("iframe", {
          src: "https://www.youtube-nocookie.com/embed/" + yt,
          title: "Vídeo: " + a.titulo,
          allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen",
          allowfullscreen: true,
          loading: "lazy"
        })
      ]);
    } else if (yt) {
      video = el("a", { class: "video video--link", href: "https://www.youtube.com/watch?v=" + yt, target: "_blank", rel: "noopener" }, [
        C.tela({ youtube: yt, selo: "Assistir no YouTube" })
      ]);
    } else {
      video = el("div", { class: "video" }, [C.tela({ selo: "Vídeo em gravação" })]);
    }

    var principal = el("article", { class: "aula-detalhe__principal" }, [
      video,
      a.texto ? el("div", { class: "bloco aula-detalhe__texto" }, [U.renderTexto(a.texto)]) : null,
      a.referencias ? el("section", { class: "bloco referencias" }, [
        el("h2", { class: "rotulo", text: "Referências" }),
        el("ol", null, String(a.referencias).split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) {
          return el("li", { text: l.trim() });
        }))
      ]) : null
    ]);

    var endMaterial = A.endereco(a.materialArquivo) || a.material || "";
    var outras = A.itens("aulas").filter(function (x) { return x.id !== a.id && (x.publico || "profissionais") === publico; }).slice(0, 4);
    var lado = el("aside", { class: "aula-detalhe__lado" }, [
      el("section", { class: "bloco bloco--compacto" }, [
        el("h2", { class: "rotulo", text: "Material de apoio" }),
        endMaterial
          ? el("a", { class: "botao", href: endMaterial, target: "_blank", rel: "noopener", text: "Abrir o material (PDF)" })
          : el("p", { class: "texto-suave", text: "O material desta aula chega em breve." })
      ]),
      el("section", { class: "bloco bloco--compacto" }, [
        el("h2", { class: "rotulo", text: "Ficha da aula" }),
        el("dl", { class: "ficha-aula" }, [
          el("div", null, [el("dt", { text: "Público" }), el("dd", { text: publico === "populacao" ? "População" : "Profissionais de saúde" })]),
          a.area ? el("div", null, [el("dt", { text: "Área" }), el("dd", { text: a.area })]) : null,
          a.data ? el("div", null, [el("dt", { text: "Publicada em" }), el("dd", { text: U.dataBR(a.data) })]) : null,
          a.ministrante ? el("div", null, [el("dt", { text: "Ministrante" }), el("dd", { text: a.ministrante })]) : null
        ])
      ]),
      outras.length ? el("section", { class: "bloco bloco--compacto" }, [
        el("h2", { class: "rotulo", text: "Outras aulas" }),
        el("ul", { class: "lista-outras" }, outras.map(function (x) {
          return el("li", null, [el("a", { href: "#aula-" + x.id, text: x.titulo })]);
        }))
      ]) : null
    ]);

    var corpo = el("div", { class: "envoltorio pagina-corpo" }, [
      (a.status || "publicado") !== "publicado"
        ? el("p", { class: "faixa-rascunho", text: "Rascunho: esta aula só aparece para os diretores logados até ser publicada." })
        : null,
      el("div", { class: "aula-detalhe" }, [principal, lado]),
      linkInterno("#" + publico, "Voltar para " + secao.nome.toLowerCase())
    ]);

    return el("div", { class: "pagina" }, [
      C.cabecalhoPagina(secao, {
        trilha: trilha,
        titulo: a.titulo,
        descricao: a.resumo || null,
        meta: meta ? el("p", { class: "heroi__meta", text: meta }) : null,
        textoTubo: a.area || secao.nome
      }),
      corpo
    ]);
  };

  /* ---------- Artigos ---------- */
  P.artigos = function () {
    var secao = App.secao("artigos");
    var todos = A.itens("producoes");
    var corpo = el("div", { class: "envoltorio pagina-corpo" });
    if (!todos.length) {
      corpo.appendChild(C.emBreve({
        titulo: "As primeiras produções chegam em breve",
        texto: "Artigos, resumos em congresso, pôsteres e apresentações dos membros da liga vão ficar reunidos aqui.",
        icone: C.SVG.doc,
        selo: "Em preparação"
      }));
    } else {
      var tipos = ["Todos"];
      todos.forEach(function (p) { if (p.tipo && tipos.indexOf(p.tipo) < 0) tipos.push(p.tipo); });
      var grade = el("div", { class: "grade-fichas" });
      var filtros = el("div");
      function desenhar(tipo) {
        grade.replaceChildren.apply(grade, todos.filter(function (p) { return tipo === "Todos" || p.tipo === tipo; }).map(C.fichaProducao));
        filtros.replaceChildren(tipos.length > 2 ? chipsFiltro(tipos, tipo, desenhar) : el("span"));
      }
      desenhar("Todos");
      corpo.appendChild(filtros);
      corpo.appendChild(grade);
    }
    return el("div", { class: "pagina" }, [C.cabecalhoPagina(secao), corpo]);
  };

  /* ---------- Atividades ---------- */
  P.atividades = function () {
    var secao = App.secao("atividades");
    var todas = A.itens("atividades");
    var corpo = el("div", { class: "envoltorio pagina-corpo" });
    if (!todas.length) {
      corpo.appendChild(C.emBreve({ titulo: "As atividades chegam em breve", texto: "Eventos, ações de extensão e aulas abertas da liga vão aparecer aqui, com fotos.", icone: C.SVG.foto }));
    } else {
      var tipos = ["Todas"];
      todas.forEach(function (a) { if (a.tipo && tipos.indexOf(a.tipo) < 0) tipos.push(a.tipo); });
      var lista = el("div", { class: "lista-atividades" });
      var filtros = el("div");
      function desenhar(tipo) {
        lista.replaceChildren.apply(lista, todas.filter(function (a) { return tipo === "Todas" || a.tipo === tipo; }).map(function (a) {
          return el("article", { class: "bloco" }, [C.atividade(a, { nivel: "h2" })]);
        }));
        filtros.replaceChildren(tipos.length > 2 ? chipsFiltro(tipos, tipo, desenhar) : el("span"));
      }
      desenhar("Todas");
      corpo.appendChild(filtros);
      corpo.appendChild(lista);
    }
    return el("div", { class: "pagina" }, [C.cabecalhoPagina(secao), corpo]);
  };

  /* ---------- Contato ---------- */
  P.contato = function () {
    var secao = App.secao("contato");
    var c = D.contato || {};

    var cartaoEmail;
    if (c.email) {
      var campo = el("input", { id: "contato-email", class: "campo campo--leitura", type: "text", readonly: true, value: c.email, "aria-label": "E-mail da liga" });
      cartaoEmail = el("div", { class: "canal" }, [
        el("p", { class: "canal__tipo", text: "E-mail" }),
        campo,
        el("div", { class: "canal__acoes" }, [
          el("a", { class: "botao", href: "mailto:" + c.email, text: "Escrever e-mail" }),
          el("button", { type: "button", class: "botao botao--contorno", text: "Copiar e-mail", onclick: function () { U.copiar(c.email, campo); } })
        ])
      ]);
    } else {
      cartaoEmail = el("div", { class: "canal" }, [
        el("p", { class: "canal__tipo", text: "E-mail" }),
        C.etiqueta("Em breve"),
        el("p", { class: "texto-suave", text: "O e-mail da liga está sendo criado." })
      ]);
    }
    var cartaoInsta = el("div", { class: "canal" }, [
      el("p", { class: "canal__tipo", text: "Instagram" }),
      el("p", { class: "canal__valor", text: c.instagramUsuario || "" }),
      c.instagram ? C.linkExterno(c.instagram, "Abrir o Instagram") : null
    ]);
    var cartaoYt = el("div", { class: "canal" }, [
      el("p", { class: "canal__tipo", text: "YouTube" }),
      c.youtube ? C.linkExterno(c.youtube, "Abrir o canal") : C.etiqueta("Em breve"),
      c.youtube ? null : el("p", { class: "texto-suave", text: "O canal com as aulas está sendo criado." })
    ]);

    var corpo = el("div", { class: "envoltorio pagina-corpo" }, [
      el("div", { class: "canais" }, [cartaoEmail, cartaoInsta, cartaoYt]),
      el("div", { class: "grade-dupla grade-dupla--igual" }, [
        bloco("Fale com a gente sobre", [
          el("ul", { class: "lista-motivos" }, [
            el("li", { text: "Parcerias e convites para ações de extensão" }),
            el("li", { text: "Sugestões de tema para as aulas" }),
            el("li", { text: "Convites para palestras e eventos" }),
            el("li", { text: "Dúvidas sobre a liga" })
          ])
        ]),
        bloco("Onde estamos", [
          el("p", { class: "titulo-item", text: (D.liga && D.liga.instituicao) || "PUC Goiás" }),
          el("p", { class: "texto-suave", text: c.cidade || "" })
        ])
      ])
    ]);
    return el("div", { class: "pagina" }, [C.cabecalhoPagina(secao), corpo]);
  };

  /* ---------- Não encontrada ---------- */
  P.naoEncontrada = function () {
    return el("div", { class: "pagina" }, [
      el("div", { class: "envoltorio pagina-corpo" }, [
        C.emBreve({ titulo: "Página não encontrada", texto: "O conteúdo pode ter saído do ar ou ainda não foi publicado.", midia: false }),
        linkInterno("#inicio", "Voltar para a página inicial")
      ])
    ]);
  };
})();
