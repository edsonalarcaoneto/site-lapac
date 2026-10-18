/* Peças visuais reaproveitadas pelas páginas: tubos, cabeçalhos, cartões, carrossel, estados vazios. */
(function () {
  "use strict";
  var App = window.LAPACApp;
  var U = App.util;
  var el = U.el;
  var C = (App.comp = {});

  /*
    Cada seção do site tem a cor de uma tampa de tubo, na ordem de coleta do sangue (CLSI).
    A ordem do menu é a ordem de coleta.
  */
  App.SECOES = [
    { id: "artigos", nome: "Artigos", titulo: "Artigos e produções",
      descricao: "Artigos, resumos, pôsteres e apresentações dos membros da liga.",
      tampa: "citrato", cor: "Azul-claro", uso: "citrato, coagulação" },
    { id: "profissionais", nome: "Para profissionais", titulo: "Aulas para profissionais de saúde",
      descricao: "Patologia e medicina laboratorial seguindo os capítulos do Robbins e do Bogliolo, com espaço para temas sugeridos por quem assiste.",
      tampa: "soro", cor: "Vermelho", uso: "soro" },
    { id: "populacao", nome: "Para a população", titulo: "Exames sem complicação",
      descricao: "Como se preparar, como coletar e por que cada cuidado importa. Conteúdo para quem vai fazer exames, sem precisar ser da área da saúde.",
      tampa: "gel", cor: "Amarelo", uso: "soro com gel" },
    { id: "contato", nome: "Contato", titulo: "Fale com a liga",
      descricao: "Parcerias, convites para ações, sugestões de tema e dúvidas sobre a liga.",
      tampa: "heparina", cor: "Verde", uso: "heparina" },
    { id: "atividades", nome: "Atividades", titulo: "Atividades da liga",
      descricao: "Eventos, ações de extensão, aulas abertas e tudo o que a liga faz fora do site.",
      tampa: "edta", cor: "Roxo", uso: "EDTA, hemograma" },
    { id: "login", nome: "Login", titulo: "Login",
      descricao: "Acesso dos diretores para publicar aulas, artigos e atividades.",
      tampa: "fluoreto", cor: "Cinza", uso: "fluoreto, glicose" }
  ];
  App.secao = function (id) {
    return App.SECOES.filter(function (s) { return s.id === id; })[0] || null;
  };

  /* Nome mostrado para a seção: com um diretor conectado, a aba Login vira "Painel". */
  C.nomeSecao = function (secao) {
    var conectado = App.armazem && App.armazem.sessao;
    return secao && secao.id === "login" && conectado ? "Painel" : (secao ? secao.nome : "");
  };

  /* ---------- tubo de coleta ---------- */
  C.tubo = function (secao, opcoes) {
    opcoes = opcoes || {};
    var ordem = App.SECOES.indexOf(secao) + 1;
    var tag = opcoes.href ? "a" : "span";
    var attrs = {
      class: "tubo" + (opcoes.tamanho ? " tubo--" + opcoes.tamanho : "") + (secao.tampa === "gel" ? " tubo--gel" : ""),
      style: "--tampa: var(--tubo-" + secao.tampa + ")"
    };
    if (opcoes.href) {
      attrs.href = opcoes.href;
      attrs["aria-label"] = opcoes.texto || C.nomeSecao(secao);
    } else {
      attrs["aria-hidden"] = "true";
    }
    return el(tag, attrs, [
      el("span", { class: "tubo__tampa" }),
      el("span", { class: "tubo__corpo" }, [
        el("span", { class: "tubo__amostra" }),
        el("span", { class: "tubo__etiqueta" }, [
          el("span", { class: "tubo__barras" }),
          el("span", { class: "tubo__texto", text: opcoes.texto || C.nomeSecao(secao) }),
          el("span", { class: "tubo__codigo", text: "LAPAC·0" + ordem })
        ])
      ])
    ]);
  };

  /* Marca os tubos cujo nome não cabe na etiqueta (só neles o código de barras some ao passar o mouse). */
  C.marcarTubosCortados = function (raiz) {
    (raiz || document).querySelectorAll("a.tubo").forEach(function (t) {
      if (t.matches(":hover") || t.matches(":focus-visible")) return; /* etiqueta aberta: mede depois */
      var texto = t.querySelector(".tubo__texto");
      if (!texto) return;
      t.classList.toggle("tubo--cortado", texto.scrollHeight > texto.clientHeight + 1);
    });
  };

  /* Estante com os seis tubos (página inicial). Cada tubo leva a uma seção. */
  C.estante = function () {
    return el("div", { class: "estante" }, [
      el("div", { class: "estante__tubos" }, App.SECOES.map(function (s) {
        return el("div", { class: "estante__vaga" }, [C.tubo(s, { href: "#" + s.id, texto: C.nomeSecao(s) })]);
      }))
    ]);
  };

  /* ---------- cabeçalho de página ---------- */
  C.cabecalhoPagina = function (secao, extra) {
    extra = extra || {};
    var ordem = App.SECOES.indexOf(secao) + 1;
    return el("header", { class: "heroi", style: "--cor-secao: var(--tubo-" + secao.tampa + ")" }, [
      el("div", { class: "envoltorio heroi__grade" }, [
        el("div", { class: "heroi__texto" }, [
          extra.trilha || el("p", { class: "heroi__olho" }, [
            el("span", { class: "heroi__ponto", "aria-hidden": "true" }),
            el("span", { text: "Tubo " + ordem + " de 6 · tampa " + secao.cor.toLowerCase() + " · " + secao.uso })
          ]),
          el("h1", { class: "heroi__titulo", text: extra.titulo || (secao.id === "login" ? C.nomeSecao(secao) : secao.titulo) }),
          extra.descricao === null ? null : el("p", { class: "heroi__descricao", text: extra.descricao || secao.descricao }),
          extra.meta || null
        ]),
        el("div", { class: "heroi__tubo" }, [C.tubo(secao, { tamanho: "grande", texto: extra.textoTubo || C.nomeSecao(secao) })])
      ])
    ]);
  };

  /* ---------- estados vazios ---------- */
  var SVG_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>';
  var SVG_DOC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.5h8.5L19 7v14.5H6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 2.5V7.5h5M9 12h7M9 15.5h7M9 19h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var SVG_FOTO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="M4 17l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  C.SVG = { play: SVG_PLAY, doc: SVG_DOC, foto: SVG_FOTO };

  /* Moldura 16:9 de vídeo, com capa do YouTube quando houver, ou um aviso de "em breve". */
  C.tela = function (opcoes) {
    opcoes = opcoes || {};
    var filhos = [];
    if (opcoes.imagem) {
      filhos.push(el("img", { src: opcoes.imagem, alt: "", loading: "lazy" }));
    } else if (opcoes.youtube) {
      var capa = el("img", { src: "https://img.youtube.com/vi/" + opcoes.youtube + "/hqdefault.jpg", alt: "", loading: "lazy" });
      capa.addEventListener("error", function () { capa.remove(); });
      filhos.push(capa);
    }
    if (!opcoes.imagem || opcoes.youtube) filhos.push(el("span", { class: "tela__icone", html: opcoes.icone || SVG_PLAY }));
    if (opcoes.selo) filhos.push(el("span", { class: "tela__selo", text: opcoes.selo }));
    return el("div", { class: "tela" + (opcoes.youtube ? " tela--video" : "") + (opcoes.imagem ? " tela--capa" : ""), "aria-hidden": "true" }, filhos);
  };

  C.emBreve = function (opcoes) {
    return el("div", { class: "em-breve" + (opcoes.compacto ? " em-breve--compacto" : "") }, [
      opcoes.midia === false ? null : C.tela({ icone: opcoes.icone, selo: opcoes.selo || "Em breve" }),
      el("div", { class: "em-breve__texto" }, [
        el("p", { class: "em-breve__titulo", text: opcoes.titulo }),
        opcoes.texto ? el("p", { class: "texto-suave", text: opcoes.texto }) : null,
        opcoes.extra || null
      ])
    ]);
  };

  C.etiqueta = function (texto, classe) {
    return el("span", { class: "etiqueta" + (classe ? " " + classe : ""), text: texto });
  };

  C.linkExterno = function (href, texto, classe) {
    return el("a", { href: href, target: "_blank", rel: "noopener", class: classe === undefined ? "link-seta" : classe }, [texto]);
  };

  /* ---------- cartões ---------- */
  /* ---------- público das aulas ----------
     a.publico: "profissionais", "populacao" ou "ambos" (aparece nas duas abas). */
  C.publicosDaAula = function (a) {
    var p = (a && a.publico) || "profissionais";
    if (p === "ambos") return ["profissionais", "populacao"];
    return [p === "populacao" ? "populacao" : "profissionais"];
  };
  C.aulaServe = function (a, publico) { return C.publicosDaAula(a).indexOf(publico) >= 0; };
  /* Aba em que a aula está sendo vista: para aulas dos dois públicos, a aba de onde a pessoa veio. */
  C.secaoDaAula = function (a) {
    var ps = C.publicosDaAula(a);
    if (ps.length > 1 && App.ultimaAbaAulas && ps.indexOf(App.ultimaAbaAulas) >= 0) return App.ultimaAbaAulas;
    return ps[0];
  };
  C.nomePublico = function (a) {
    var p = (a && a.publico) || "profissionais";
    return p === "ambos" ? "Profissionais de saúde e população" : p === "populacao" ? "População" : "Profissionais de saúde";
  };

  C.cartaoAula = function (a, termos, publicoPagina, opcoes) {
    termos = Array.isArray(termos) ? termos : [];
    opcoes = opcoes || {};
    var publico = typeof publicoPagina === "string" ? publicoPagina : C.secaoDaAula(a);
    var secao = App.secao(publico);
    var p = (a && a.publico) || "profissionais";
    /* Fora das abas de aulas (página inicial), o cartão diz para quem é a aula. */
    var outroPublico = opcoes.mostrarPublico
      ? (p === "ambos" ? "Profissionais e população" : p === "populacao" ? "Para a população" : "Para profissionais")
      : C.publicosDaAula(a).length > 1
        ? (publico === "populacao" ? "Também para profissionais" : "Também para a população")
        : null;
    var yt = U.youtubeId(a.youtube);
    var meta = [U.dataBR(a.data), a.ministrante].filter(Boolean).join(" · ");
    return el("a", { class: "cartao-aula", href: "#aula-" + a.id, style: "--cor-secao: var(--tubo-" + secao.tampa + ")" }, [
      C.tela({ youtube: yt, imagem: a.capa ? App.armazem.endereco(a.capa) : null, icone: yt ? SVG_PLAY : SVG_DOC, selo: yt ? null : (a.texto ? "Leitura" : "Em breve") }),
      el("div", { class: "cartao-aula__corpo" }, [
        (a.area || outroPublico) ? el("div", { class: "cartao-aula__etiquetas" }, [
          a.area ? C.etiqueta(a.area) : null,
          outroPublico ? el("span", { class: "etiqueta etiqueta--publico", text: outroPublico }) : null
        ]) : null,
        el("h3", { class: "cartao-aula__titulo" }, [U.destacar(a.titulo, termos)]),
        a.resumo ? el("p", { class: "cartao-aula__resumo" }, [U.destacar(a.resumo, termos)]) : null,
        meta ? el("p", { class: "cartao-aula__meta", text: meta }) : null
      ])
    ]);
  };

  C.fichaProducao = function (p, termos) {
    termos = Array.isArray(termos) ? termos : [];
    return el("article", { class: "ficha" }, [
      el("div", { class: "ficha__topo" }, [
        p.tipo ? C.etiqueta(p.tipo) : null,
        p.data ? el("span", { class: "ficha__data", text: U.dataBR(p.data) }) : null
      ]),
      el("h3", { class: "ficha__titulo" }, [U.destacar(p.titulo, termos)]),
      p.autores ? el("p", { class: "ficha__autores" }, [U.destacar(p.autores, termos)]) : null,
      p.onde ? el("p", { class: "ficha__onde" }, [U.destacar(p.onde, termos)]) : null,
      C.resumoRecolhivel(p.resumo, termos),
      (p.arquivo || p.link) ? el("div", { class: "ficha__acoes" }, [
        p.arquivo ? C.botaoBaixar(p.arquivo, "Baixar o PDF") : null,
        p.link ? C.linkExterno(p.link, "Ler o trabalho") : null
      ]) : null
    ]);
  };

  /* Resumo do trabalho: textos longos aparecem recolhidos, com botão para abrir. */
  C.resumoRecolhivel = function (texto, termos) {
    texto = String(texto || "").trim();
    if (!texto) return null;
    var resumo = el("p", { class: "ficha__resumo" }, [U.destacar(texto, termos)]);
    if (texto.length < 420) return resumo;
    resumo.classList.add("ficha__resumo--recolhido");
    var botao = el("button", { type: "button", class: "ficha__mais", "aria-expanded": "false", text: "Ler o resumo completo" });
    botao.addEventListener("click", function () {
      var abrir = resumo.classList.toggle("ficha__resumo--recolhido") === false;
      botao.textContent = abrir ? "Recolher o resumo" : "Ler o resumo completo";
      botao.setAttribute("aria-expanded", abrir ? "true" : "false");
    });
    return el("div", { class: "ficha__bloco-resumo", style: "display:grid;gap:6px" }, [resumo, botao]);
  };

  /* ---------- barra de busca ----------
     opcoes: rotulo (para leitores de tela), placeholder, valor inicial, aoBuscar(texto).
     Devolve { elemento, contagem(texto), limpar() }. */
  var SVG_LUPA = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.75" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13 13l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  C.busca = function (o) {
    var id = "busca-" + Math.random().toString(36).slice(2, 7);
    var campo = el("input", {
      id: id, class: "busca__campo", type: "search", value: o.valor || "", placeholder: o.placeholder || "Buscar",
      autocomplete: "off", spellcheck: "false", enterkeyhint: "search", "aria-describedby": id + "-contagem"
    });
    var limpar = el("button", { type: "button", class: "busca__limpar", "aria-label": "Limpar a busca", text: "×", hidden: !o.valor });
    var atalho = el("kbd", { class: "busca__atalho", title: "Aperte / para buscar", text: "/" });
    var contagem = el("p", { class: "busca__contagem", id: id + "-contagem", "aria-live": "polite" });
    var espera;
    function avisar() {
      limpar.hidden = !campo.value;
      atalho.hidden = !!campo.value;
      clearTimeout(espera);
      espera = setTimeout(function () { o.aoBuscar(campo.value); }, 120);
    }
    campo.addEventListener("input", avisar);
    campo.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && campo.value) { e.preventDefault(); campo.value = ""; avisar(); }
    });
    limpar.addEventListener("click", function () { campo.value = ""; avisar(); campo.focus(); });
    atalho.hidden = !!o.valor;
    var form = el("form", { class: "busca", role: "search", "aria-label": o.rotulo || "Buscar" }, [
      el("label", { class: "busca__rotulo", for: id, text: o.rotulo || "Buscar" }),
      el("div", { class: "busca__caixa" }, [
        el("span", { class: "busca__lupa", html: SVG_LUPA }),
        campo, limpar, atalho
      ]),
      contagem
    ]);
    form.addEventListener("submit", function (e) { e.preventDefault(); campo.blur(); });
    return {
      elemento: form,
      contagem: function (texto) { contagem.textContent = texto || ""; },
      limpar: function () { campo.value = ""; avisar(); campo.focus(); }
    };
  };
  /* "/" leva direto para a busca da página (fora de campos de texto). */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    var alvo = e.target;
    if (alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName))) return;
    var campo = document.querySelector(".busca__campo");
    if (campo) { e.preventDefault(); campo.focus(); campo.select(); }
  });

  /* Botão para baixar um arquivo do site (no mesmo endereço, o navegador baixa direto). */
  C.botaoBaixar = function (ref, texto) {
    var href = App.armazem.endereco(ref);
    var mesmoSite = !/^https?:/i.test(href) || href.indexOf(location.origin + "/") === 0;
    var nome = (ref && ref.nome) || href.split("/").pop();
    return el("a", {
      class: "botao botao--contorno botao--baixar", href: href,
      download: mesmoSite ? nome : null,
      target: mesmoSite ? null : "_blank", rel: mesmoSite ? null : "noopener",
      "aria-label": texto + (nome ? " (" + nome + ")" : "")
    }, [
      el("span", { class: "botao__icone", "aria-hidden": "true", html: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 1.5v8.2m0 0L4.8 6.5M8 9.7l3.2-3.2M2.5 11v2.5h11V11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
      texto
    ]);
  };

  /* ---------- carrossel de fotos ---------- */
  C.carrossel = function (titulo, fotos) {
    var n = fotos.length;
    var trilho = el("div", {
      class: "carrossel__trilho",
      tabindex: "0",
      "aria-label": "Fotos de " + titulo + ". Use as setas do teclado para navegar."
    }, fotos.map(function (f, i) {
      var src = App.armazem.endereco(f);
      var carregar = i < 2 ? "eager" : "lazy";
      return el("figure", { class: "carrossel__slide", "aria-roledescription": "foto", "aria-label": (i + 1) + " de " + n }, [
        el("img", { class: "carrossel__fundo", src: src, alt: "", loading: carregar, "aria-hidden": "true" }),
        el("img", { class: "carrossel__foto", src: src, alt: f.descricao || "", loading: carregar })
      ]);
    }));
    var anterior = el("button", { class: "carrossel__seta carrossel__seta--anterior", type: "button", "aria-label": "Foto anterior", text: "‹" });
    var proxima = el("button", { class: "carrossel__seta carrossel__seta--proxima", type: "button", "aria-label": "Próxima foto", text: "›" });
    var pontos = fotos.map(function (f, i) {
      return el("button", { class: "carrossel__ponto", type: "button", "aria-label": "Ir para a foto " + (i + 1) });
    });
    var contador = el("p", { class: "carrossel__contador", "aria-live": "polite" });
    var legenda = el("p", { class: "carrossel__legenda" });
    var atual = 0;

    function marcar(i) {
      atual = i;
      pontos.forEach(function (p, k) { p.setAttribute("aria-current", k === i ? "true" : "false"); });
      contador.textContent = (i + 1) + " / " + n;
      legenda.textContent = fotos[i].descricao || "";
    }
    function ir(i) {
      i = (i + n) % n;
      trilho.scrollTo({ left: i * trilho.clientWidth, behavior: U.prefereMenosMovimento() ? "auto" : "smooth" });
      marcar(i);
    }
    anterior.addEventListener("click", function () { ir(atual - 1); });
    proxima.addEventListener("click", function () { ir(atual + 1); });
    pontos.forEach(function (p, i) { p.addEventListener("click", function () { ir(i); }); });
    trilho.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); ir(atual + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); ir(atual - 1); }
    });
    var espera;
    trilho.addEventListener("scroll", function () {
      clearTimeout(espera);
      espera = setTimeout(function () {
        var i = Math.round(trilho.scrollLeft / Math.max(1, trilho.clientWidth));
        if (i !== atual && i >= 0 && i < n) marcar(i);
      }, 80);
    }, { passive: true });
    marcar(0);

    var mostrarPontos = n <= 14;
    return el("div", { class: "carrossel" }, [
      el("div", { class: "carrossel__palco" }, n > 1 ? [trilho, anterior, proxima] : [trilho]),
      n > 1 ? el("div", { class: "carrossel__rodape" }, [
        mostrarPontos ? el("div", { class: "carrossel__pontos" }, pontos) : el("span"),
        contador
      ]) : null,
      legenda
    ]);
  };

  /* Bloco de uma atividade: texto à esquerda, fotos à direita. */
  C.atividade = function (at, opcoes) {
    opcoes = opcoes || {};
    var dados = [];
    if (at.data) dados.push(el("div", null, [el("dt", { text: "Data" }), el("dd", { text: U.dataBR(at.data) })]));
    if (at.local) dados.push(el("div", null, [el("dt", { text: "Local" }), el("dd", { text: at.local })]));
    var Tit = opcoes.nivel || "h3";
    var texto = el("div", { class: "atividade__texto" }, [
      at.tipo ? C.etiqueta(at.tipo) : null,
      el(Tit, { class: "titulo-item", text: at.titulo }),
      dados.length ? el("dl", { class: "laudo" }, dados) : null,
      U.renderTexto(at.texto || ""),
      at.link ? C.linkExterno(at.link, "Ver no Instagram da liga") : null
    ]);
    var fotos = (at.fotos || []).filter(function (f) { return App.armazem.endereco(f); });
    var midia = fotos.length
      ? C.carrossel(at.titulo, fotos)
      : C.emBreve({ titulo: "Fotos em breve", icone: SVG_FOTO, selo: "Sem fotos ainda", compacto: true });
    return el("div", { class: "atividade" }, [texto, midia]);
  };
})();
