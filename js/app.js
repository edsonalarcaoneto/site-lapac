/*
  Monta o cabeçalho, o menu e o rodapé, e troca de página sem sair do site:
  cada aba é um endereço com # (ex.: index.html#artigos), aberto na mesma aba do navegador.
*/
(function () {
  "use strict";
  var App = window.LAPACApp;
  var U = App.util;
  var C = App.comp;
  var A = App.armazem;
  var el = U.el;
  var D = window.LAPAC || {};

  var principal;
  var linksMenu = [];
  var rotaAtual = null;
  var menu, botaoMenu, rotuloLogin, itemSair;

  function atualizarSessaoNoMenu() {
    var conectado = !!A.sessao;
    if (itemSair) itemSair.hidden = !conectado;
    if (rotuloLogin) rotuloLogin.textContent = C.nomeSecao(App.secao("login"));
  }

  /* ---------- cabeçalho ---------- */
  function montarCabecalho() {
    var liga = D.liga || {};
    var marca = el("a", { class: "marca", href: "#inicio", "aria-label": (liga.sigla || "LAPAC") + ", página inicial" }, [
      el("img", { src: "img/logo-lapac.png", alt: "", width: "56", height: "56" }),
      el("span", { class: "marca__textos" }, [
        el("span", { class: "marca__sigla", text: liga.sigla || "LAPAC" }),
        el("span", { class: "marca__nome", text: (liga.nome || "") + " · " + (liga.instituicao || "") })
      ])
    ]);

    var lista = el("ul", null, App.SECOES.map(function (s) {
      var rotulo = el("span", { class: "menu__rotulo", text: s.nome });
      if (s.id === "login") rotuloLogin = rotulo;
      var a = el("a", { href: "#" + s.id, "data-rota": s.id, style: "--tampa: var(--tubo-" + s.tampa + ")", class: s.id === "login" ? "menu__login" : null }, [
        el("span", { class: "menu__tampa", "aria-hidden": "true" }),
        rotulo
      ]);
      linksMenu.push(a);
      return el("li", null, [a]);
    }));
    /* Quando um diretor está conectado: a aba Login vira "Painel" e aparece "Sair" ao lado. */
    var botaoSair = el("button", { type: "button", class: "menu__sair", text: "Sair" });
    botaoSair.addEventListener("click", function () {
      abrirMenu(false);
      (App.painel && App.painel.sair ? App.painel.sair() : A.sair()).then(function () {
        U.aviso("Você saiu da sua conta.");
      });
    });
    itemSair = el("li", { class: "menu__sair-item", hidden: true }, [botaoSair]);
    lista.appendChild(itemSair);
    menu = el("nav", { id: "menu", class: "menu", "aria-label": "Seções do site", "data-fechado": "true" }, [lista]);
    botaoMenu = el("button", { class: "menu-botao", type: "button", "aria-expanded": "false", "aria-controls": "menu", text: "Menu" });
    botaoMenu.addEventListener("click", function () {
      var aberto = botaoMenu.getAttribute("aria-expanded") === "true";
      abrirMenu(!aberto);
    });

    var faixa = el("div", { class: "faixa-tubos", "aria-hidden": "true" }, App.SECOES.map(function (s) {
      return el("span", { style: "background: var(--tubo-" + s.tampa + ")" });
    }));

    return el("header", { class: "topo" }, [
      el("div", { class: "envoltorio topo__linha" }, [marca, botaoMenu, menu]),
      faixa
    ]);
  }

  function abrirMenu(abrir) {
    botaoMenu.setAttribute("aria-expanded", abrir ? "true" : "false");
    menu.setAttribute("data-fechado", abrir ? "false" : "true");
    botaoMenu.textContent = abrir ? "Fechar" : "Menu";
  }

  /* ---------- rodapé ---------- */
  function montarRodape() {
    var liga = D.liga || {};
    var c = D.contato || {};
    var emailItem = c.email
      ? el("li", null, ["E-mail: ", el("a", { class: "rodape__email", href: "mailto:" + c.email, text: c.email })])
      : el("li", { class: "rodape__pendente", text: "E-mail da liga: em breve" });
    var instaItem = c.instagram ? el("li", null, ["Instagram: ", C.linkExterno(c.instagram, c.instagramUsuario || "Instagram", "")]) : null;
    var ytItem = c.youtube
      ? el("li", null, ["YouTube: ", C.linkExterno(c.youtube, "canal da liga", "")])
      : el("li", { class: "rodape__pendente", text: "Canal no YouTube: em breve" });

    return el("footer", { class: "rodape" }, [
      el("div", { class: "envoltorio rodape__grade" }, [
        el("div", null, [
          el("p", { class: "rodape__sigla", text: liga.sigla || "LAPAC" }),
          el("p", { class: "texto-suave", text: (liga.nome || "") + ", " + (liga.instituicao || "") + "." }),
          el("p", { class: "rodape__lema", text: liga.lema || "" })
        ]),
        el("div", null, [
          el("h2", { text: "Contato" }),
          el("ul", null, [emailItem, instaItem, ytItem])
        ]),
        el("div", { class: "legenda-tubos" }, [
          el("h2", { text: "As cores do site" }),
          el("p", { text: "Cada seção tem a cor de uma tampa de tubo de coleta de sangue, e o menu segue a ordem de coleta:" }),
          el("ol", null, App.SECOES.map(function (s) {
            return el("li", { style: "--cor: var(--tubo-" + s.tampa + ")" }, [
              el("a", { href: "#" + s.id, text: s.nome }),
              el("span", { class: "texto-suave", text: " · " + s.cor.toLowerCase() + " (" + s.uso + ")" })
            ]);
          }))
        ])
      ]),
      el("div", { class: "envoltorio" }, [
        el("div", { class: "rodape__base" }, [
          el("p", { text: "Os conteúdos deste site são educativos e não substituem a orientação do seu médico ou do laboratório." }),
          el("p", { text: "© " + new Date().getFullYear() + " " + (liga.sigla || "LAPAC") })
        ])
      ])
    ]);
  }

  /* ---------- rotas ---------- */
  function lerRota() {
    var h = "";
    try { h = decodeURIComponent((location.hash || "").replace(/^#/, "")); } catch (e) { h = ""; }
    if (h === "diretoria") h = "login"; /* endereço antigo */
    /* volta de um link de e-mail do Supabase (confirmação ou senha nova): vai para o Login */
    if (/(^|&)(access_token|error_description|error_code)=/.test(h)) h = "login";
    return h || "inicio";
  }

  function paginaDaRota(rota) {
    if (rota.indexOf("aula-") === 0) return { secao: null, conteudo: App.paginas.aula(rota.slice(5)), titulo: "Aula" };
    var p = App.paginas[rota];
    if (!p) return { secao: null, conteudo: App.paginas.naoEncontrada(), titulo: "Página não encontrada" };
    var s = App.secao(rota);
    return { secao: s, conteudo: p(), titulo: s ? s.nome : null };
  }

  function desenhar(rota, opcoes) {
    opcoes = opcoes || {};
    var mudouDeRota = rota !== rotaAtual;
    rotaAtual = rota;
    var r = paginaDaRota(rota);
    principal.replaceChildren(r.conteudo);

    var secaoAtiva = rota.indexOf("aula-") === 0
      ? ((A.item("aulas", rota.slice(5)) || {}).publico === "populacao" ? "populacao" : "profissionais")
      : rota;
    var sAtiva = App.secao(secaoAtiva);
    if (sAtiva) principal.style.setProperty("--cor-secao", "var(--tubo-" + sAtiva.tampa + ")");
    else principal.style.removeProperty("--cor-secao");
    linksMenu.forEach(function (a) {
      if (a.getAttribute("data-rota") === secaoAtiva) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    var h1 = principal.querySelector("h1");
    document.title = rota === "inicio" ? "LAPAC · " + ((D.liga && D.liga.instituicao) || "") : ((h1 && h1.textContent) || r.titulo || "LAPAC") + " · LAPAC";

    requestAnimationFrame(function () { C.marcarTubosCortados(principal); });

    if (mudouDeRota && !opcoes.manterRolagem) {
      window.scrollTo({ top: 0 });
      if (opcoes.focar) principal.focus({ preventScroll: true });
    }
  }

  function navegar(rota) {
    abrirMenu(false);
    try {
      if (lerRota() !== rota) location.hash = rota;
    } catch (e) { /* alguns visualizadores bloqueiam; a página troca mesmo assim */ }
    desenhar(rota, { focar: true });
  }

  /* Links internos (#algo) trocam de página aqui mesmo, sem abrir outra aba. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href^='#']");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var destino = a.getAttribute("href").slice(1);
    if (!destino || destino === "conteudo") return;
    e.preventDefault();
    navegar(destino);
  });

  window.addEventListener("hashchange", function () {
    var r = lerRota();
    if (r !== rotaAtual) desenhar(r);
  });

  /* ---------- início ---------- */
  function iniciar() {
    var corpo = document.body;
    var pular = el("a", { class: "pular", href: "#conteudo", text: "Pular para o conteúdo" });
    pular.addEventListener("click", function (e) { e.preventDefault(); principal.focus(); });
    principal = el("main", { id: "conteudo", tabindex: "-1" });
    corpo.prepend(pular, montarCabecalho(), principal);
    corpo.appendChild(montarRodape());

    desenhar(lerRota());

    /* o tamanho dos tubos muda com a largura da tela e com a chegada das fontes: mede de novo */
    var esperaMedida;
    window.addEventListener("resize", function () {
      clearTimeout(esperaMedida);
      esperaMedida = setTimeout(function () { C.marcarTubosCortados(principal); }, 150);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { C.marcarTubosCortados(principal); });
    }

    A.aoMudar(function (motivo) {
      atualizarSessaoNoMenu();
      if (rotaAtual === "login" && motivo === "dados") { App.painel.atualizar(); return; }
      if (rotaAtual === "login" && App.painel.editando()) return;
      desenhar(rotaAtual, { manterRolagem: true });
    });
    A.iniciar();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
