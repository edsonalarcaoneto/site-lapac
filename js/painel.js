/* Aba Login: entrada dos diretores e painel para publicar aulas, artigos e atividades. */
(function () {
  "use strict";
  var App = window.LAPACApp;
  var U = App.util;
  var C = App.comp;
  var A = App.armazem;
  var el = U.el;
  var D = window.LAPAC || {};

  var COLECOES = {
    aulas: { nome: "Aulas", singular: "aula", novo: "Nova aula", genero: "a" },
    producoes: { nome: "Artigos", singular: "artigo", novo: "Novo artigo", genero: "o" },
    atividades: { nome: "Atividades", singular: "atividade", novo: "Nova atividade", genero: "a" }
  };
  var TIPOS_PRODUCAO = ["Artigo", "Resumo em congresso", "Pôster", "Apresentação oral"];
  var TIPOS_ATIVIDADE = ["Extensão", "Ensino", "Pesquisa", "Evento científico", "Outra"];

  var estado = { aba: "aulas", editando: null, confirmarRemocao: null, trocandoSenha: false, primeiroAcesso: null, recuperar: null, avisoLogin: null, retornoTratado: false, emailLogin: null };
  var raiz = el("div", { class: "envoltorio pagina-corpo painel-raiz" });

  App.painel = {
    pagina: function () {
      renderizar();
      return el("div", { class: "pagina" }, [C.cabecalhoPagina(App.secao("login")), raiz]);
    },
    atualizar: function () {
      if (!estado.editando) renderizar();
    },
    editando: function () { return !!estado.editando; },
    sair: function () {
      estado.editando = null;
      estado.trocandoSenha = false;
      estado.confirmarRemocao = null;
      return A.sair();
    }
  };
  App.paginas.login = App.painel.pagina;

  function renderizar() {
    tratarRetornoEmail();
    raiz.replaceChildren(A.sessao ? painel() : login());
    olhosNasSenhas(raiz);
  }

  /* Quem chega pelo link de um e-mail do Supabase (confirmação ou senha nova). */
  function tratarRetornoEmail() {
    var r = A.retornoEmail;
    if (!r || !A.pronto || estado.retornoTratado) return;
    estado.retornoTratado = true;
    if (r.erro) {
      estado.avisoLogin = "O link do e-mail venceu ou já foi usado. Entre com o seu e-mail e senha ou peça um novo.";
    } else if (A.sessao && r.tipo === "recovery") {
      estado.trocandoSenha = true;
      U.aviso("Crie agora a sua senha nova.");
    } else if (A.sessao) {
      U.aviso("E-mail confirmado. Bem-vindo ao painel!");
    }
  }

  /* Botão "Mostrar" em todo campo de senha, para conferir o que foi digitado. */
  function olhosNasSenhas(onde) {
    onde.querySelectorAll('input[type="password"]:not([data-olho])').forEach(function (inp) {
      inp.setAttribute("data-olho", "");
      var caixa = el("span", { class: "campo-senha" });
      inp.parentNode.insertBefore(caixa, inp);
      caixa.appendChild(inp);
      var ver = el("button", { type: "button", class: "campo-senha__ver", "aria-label": "Mostrar senha", "aria-pressed": "false", text: "Mostrar" });
      ver.addEventListener("click", function (e) {
        e.preventDefault();
        var mostrar = inp.type === "password";
        inp.type = mostrar ? "text" : "password";
        ver.textContent = mostrar ? "Ocultar" : "Mostrar";
        ver.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
        ver.setAttribute("aria-pressed", mostrar ? "true" : "false");
        inp.focus();
      });
      caixa.appendChild(ver);
    });
  }

  /* ---------- login ---------- */
  function login() {
    var erro = el("p", { class: "erro", role: "alert", text: estado.avisoLogin || "" });
    estado.avisoLogin = null;
    var conteudo = [];

    if (!A.pronto) {
      conteudo.push(el("p", { class: "texto-suave", text: "Carregando…" }));
    } else if (A.modo === "supabase" && estado.primeiroAcesso) {
      conteudo.push(formPrimeiroAcesso(erro));
    } else if (A.modo === "supabase" && estado.recuperar) {
      conteudo.push(formRecuperar(erro));
    } else if (A.modo === "supabase") {
      var email = el("input", { id: "login-email", class: "campo", type: "email", autocomplete: "username", inputmode: "email", placeholder: "seu.email@exemplo.com", value: estado.emailLogin || "" });
      estado.emailLogin = null;
      var senha = el("input", { id: "login-senha", class: "campo", type: "password", autocomplete: "current-password" });
      var botaoEntrar = el("button", { type: "submit", class: "botao", text: "Entrar" });
      var form = el("form", { class: "login__form", novalidate: true }, [
        el("label", { class: "campo-grupo", for: "login-email" }, [el("span", { class: "campo-rotulo", text: "E-mail" }), email]),
        el("label", { class: "campo-grupo", for: "login-senha" }, [el("span", { class: "campo-rotulo", text: "Senha" }), senha]),
        el("div", { class: "login__acoes" }, [
          botaoEntrar,
          el("button", {
            type: "button", class: "botao botao--discreto", text: "Esqueci minha senha",
            onclick: function () { estado.recuperar = { passo: 1, email: email.value.trim() }; renderizar(); }
          })
        ])
      ]);
      var irPrimeiro = el("div", { class: "login__primeiro" }, [
        el("p", { class: "campo-ajuda", text: "Ainda não tem conta?" }),
        el("button", {
          type: "button", class: "botao botao--contorno", text: "Primeiro acesso",
          onclick: function () { estado.primeiroAcesso = { passo: 1, dados: {} }; renderizar(); }
        })
      ]);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!email.value.trim() || !senha.value) { erro.textContent = "Preencha o e-mail e a senha."; return; }
        botaoEntrar.disabled = true;
        erro.textContent = "";
        A.entrar(email.value, senha.value).catch(function (err) {
          botaoEntrar.disabled = false;
          erro.textContent = err && err.code === "sem_permissao"
            ? "Esta conta não está na lista de diretores."
            : err && err.code === "credenciais"
              ? "E-mail ou senha incorretos."
              : "Não foi possível entrar agora. Confira a internet e tente de novo.";
        });
      });
      conteudo.push(form, irPrimeiro);
    } else if (A.modo === "claude") {
      conteudo.push(
        el("p", { text: "Nesta prévia, o acesso usa a sua conta do Claude. Diretores que receberam acesso de Editor à prévia entram direto, sem senha." }),
        el("button", {
          type: "button", class: "botao", text: "Entrar com minha conta",
          onclick: function (e) {
            e.target.disabled = true;
            A.entrar().catch(function (err) {
              e.target.disabled = false;
              erro.textContent = err && err.code === "sem_permissao"
                ? "Sua conta não tem acesso de diretor nesta prévia. Peça a quem administra a prévia para te adicionar como Editor."
                : "Não foi possível identificar sua conta. Confira se você está conectado ao claude.ai.";
            });
          }
        })
      );
    } else if (A.modo === "local") {
      var nomes = (D.diretoria || []).map(function (d) { return d.nome + (d.cargo ? " (" + d.cargo + ")" : ""); });
      nomes.push("Outro diretor");
      var seletor = el("select", { id: "login-diretor", class: "campo" }, nomes.map(function (n) {
        return el("option", { value: n, text: n });
      }));
      conteudo.push(
        el("p", { class: "aviso-modo" }, [
          el("strong", { text: "Modo demonstração. " }),
          "O site ainda não está ligado a um servidor, então o que você publicar aqui fica salvo só neste navegador. Serve para testar o painel."
        ]),
        el("label", { class: "campo-grupo", for: "login-diretor" }, [el("span", { class: "campo-rotulo", text: "Quem está entrando" }), seletor]),
        el("button", {
          type: "button", class: "botao", text: "Entrar na demonstração",
          onclick: function () { A.entrar(seletor.value.replace(/\s*\(.*\)$/, "")); }
        })
      );
    } else {
      conteudo.push(el("p", { text: "O painel ainda não está ligado a um servidor. Quando estiver, cada diretor vai entrar aqui com a própria conta." }));
    }

    var primeiro = A.modo === "supabase" && estado.primeiroAcesso;
    var recuperar = A.modo === "supabase" && estado.recuperar;
    return el("div", { class: "login" }, [
      el("section", { class: "bloco login__cartao" }, [
        el("h2", { class: "rotulo", text: primeiro ? "Primeiro acesso" : recuperar ? "Nova senha" : "Entrar" }),
        el("p", { class: "titulo-item", text: primeiro ? "Criar a sua conta de diretor" : recuperar ? "Recuperar o acesso" : "Acesso dos diretores" })
      ].concat(conteudo, [erro])),
      el("section", { class: "login__lado" }, [
        el("p", { class: "login__lado-titulo", text: "O que dá para fazer aqui" }),
        el("ul", { class: "lista-motivos" }, [
          el("li", { text: "Publicar aulas e escolher se vão para profissionais de saúde ou para a população" }),
          el("li", { text: "Registrar artigos, resumos, pôsteres e apresentações" }),
          el("li", { text: "Registrar atividades com texto e fotos" }),
          el("li", { text: "Guardar como rascunho e publicar só depois da revisão" }),
          el("li", { text: "Ver quem atualizou cada item e quando" })
        ])
      ])
    ]);
  }

  /* ---------- primeiro acesso (site publicado) ----------
     Passo 1: e-mail e senha padrão recebida da diretoria.
     Passo 2: nome, cargo e a nova senha (duas vezes). O servidor confere a senha padrão
     (ver supabase/primeiro-acesso.sql) e envia um e-mail de confirmação.
     Passo 3: aviso para tocar no link do e-mail, que confirma o endereço e ativa a conta. */
  function grupo(id, rotulo, controle, ajuda) {
    return el("label", { class: "campo-grupo", for: id }, [el("span", { class: "campo-rotulo", text: rotulo }), controle]
      .concat(ajuda ? [el("span", { class: "campo-ajuda", text: ajuda })] : []));
  }
  function emailValido(a) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.trim()); }
  function msgSenha(code) {
    return code === "senha_fraca" ? "Senha fraca demais. Use mais caracteres, misturando letras e números."
      : code === "senha_igual" ? "A nova senha precisa ser diferente da atual."
        : null;
  }
  function botaoReenviar(fn, erro) {
    var b = el("button", { type: "button", class: "botao botao--discreto", text: "Reenviar o e-mail" });
    b.addEventListener("click", function () {
      b.disabled = true;
      fn().then(function () {
        U.aviso("E-mail reenviado. Confira também a caixa de spam.");
        setTimeout(function () { b.disabled = false; }, 60000);
      }, function (err) {
        b.disabled = false;
        erro.textContent = err && err.code === "espera"
          ? "Espere um minuto antes de pedir outro e-mail."
          : err && err.code === "envio"
            ? "O site não conseguiu enviar o e-mail para este endereço. Fale com a diretoria."
            : "Não foi possível reenviar agora. Tente de novo em instantes.";
      });
    });
    return b;
  }

  function formPrimeiroAcesso(erro) {
    var pa = estado.primeiroAcesso;
    var d = pa.dados;
    var voltar = el("button", {
      type: "button", class: "botao botao--discreto",
      text: pa.passo === 1 ? "Voltar para o login" : pa.passo === 3 ? "Corrigir o e-mail" : "Voltar",
      onclick: function () {
        if (pa.passo === 1) estado.primeiroAcesso = null; else pa.passo = 1;
        renderizar();
      }
    });

    if (pa.passo === 1) {
      var email = el("input", { id: "pa-email", class: "campo", type: "email", autocomplete: "email", inputmode: "email", value: d.email || "" });
      var convite = el("input", { id: "pa-convite", class: "campo", type: "password", autocomplete: "off", value: d.convite || "" });
      var f1 = el("form", { class: "login__form", novalidate: true }, [
        el("p", { class: "texto-suave", text: "Passo 1 de 3" }),
        grupo("pa-email", "Seu e-mail", email, "Você vai receber um link neste e-mail para confirmar que ele está certo."),
        grupo("pa-convite", "Senha padrão", convite, "A senha que a diretoria passou para o primeiro acesso."),
        el("div", { class: "login__acoes" }, [el("button", { type: "submit", class: "botao", text: "Continuar" }), voltar])
      ]);
      f1.addEventListener("submit", function (e) {
        e.preventDefault();
        d.email = email.value.trim().toLowerCase(); d.convite = convite.value;
        if (!emailValido(email.value)) { erro.textContent = "Confira o e-mail: ele não parece completo."; email.focus(); return; }
        if (!convite.value) { erro.textContent = "Digite a senha padrão."; convite.focus(); return; }
        erro.textContent = "";
        pa.passo = 2;
        renderizar();
      });
      setTimeout(function () { (d.email ? convite : email).focus(); }, 0);
      return f1;
    }

    if (pa.passo === 3) {
      var jaConfirmei = el("button", {
        type: "button", class: "botao", text: "Já confirmei, entrar",
        onclick: function () { estado.emailLogin = d.email; estado.primeiroAcesso = null; renderizar(); }
      });
      var f3 = el("div", { class: "login__form" }, [
        el("p", { class: "texto-suave", text: "Passo 3 de 3" }),
        el("p", null, ["Enviamos um e-mail de confirmação para ", el("strong", { text: d.email }), "."]),
        el("p", { text: "Abra o e-mail e toque no link de confirmação. A conta é ativada e o site abre já no painel." }),
        el("p", { class: "campo-ajuda", text: "Não chegou em alguns minutos? Confira a caixa de spam ou reenvie. Se o e-mail estiver errado, corrija e faça de novo." }),
        el("div", { class: "login__acoes" }, [jaConfirmei, botaoReenviar(function () { return A.reenviarCodigo(d.email); }, erro), voltar])
      ]);
      return f3;
    }

    var nome = el("input", { id: "pa-nome", class: "campo", type: "text", autocomplete: "name", value: d.nome || "" });
    var cargo = el("input", { id: "pa-cargo", class: "campo", type: "text", list: "pa-cargos", value: d.cargo || "", placeholder: "Ex.: Diretor de Ensino" });
    var cargos = el("datalist", { id: "pa-cargos" }, ["Presidente", "Vice-presidente", "Diretor de Ensino", "Diretor de Pesquisa",
      "Diretor de Extensão", "Diretor de Marketing", "Secretário", "Tesoureiro"].map(function (c) { return el("option", { value: c }); }));
    var senha = el("input", { id: "pa-senha", class: "campo", type: "password", autocomplete: "new-password" });
    var senha2 = el("input", { id: "pa-senha2", class: "campo", type: "password", autocomplete: "new-password" });
    var criar = el("button", { type: "submit", class: "botao", text: "Criar minha conta" });
    var f2 = el("form", { class: "login__form", novalidate: true }, [
      el("p", { class: "texto-suave", text: "Passo 2 de 3 · " + d.email }),
      grupo("pa-nome", "Seu nome", nome),
      grupo("pa-cargo", "Seu cargo na diretoria", cargo), cargos,
      grupo("pa-senha", "Crie a sua senha", senha, "Pelo menos 8 caracteres, diferente da senha padrão."),
      grupo("pa-senha2", "Repita a senha", senha2),
      el("div", { class: "login__acoes" }, [criar, voltar])
    ]);
    f2.addEventListener("submit", function (e) {
      e.preventDefault();
      d.nome = nome.value; d.cargo = cargo.value;
      if (!nome.value.trim()) { erro.textContent = "Digite o seu nome."; nome.focus(); return; }
      if (senha.value.length < 8) { erro.textContent = "A senha precisa ter pelo menos 8 caracteres."; senha.focus(); return; }
      if (senha.value === d.convite) { erro.textContent = "Crie uma senha diferente da senha padrão."; senha.focus(); return; }
      if (senha.value !== senha2.value) { erro.textContent = "As duas senhas não são iguais. Digite de novo."; senha2.value = ""; senha2.focus(); return; }
      erro.textContent = "";
      criar.disabled = true;
      A.criarConta({ email: d.email, senha: senha.value, convite: d.convite, nome: nome.value.trim(), cargo: cargo.value.trim() }).then(function (r) {
        if (r && r.confirmar) {
          pa.passo = 3;
          renderizar();
          return;
        }
        estado.primeiroAcesso = null;
        U.aviso("Conta criada. Bem-vindo ao painel!");
      }, function (err) {
        criar.disabled = false;
        var code = err && err.code;
        if (code === "convite") {
          d.convite = "";
          pa.passo = 1;
          renderizar();
          raiz.querySelector(".erro").textContent = "A senha padrão não confere (ou o primeiro acesso está desligado). Confira com a diretoria.";
          return;
        }
        erro.textContent = code === "ja_existe"
          ? "Já existe uma conta com este e-mail. Volte e entre pelo login normal."
          : msgSenha(code) || (code === "fechado"
            ? "O primeiro acesso está fechado no momento. Fale com a diretoria."
            : code === "espera"
              ? "Muitas tentativas seguidas. Espere alguns minutos e tente de novo."
              : code === "envio"
                ? "O site não conseguiu enviar o e-mail de confirmação. Fale com a diretoria."
                : "Não foi possível criar a conta agora. Confira a internet e tente de novo.");
      });
    });
    setTimeout(function () { (d.nome ? senha : nome).focus(); }, 0);
    return f2;
  }

  /* ---------- esqueci minha senha (site publicado) ----------
     Passo 1: e-mail. Passo 2: aviso para tocar no link do e-mail, que abre o site pedindo a senha nova. */
  function formRecuperar(erro) {
    var rc = estado.recuperar;
    var voltar = el("button", {
      type: "button", class: "botao botao--discreto",
      text: rc.passo === 1 ? "Voltar para o login" : "Corrigir o e-mail",
      onclick: function () {
        if (rc.passo === 1) estado.recuperar = null; else rc.passo = 1;
        renderizar();
      }
    });

    if (rc.passo === 1) {
      var email = el("input", { id: "rc-email", class: "campo", type: "email", autocomplete: "email", inputmode: "email", value: rc.email || "" });
      var enviar = el("button", { type: "submit", class: "botao", text: "Enviar e-mail" });
      var f1 = el("form", { class: "login__form", novalidate: true }, [
        grupo("rc-email", "E-mail da sua conta", email, "Vamos enviar um link para você criar uma senha nova."),
        el("div", { class: "login__acoes" }, [enviar, voltar])
      ]);
      f1.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!emailValido(email.value)) { erro.textContent = "Confira o e-mail: ele não parece completo."; email.focus(); return; }
        rc.email = email.value.trim().toLowerCase();
        erro.textContent = "";
        enviar.disabled = true;
        A.pedirCodigoSenha(rc.email).then(function () {
          rc.passo = 2;
          renderizar();
        }, function (err) {
          enviar.disabled = false;
          erro.textContent = err && err.code === "espera"
            ? "Espere um minuto antes de pedir outro e-mail."
            : err && err.code === "envio"
              ? "O site não conseguiu enviar o e-mail para este endereço. Fale com a diretoria."
              : "Não foi possível enviar o e-mail agora. Tente de novo em instantes.";
        });
      });
      setTimeout(function () { email.focus(); }, 0);
      return f1;
    }

    return el("div", { class: "login__form" }, [
      el("p", null, ["Se ", el("strong", { text: rc.email }), " tiver conta no site, enviamos um e-mail para ele."]),
      el("p", { text: "Abra o e-mail e toque no link. O site abre já pedindo a senha nova." }),
      el("p", { class: "campo-ajuda", text: "Não chegou em alguns minutos? Confira a caixa de spam ou reenvie." }),
      el("div", { class: "login__acoes" }, [
        botaoReenviar(function () { return A.pedirCodigoSenha(rc.email); }, erro),
        el("button", { type: "button", class: "botao botao--discreto", text: "Voltar para o login", onclick: function () { estado.emailLogin = rc.email; estado.recuperar = null; renderizar(); } })
      ])
    ]);
  }

  /* ---------- painel ---------- */
  function painel() {
    var s = A.sessao;
    var barra = el("div", { class: "painel__barra" }, [
      el("div", { class: "painel__quem" }, [
        s.avatar ? el("img", { class: "painel__avatar", src: s.avatar, alt: "" }) : el("span", { class: "painel__avatar painel__avatar--letra", "aria-hidden": "true", text: (s.nome || "D").charAt(0) }),
        el("div", null, [
          el("p", { class: "painel__ola", text: s.nome ? "Olá, " + s.nome : "Olá" }),
          el("p", { class: "painel__modo", text: {
            local: "Modo demonstração: salvo só neste navegador",
            claude: "Prévia no Claude: salvo para quem tem acesso à prévia",
            supabase: (s.cargo ? s.cargo + " · " : "") + "Conectado ao site"
          }[A.modo] || "" })
        ])
      ]),
      el("div", { class: "painel__acoes" }, [
        A.modo === "local" ? el("button", {
          type: "button", class: "botao botao--discreto", text: "Apagar dados da demonstração",
          onclick: function () { A.limparDemonstracao(); U.aviso("Dados da demonstração apagados."); }
        }) : null,
        A.modo === "supabase" ? el("button", {
          type: "button", class: "botao botao--discreto", text: "Trocar senha",
          "aria-expanded": estado.trocandoSenha ? "true" : "false",
          onclick: function () { estado.trocandoSenha = !estado.trocandoSenha; renderizar(); }
        }) : null,
        el("button", { type: "button", class: "botao botao--contorno", text: "Sair", onclick: function () { App.painel.sair(); } })
      ])
    ]);

    if (estado.trocandoSenha && A.modo === "supabase") {
      return el("div", { class: "painel" }, [barra, formularioSenha()]);
    }

    var abas = el("div", { class: "painel__abas", role: "tablist", "aria-label": "O que publicar" }, Object.keys(COLECOES).map(function (k) {
      var n = A.itens(k, { incluirRascunhos: true }).length;
      return el("button", {
        type: "button", role: "tab", class: "painel__aba", id: "aba-" + k,
        "aria-selected": estado.aba === k ? "true" : "false",
        onclick: function () { estado.aba = k; estado.editando = null; renderizar(); }
      }, [COLECOES[k].nome, el("span", { class: "painel__contagem", text: String(n) })]);
    }));

    var conteudo = estado.editando ? formulario() : lista();
    return el("div", { class: "painel" }, [barra, abas, el("div", { class: "painel__conteudo", role: "tabpanel", "aria-labelledby": "aba-" + estado.aba }, [conteudo])]);
  }

  /* ---------- lista de itens ---------- */
  function lista() {
    var col = estado.aba;
    var info = COLECOES[col];
    var itens = A.itens(col, { incluirRascunhos: true });
    var topo = el("div", { class: "painel__topo-lista" }, [
      el("p", { class: "texto-suave", text: itens.length ? itens.length + " " + (itens.length === 1 ? info.singular : info.nome.toLowerCase()) + " no site, incluindo rascunhos." : "Nada publicado ainda." }),
      el("button", { type: "button", class: "botao", text: "+ " + info.novo, onclick: function () { abrir(col, null); } })
    ]);
    if (!itens.length) return el("div", null, [topo]);

    var linhas = itens.map(function (it) {
      var publicado = (it.status || "publicado") === "publicado";
      var detalhes = [];
      if (col === "aulas") detalhes.push(C.nomePublico(it));
      if (it.tipo) detalhes.push(it.tipo);
      if (it.data) detalhes.push(U.dataBR(it.data));
      var quem = el("span", { class: "linha__quem" });
      if (it.atualizadoEm) {
        var quando = U.dataBR(it.atualizadoEm.slice(0, 10));
        quem.textContent = "Atualizado em " + quando + (it.atualizadoPorNome ? " por " + it.atualizadoPorNome : "");
        if (it.atualizadoPor) {
          A.nomes([it.atualizadoPor]).then(function (m) {
            if (m[it.atualizadoPor]) quem.textContent = "Atualizado em " + quando + " por " + m[it.atualizadoPor];
          });
        }
      } else {
        quem.textContent = "Conteúdo original do site";
      }

      var acoes;
      if (estado.confirmarRemocao === col + "/" + it.id) {
        acoes = el("div", { class: "linha__acoes" }, [
          el("span", { class: "linha__pergunta", text: "Remover do site?" }),
          el("button", { type: "button", class: "botao botao--perigo", text: "Remover", onclick: function () {
            A.remover(col, it.id).then(function () {
              estado.confirmarRemocao = null; renderizar(); U.aviso("Removido.");
            }, function (e) { U.aviso(mensagemErro(e), "erro"); });
          } }),
          el("button", { type: "button", class: "botao botao--discreto", text: "Cancelar", onclick: function () { estado.confirmarRemocao = null; renderizar(); } })
        ]);
      } else {
        acoes = el("div", { class: "linha__acoes" }, [
          col === "aulas" ? el("a", { class: "botao botao--discreto", href: "#aula-" + it.id, text: "Ver" }) : null,
          el("button", { type: "button", class: "botao botao--contorno", text: "Editar", onclick: function () { abrir(col, it); } }),
          el("button", { type: "button", class: "botao botao--discreto", text: "Remover", onclick: function () { estado.confirmarRemocao = col + "/" + it.id; renderizar(); } })
        ]);
      }

      return el("li", { class: "linha" }, [
        el("div", { class: "linha__info" }, [
          el("div", { class: "linha__etiquetas" }, [
            C.etiqueta(publicado ? "Publicado" : "Rascunho", publicado ? "etiqueta--ok" : "etiqueta--rascunho")
          ].concat(detalhes.map(function (d) { return el("span", { class: "linha__detalhe", text: d }); }))),
          el("p", { class: "linha__titulo", text: it.titulo || "(sem título)" }),
          quem
        ]),
        acoes
      ]);
    });
    return el("div", null, [topo, el("ul", { class: "linhas" }, linhas)]);
  }

  /* ---------- formulários ---------- */
  function abrir(col, item) {
    var copia = item ? JSON.parse(JSON.stringify(item)) : { status: "publicado", data: U.hojeISO() };
    if (col === "aulas" && !copia.publico) copia.publico = "profissionais";
    if (col === "atividades" && !copia.fotos) copia.fotos = [];
    estado.editando = { col: col, novo: !item, item: copia };
    estado.confirmarRemocao = null;
    renderizar();
    setTimeout(function () {
      var primeiro = raiz.querySelector(".formulario input:not([type=radio]), .formulario select, .formulario textarea");
      if (primeiro) primeiro.focus();
    }, 0);
  }

  function fechar() {
    estado.editando = null;
    renderizar();
    window.scrollTo({ top: 0 });
  }

  var contadorCampos = 0;
  function campo(rotulo, controle, opcoes) {
    opcoes = opcoes || {};
    var id = controle.id || ("campo-" + (++contadorCampos));
    controle.id = id;
    if (opcoes.obrigatorio) controle.setAttribute("aria-required", "true");
    var ajudaId = opcoes.ajuda ? id + "-ajuda" : null;
    if (ajudaId) controle.setAttribute("aria-describedby", ajudaId);
    return el("div", { class: "campo-grupo" + (opcoes.largo ? " campo-grupo--largo" : "") }, [
      el("label", { class: "campo-rotulo", for: id }, [rotulo, opcoes.obrigatorio ? el("span", { class: "obrigatorio", "aria-hidden": "true", text: " *" }) : null]),
      controle,
      opcoes.ajuda ? el("p", { class: "campo-ajuda", id: ajudaId, text: opcoes.ajuda }) : null
    ]);
  }

  function entrada(item, chave, attrs) {
    var e = el(attrs && attrs.tag === "textarea" ? "textarea" : "input", Object.assign({ class: "campo", type: "text" }, attrs || {}));
    if (attrs && attrs.tag) e.removeAttribute("tag");
    if (e.tagName === "TEXTAREA") e.removeAttribute("type");
    e.value = item[chave] || "";
    e.addEventListener("input", function () { item[chave] = e.value; });
    e.dataset.chave = chave;
    return e;
  }

  function seletor(item, chave, opcoes) {
    var s = el("select", { class: "campo" }, [el("option", { value: "", text: "Escolha…" })].concat(opcoes.map(function (o) {
      return el("option", { value: o, text: o });
    })));
    s.value = item[chave] || "";
    s.addEventListener("change", function () { item[chave] = s.value; });
    s.dataset.chave = chave;
    return s;
  }

  function formulario() {
    var ed = estado.editando;
    var it = ed.item;
    var info = COLECOES[ed.col];
    var erro = el("p", { class: "erro", role: "alert" });
    var campos;

    if (ed.col === "aulas") campos = camposAula(it);
    else if (ed.col === "producoes") campos = camposProducao(it);
    else campos = camposAtividade(it);

    var obrigatorios = {
      aulas: [["publico", "o público"], ["titulo", "o título"], ["resumo", "o resumo"], ["data", "a data"]],
      producoes: [["tipo", "o tipo"], ["titulo", "o título"], ["autores", "os autores"], ["onde", "onde foi publicado ou apresentado"], ["data", "a data"]],
      atividades: [["tipo", "o tipo"], ["titulo", "o título"], ["data", "a data"], ["texto", "o texto"]]
    }[ed.col];

    function salvar(status) {
      var faltando = obrigatorios.filter(function (o) { return !String(it[o[0]] || "").trim(); });
      if (faltando.length) {
        erro.textContent = "Falta preencher " + faltando.map(function (f) { return f[1]; }).join(", ") + ".";
        var alvo = raiz.querySelector("[data-chave='" + faltando[0][0] + "']");
        if (alvo) alvo.focus();
        return;
      }
      if (ed.col === "aulas" && it.youtube && !U.youtubeId(it.youtube)) {
        erro.textContent = "O link do YouTube não parece válido. Cole o endereço completo do vídeo.";
        return;
      }
      if (ed.col === "atividades" && (it.fotos || []).some(function (f) { return f.enviando; })) {
        erro.textContent = "Espere as fotos terminarem de enviar.";
        return;
      }
      it.status = status;
      if (ed.novo) it.id = U.novoId(it.titulo);
      erro.textContent = "";
      botoes.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
      A.salvar(ed.col, it).then(function () {
        U.aviso(status === "publicado"
          ? (info.singular.charAt(0).toUpperCase() + info.singular.slice(1)) + " publicad" + info.genero + "."
          : "Rascunho salvo.");
        fechar();
      }, function (e) {
        botoes.querySelectorAll("button").forEach(function (b) { b.disabled = false; });
        erro.textContent = mensagemErro(e);
      });
    }

    var botoes = el("div", { class: "formulario__botoes" }, [
      el("button", { type: "button", class: "botao", text: "Publicar", onclick: function () { salvar("publicado"); } }),
      el("button", { type: "button", class: "botao botao--contorno", text: "Salvar rascunho", onclick: function () { salvar("rascunho"); } }),
      el("button", { type: "button", class: "botao botao--discreto", text: "Cancelar", onclick: fechar })
    ]);

    var form = el("form", { class: "formulario bloco", novalidate: true }, [
      el("div", { class: "formulario__topo" }, [
        el("h2", { class: "titulo-item", text: (ed.novo ? info.novo : "Editar " + info.singular) }),
        el("p", { class: "texto-suave", text: "Campos com * são obrigatórios. \"Salvar rascunho\" guarda sem mostrar no site." })
      ]),
      el("div", { class: "formulario__campos" }, campos),
      erro,
      botoes
    ]);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    return form;
  }

  /* Aula: o público é a primeira escolha do formulário. */
  function camposAula(it) {
    var lista = el("datalist", { id: "areas-sugeridas" });
    function preencherAreas() {
      var areas = [];
      C.publicosDaAula(it).forEach(function (p) {
        ((D.areas && D.areas[p]) || []).forEach(function (x) { if (areas.indexOf(x) < 0) areas.push(x); });
      });
      lista.replaceChildren.apply(lista, areas.map(function (a) { return el("option", { value: a }); }));
    }
    preencherAreas();

    /* Pode marcar um público ou os dois: a aula aparece em cada aba marcada. */
    var marcados = it.publico ? C.publicosDaAula(it) : [];
    var caixas = {};
    function atualizarPublico() {
      var p = caixas.profissionais.checked, q = caixas.populacao.checked;
      it.publico = p && q ? "ambos" : p ? "profissionais" : q ? "populacao" : "";
      preencherAreas();
    }
    var publico = el("fieldset", { class: "segmentado", "data-chave": "publico", tabindex: "-1" }, [
      el("legend", { class: "campo-rotulo" }, [
        "Para quem é esta aula?", el("span", { class: "obrigatorio", "aria-hidden": "true", text: " *" }),
        el("span", { class: "segmentado__dica", text: " Pode marcar os dois." })
      ])
    ].concat([["profissionais", "Profissionais de saúde", "Aparece na aba Para profissionais", "soro"],
              ["populacao", "População", "Aparece na aba Para a população", "gel"]].map(function (o) {
      var r = el("input", { type: "checkbox", name: "publico-" + o[0], value: o[0], id: "publico-" + o[0] });
      r.checked = marcados.indexOf(o[0]) >= 0;
      caixas[o[0]] = r;
      r.addEventListener("change", atualizarPublico);
      return el("label", { class: "segmentado__opcao", for: "publico-" + o[0], style: "--cor-opcao: var(--tubo-" + o[3] + ")" }, [
        r,
        el("span", { class: "segmentado__marca", "aria-hidden": "true" }),
        el("span", { class: "segmentado__textos" }, [
          el("span", { class: "segmentado__nome", text: o[1] }),
          el("span", { class: "segmentado__ajuda", text: o[2] })
        ]),
        el("span", { class: "segmentado__check", "aria-hidden": "true" })
      ]);
    })));

    var youtube = entrada(it, "youtube", { type: "url", placeholder: "https://www.youtube.com/watch?v=…", inputmode: "url" });
    var previa = el("p", { class: "campo-ajuda campo-ajuda--ok" });
    function conferirYoutube() {
      var id = U.youtubeId(it.youtube);
      previa.textContent = !it.youtube ? "" : id ? "Vídeo reconhecido." : "Link não reconhecido. Cole o endereço completo do vídeo.";
      previa.className = "campo-ajuda " + (id ? "campo-ajuda--ok" : "campo-ajuda--erro");
    }
    youtube.addEventListener("input", conferirYoutube);
    conferirYoutube();

    var grupoYoutube = campo("Link do vídeo no YouTube", youtube, { ajuda: "Se o vídeo ainda não existe, deixe em branco: a página mostra \"vídeo em gravação\"." });
    grupoYoutube.appendChild(previa);

    return [
      publico,
      campo("Título", entrada(it, "titulo", { maxlength: "120" }), { obrigatorio: true, largo: true }),
      campo("Área ou tema", entrada(it, "area", { list: "areas-sugeridas", placeholder: "Ex.: Patologia geral" }), { ajuda: "As aulas aparecem agrupadas por área." }),
      lista,
      campo("Data", entrada(it, "data", { type: "date" }), { obrigatorio: true }),
      campo("Resumo", entrada(it, "resumo", { tag: "textarea", rows: "2", maxlength: "240" }), { obrigatorio: true, largo: true, ajuda: "Uma ou duas frases. Aparece no cartão da aula." }),
      grupoYoutube,
      campoCapa(it),
      campo("Ministrante", entrada(it, "ministrante", { placeholder: "Quem deu a aula" })),
      campo("Texto da aula", entrada(it, "texto", { tag: "textarea", rows: "10" }), {
        largo: true,
        ajuda: "Opcional. Linha em branco separa parágrafos. Comece a linha com \"## \" para um subtítulo, \"- \" para lista, \"1. \" para lista numerada. **assim** fica em negrito."
      }),
      campoMaterial(it),
      campo("Referências", entrada(it, "referencias", { tag: "textarea", rows: "3", placeholder: "Uma referência por linha" }), { largo: true })
    ];
  }

  /* Campo para enviar um PDF (material da aula ou arquivo do trabalho), com opção de link. */
  function campoPdf(it, o) {
    var grupo = el("div", { class: "campo-grupo campo-grupo--largo" });
    function desenhar() {
      var atual = it[o.chave];
      var filhos = [el("p", { class: "campo-rotulo", text: o.rotulo })];
      if (atual) {
        filhos.push(el("div", { class: "arquivo-atual" }, [
          el("span", { text: atual.nome || "Arquivo enviado" }),
          el("button", { type: "button", class: "botao botao--discreto", text: "Tirar arquivo", onclick: function () { delete it[o.chave]; desenhar(); } })
        ]));
      } else if (A.podeEnviarArquivos()) {
        var arquivo = el("input", { type: "file", accept: "application/pdf", class: "campo campo--arquivo", id: o.id, "aria-label": "Enviar " + o.rotulo });
        var status = el("p", { class: "campo-ajuda", text: o.ajuda || "" });
        arquivo.addEventListener("change", function () {
          var f = arquivo.files && arquivo.files[0];
          if (!f) return;
          status.textContent = "Enviando " + f.name + "…";
          A.enviarPdf(f).then(function (ref) { it[o.chave] = ref; desenhar(); }, function (e) {
            status.textContent = mensagemErro(e);
            status.className = "campo-ajuda campo-ajuda--erro";
          });
        });
        filhos.push(arquivo, status);
      }
      if (o.chaveLink) {
        filhos.push(entrada(it, o.chaveLink, { type: "url", placeholder: "Ou cole um link (Google Drive, por exemplo)", "aria-label": "Link de " + o.rotulo }));
      }
      grupo.replaceChildren.apply(grupo, filhos);
    }
    desenhar();
    return grupo;
  }

  function campoMaterial(it) {
    return campoPdf(it, { chave: "materialArquivo", chaveLink: "material", rotulo: "Material de apoio (PDF)", id: "material-arquivo" });
  }

  function camposProducao(it) {
    return [
      campo("Tipo", seletor(it, "tipo", TIPOS_PRODUCAO), { obrigatorio: true }),
      campo("Data", entrada(it, "data", { type: "date" }), { obrigatorio: true, ajuda: "Data da publicação ou da apresentação." }),
      campo("Título do trabalho", entrada(it, "titulo", { maxlength: "200" }), { obrigatorio: true, largo: true }),
      campo("Autores", entrada(it, "autores", { placeholder: "Sobrenome A, Sobrenome B" }), { obrigatorio: true, largo: true }),
      campo("Onde foi publicado ou apresentado", entrada(it, "onde", { placeholder: "Nome da revista ou do evento" }), { obrigatorio: true, largo: true }),
      campo("Resumo", entrada(it, "resumo", { tag: "textarea", rows: "4" }), { largo: true }),
      campoPdf(it, { chave: "arquivo", rotulo: "Arquivo do trabalho (PDF)", id: "producao-arquivo", ajuda: "Quem visita o site pode baixar o PDF." }),
      campo("Link", entrada(it, "link", { type: "url", placeholder: "https://…" }), { largo: true, ajuda: "Link para o artigo ou os anais do evento." })
    ];
  }

  function camposAtividade(it) {
    return [
      campo("Tipo", seletor(it, "tipo", TIPOS_ATIVIDADE), { obrigatorio: true, ajuda: "Extensão é a ação voltada para quem está fora da universidade." }),
      campo("Data", entrada(it, "data", { type: "date" }), { obrigatorio: true }),
      campo("Título", entrada(it, "titulo", { maxlength: "120" }), { obrigatorio: true, largo: true }),
      campo("Local", entrada(it, "local", { placeholder: "Ex.: Auditório da PUC Goiás" }), { largo: true }),
      campo("Texto", entrada(it, "texto", { tag: "textarea", rows: "6" }), { obrigatorio: true, largo: true, ajuda: "Linha em branco separa parágrafos." }),
      campoFotos(it),
      campo("Link da publicação no Instagram", entrada(it, "link", { type: "url", placeholder: "https://www.instagram.com/p/…" }), { largo: true })
    ];
  }

  /* Imagem de capa da aula: aparece no cartão e no alto da página enquanto não há vídeo. */
  function campoCapa(it) {
    var grupo = el("div", { class: "campo-grupo campo-grupo--largo" });
    function desenhar() {
      var filhos = [el("p", { class: "campo-rotulo", text: "Imagem de capa" })];
      if (it.capa) {
        var descricao = el("input", { class: "campo campo--pequeno", type: "text", placeholder: "Descreva a imagem em poucas palavras", "aria-label": "Descrição da imagem de capa" });
        descricao.value = it.capa.descricao || "";
        descricao.addEventListener("input", function () { it.capa.descricao = descricao.value; });
        filhos.push(el("div", { class: "capa-edicao" }, [
          el("img", { src: A.endereco(it.capa), alt: "" }),
          el("div", { class: "capa-edicao__lado" }, [
            descricao,
            el("button", { type: "button", class: "botao botao--discreto", text: "Tirar imagem", onclick: function () { delete it.capa; desenhar(); } })
          ])
        ]));
      } else if (A.podeEnviarArquivos()) {
        var arquivo = el("input", { type: "file", accept: "image/*", class: "campo campo--arquivo", id: "capa-arquivo", "aria-label": "Enviar a imagem de capa" });
        var status = el("p", { class: "campo-ajuda", text: "Opcional. Formato de tela de TV (16:9) fica melhor. Com vídeo do YouTube, a capa substitui a miniatura do vídeo." });
        arquivo.addEventListener("change", function () {
          var f = arquivo.files && arquivo.files[0];
          if (!f) return;
          status.textContent = "Enviando " + f.name + "…";
          A.enviarImagem(f).then(function (ref) { it.capa = Object.assign({ descricao: "" }, ref); desenhar(); }, function (e) {
            status.textContent = mensagemErro(e);
            status.className = "campo-ajuda campo-ajuda--erro";
          });
        });
        filhos.push(arquivo, status);
      }
      grupo.replaceChildren.apply(grupo, filhos);
    }
    desenhar();
    return grupo;
  }

  function campoFotos(it) {
    var grupo = el("div", { class: "campo-grupo campo-grupo--largo" });
    var status = el("p", { class: "campo-ajuda" });
    var grade = el("ul", { class: "fotos-edicao" });

    function desenharGrade() {
      grade.replaceChildren.apply(grade, it.fotos.map(function (f, i) {
        var legenda = el("input", { class: "campo campo--pequeno", type: "text", placeholder: "Descrição da foto", "aria-label": "Descrição da foto " + (i + 1) });
        legenda.value = f.descricao || "";
        legenda.addEventListener("input", function () { f.descricao = legenda.value; });
        return el("li", { class: "foto-edicao" + (f.enviando ? " foto-edicao--enviando" : "") }, [
          f.enviando ? el("span", { class: "foto-edicao__carregando", text: "Enviando…" }) : el("img", { src: A.endereco(f), alt: "" }),
          legenda,
          el("div", { class: "foto-edicao__acoes" }, [
            el("button", { type: "button", class: "botao botao--discreto", "aria-label": "Mover foto " + (i + 1) + " para antes", text: "←", disabled: i === 0, onclick: function () { mover(i, -1); } }),
            el("button", { type: "button", class: "botao botao--discreto", "aria-label": "Mover foto " + (i + 1) + " para depois", text: "→", disabled: i === it.fotos.length - 1, onclick: function () { mover(i, 1); } }),
            el("button", { type: "button", class: "botao botao--discreto", text: "Tirar", onclick: function () { it.fotos.splice(i, 1); desenharGrade(); } })
          ])
        ]);
      }));
    }
    function mover(i, d) {
      var j = i + d;
      var t = it.fotos[i]; it.fotos[i] = it.fotos[j]; it.fotos[j] = t;
      desenharGrade();
    }

    var filhos = [el("p", { class: "campo-rotulo", text: "Fotos" })];
    if (A.podeEnviarArquivos()) {
      var entradaFotos = el("input", { type: "file", accept: "image/*", multiple: true, class: "campo campo--arquivo", id: "fotos-arquivos", "aria-label": "Escolher fotos" });
      entradaFotos.addEventListener("change", function () {
        var arquivos = Array.prototype.slice.call(entradaFotos.files || []);
        entradaFotos.value = "";
        if (!arquivos.length) return;
        var marcadores = arquivos.map(function () { var m = { enviando: true, descricao: "" }; it.fotos.push(m); return m; });
        desenharGrade();
        var feitos = 0;
        status.className = "campo-ajuda";
        status.textContent = "Enviando 0 de " + arquivos.length + "…";
        /* uma de cada vez, para não pesar no navegador */
        arquivos.reduce(function (p, arq, k) {
          return p.then(function () {
            return A.enviarImagem(arq).then(function (ref) {
              Object.assign(marcadores[k], ref);
              delete marcadores[k].enviando;
            }, function () {
              var pos = it.fotos.indexOf(marcadores[k]);
              if (pos >= 0) it.fotos.splice(pos, 1);
            }).then(function () {
              feitos++;
              status.textContent = feitos < arquivos.length ? "Enviando " + feitos + " de " + arquivos.length + "…" : "Fotos prontas. Elas são reduzidas automaticamente para a web.";
              desenharGrade();
            });
          });
        }, Promise.resolve());
      });
      filhos.push(entradaFotos, el("p", { class: "campo-ajuda", text: A.modo === "local" ? "Na demonstração, prefira poucas fotos: o espaço do navegador é pequeno." : "Pode escolher várias de uma vez. A primeira foto abre o carrossel." }));
    } else {
      filhos.push(el("p", { class: "campo-ajuda", text: "O envio de fotos não está disponível para a sua conta nesta prévia." }));
    }
    filhos.push(status, grade);
    grupo.replaceChildren.apply(grupo, filhos);
    desenharGrade();
    return grupo;
  }

  /* ---------- troca de senha (site publicado) ---------- */
  function formularioSenha() {
    var nova = el("input", { id: "senha-nova", class: "campo", type: "password", autocomplete: "new-password" });
    var repetir = el("input", { id: "senha-repetir", class: "campo", type: "password", autocomplete: "new-password" });
    var erro = el("p", { class: "erro", role: "alert" });
    var salvar = el("button", { type: "submit", class: "botao", text: "Salvar nova senha" });
    var form = el("form", { class: "formulario bloco", novalidate: true }, [
      el("div", { class: "formulario__topo" }, [
        el("h2", { class: "titulo-item", text: "Trocar senha" }),
        el("p", { class: "texto-suave", text: "Use pelo menos 8 caracteres. A senha vale a partir da próxima entrada." })
      ]),
      el("div", { class: "formulario__campos" }, [
        el("label", { class: "campo-grupo", for: "senha-nova" }, [el("span", { class: "campo-rotulo", text: "Nova senha" }), nova]),
        el("label", { class: "campo-grupo", for: "senha-repetir" }, [el("span", { class: "campo-rotulo", text: "Repita a nova senha" }), repetir])
      ]),
      erro,
      el("div", { class: "formulario__botoes" }, [
        salvar,
        el("button", { type: "button", class: "botao botao--discreto", text: "Cancelar", onclick: function () { estado.trocandoSenha = false; renderizar(); } })
      ])
    ]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (nova.value.length < 8) { erro.textContent = "A senha precisa ter pelo menos 8 caracteres."; nova.focus(); return; }
      if (nova.value !== repetir.value) { erro.textContent = "As duas senhas não são iguais."; repetir.focus(); return; }
      erro.textContent = "";
      salvar.disabled = true;
      A.trocarSenha(nova.value).then(function () {
        estado.trocandoSenha = false;
        renderizar();
        U.aviso("Senha trocada.");
      }, function (err) {
        salvar.disabled = false;
        erro.textContent = (err && err.message) || "Não foi possível trocar a senha agora. Tente de novo.";
      });
    });
    setTimeout(function () { nova.focus(); }, 0);
    return form;
  }

  function mensagemErro(e) {
    var code = e && e.code;
    if (e && e.message && (code === "quota_exceeded" || code === "too_large")) return e.message;
    if (code === "invalid_argument" && A.modo === "supabase") return "O servidor recusou a publicação. Saia, entre de novo e tente outra vez.";
    if (code === "invalid_argument" || code === "not_granted") return "Sua conta não tem permissão para publicar nesta prévia.";
    if (code === "quota_or_state") return "O espaço de arquivos da prévia acabou. Remova fotos antigas e tente de novo.";
    if (code === "unsupported_type") return "Tipo de arquivo não aceito.";
    if (code === "sem_servidor") return "O painel ainda não está ligado a um servidor.";
    return "Não foi possível salvar agora. Tente de novo em instantes.";
  }
})();
