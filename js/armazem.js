/*
  Onde ficam os dados publicados pelos diretores.

  O site junta duas camadas:
  1. o conteúdo base, em js/conteudo.js;
  2. o que os diretores salvam pelo painel (essa camada vence quando o id é o mesmo).

  Modos de armazenamento:
  - "supabase": site publicado com o servidor configurado em js/conteudo.js (login com e-mail e senha).
  - "claude":   prévia publicada no claude.ai; quem tem acesso de Editor à prévia entra como diretor.
  - "local":    sem servidor; modo demonstração, salva só neste navegador.
  - "base":     somente leitura (sem painel).
  Todos oferecem as mesmas funções: itens, salvar, remover, enviarImagem, enviarPdf, entrar, sair.
*/
(function () {
  "use strict";
  var App = window.LAPACApp;
  var U = App.util;
  var BASE = window.LAPAC || {};
  var COLECOES = ["aulas", "producoes", "atividades"];
  var CHAVE_LOCAL = "lapac-demo-v1";
  var CHAVE_SESSAO = "lapac-sessao-v1";
  var BUCKET = "arquivos";

  var A = (App.armazem = {
    modo: "base",
    pronto: false,
    camada: { aulas: {}, producoes: {}, atividades: {} },
    sessao: null,
    ouvintes: []
  });
  var ns = { db: null, user: null, assets: null };
  var sb = null; /* cliente do Supabase */

  /* Quem clica no link de um e-mail do Supabase volta ao site com os dados no endereço
     (#access_token=...&type=signup ou type=recovery, ou #error_description=...).
     Guardamos o tipo antes que o cliente do Supabase leia e limpe o endereço. */
  A.retornoEmail = (function () {
    var h = (location.hash || "").replace(/^#/, "");
    if (!/(^|&)(access_token|error_description|error_code)=/.test(h)) return null;
    var p = {};
    h.split("&").forEach(function (par) {
      var i = par.indexOf("=");
      if (i > 0) { try { p[par.slice(0, i)] = decodeURIComponent(par.slice(i + 1).replace(/\+/g, " ")); } catch (e) { /* ignora */ } }
    });
    return { tipo: p.type || "", erro: p.error_code || (p.error_description ? "erro" : "") };
  })();
  function limparEnderecoDoEmail() {
    if (!A.retornoEmail) return;
    try { history.replaceState(null, "", location.pathname + location.search + "#login"); } catch (e) { /* ok */ }
  }
  function enderecoDeVolta() {
    return /^https?:/.test(location.protocol) ? location.origin + location.pathname : undefined;
  }

  A.aoMudar = function (fn) { A.ouvintes.push(fn); };
  function avisar(motivo) {
    A.ouvintes.forEach(function (fn) {
      try { fn(motivo); } catch (e) { console.error(e); }
    });
  }

  /* ---------- leitura combinada ---------- */
  A.itens = function (colecao, opcoes) {
    var porId = {};
    (BASE[colecao] || []).forEach(function (it) {
      porId[it.id] = Object.assign({ origem: "base" }, it);
    });
    var camada = A.camada[colecao] || {};
    Object.keys(camada).forEach(function (id) {
      var it = camada[id];
      if (!it) return;
      if (it.removido) delete porId[id];
      else porId[id] = Object.assign({}, it, { id: id, origem: "painel" });
    });
    var lista = Object.keys(porId).map(function (k) { return porId[k]; });
    if (!(opcoes && opcoes.incluirRascunhos)) {
      lista = lista.filter(function (it) { return (it.status || "publicado") === "publicado"; });
    }
    return lista.sort(U.porDataDesc);
  };

  A.item = function (colecao, id) {
    return A.itens(colecao, { incluirRascunhos: true }).filter(function (x) { return x.id === id; })[0] || null;
  };

  /* Endereço de uma foto ou arquivo guardado, conforme o modo em que foi salvo. */
  A.endereco = function (ref) {
    if (!ref) return "";
    if (typeof ref === "string") return ref;
    if (ref.asset) return "/_blob/" + ref.asset;
    return ref.src || "";
  };

  function corpoParaSalvar(item) {
    var corpo = JSON.parse(JSON.stringify(item));
    delete corpo.id;
    delete corpo.origem;
    corpo.atualizadoEm = new Date().toISOString();
    return corpo;
  }

  /* ======================= Supabase (site publicado) ======================= */
  function configSupabase() {
    var c = BASE.servidor || {};
    return c.supabaseUrl && c.supabaseChave && window.supabase && window.supabase.createClient ? c : null;
  }

  function carregarSupabase() {
    return sb.from("conteudos").select("colecao,id,dados").then(function (r) {
      if (r.error) throw r.error;
      var nova = { aulas: {}, producoes: {}, atividades: {} };
      (r.data || []).forEach(function (linha) {
        if (nova[linha.colecao]) nova[linha.colecao][linha.id] = linha.dados;
      });
      A.camada = nova;
      avisar("dados");
    }).catch(function (e) {
      console.warn("Não foi possível ler o conteúdo do servidor:", e && e.message);
    });
  }

  /* Confere se o e-mail da conta está na lista de diretores e monta a sessão. */
  function definirSessaoSupabase(sessao) {
    var email = (sessao.user && sessao.user.email) || "";
    return sb.from("diretores").select("nome,cargo").eq("email", email.toLowerCase()).maybeSingle().then(function (r) {
      if (r.error || !r.data) {
        return sb.auth.signOut().then(function () { throw { code: "sem_permissao" }; });
      }
      A.sessao = { modo: "supabase", id: sessao.user.id, email: email, nome: r.data.nome, cargo: r.data.cargo || "" };
    });
  }

  function iniciarSupabase(cfg) {
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseChave);
    A.modo = "supabase";
    sb.auth.onAuthStateChange(function (evento) {
      if (evento === "SIGNED_OUT" && A.sessao) {
        A.sessao = null;
        avisar("sessao");
        carregarSupabase();
      }
    });
    return sb.auth.getSession().then(function (r) {
      var sessao = r && r.data && r.data.session;
      if (sessao) return definirSessaoSupabase(sessao).catch(function () { A.sessao = null; });
    }).then(carregarSupabase);
  }

  function nomeArquivo(prefixo, extensao) {
    return prefixo + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + extensao;
  }

  function enviarAoSupabase(caminho, blob, tipo) {
    return sb.storage.from(BUCKET).upload(caminho, blob, { contentType: tipo, cacheControl: "31536000" }).then(function (r) {
      if (r.error) throw { code: "envio", message: "Não foi possível enviar o arquivo: " + r.error.message };
      return sb.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
    });
  }

  /* ======================= local (demonstração) ======================= */
  function lerLocal() {
    try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "{}") || {}; } catch (e) { return {}; }
  }
  function gravarLocal(dados) {
    try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify(dados)); return true; } catch (e) { return false; }
  }
  function carregarLocal() {
    var d = lerLocal();
    COLECOES.forEach(function (c) { A.camada[c] = d[c] || {}; });
  }
  function iniciarLocal() {
    var demo = !(BASE.painel && BASE.painel.demonstracao === false);
    A.modo = demo ? "local" : "base";
    if (A.modo === "local") {
      carregarLocal();
      try {
        var s = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || "null");
        if (s && s.modo === "local") A.sessao = s;
      } catch (e) { /* sem sessão guardada */ }
      window.addEventListener("storage", function (e) {
        if (e.key === CHAVE_LOCAL) { carregarLocal(); avisar("dados"); }
      });
    }
  }

  /* ======================= claude (prévia publicada) ======================= */
  function comPrazo(promessa, ms) {
    return Promise.race([promessa, new Promise(function (r) { setTimeout(function () { r(null); }, ms); })]);
  }
  function iniciarClaude(db) {
    ns.db = db;
    A.modo = "claude";
    COLECOES.forEach(function (col) {
      db.collection(col).onSnapshot(function (snap) {
        var mapa = {};
        snap.docs.forEach(function (d) { if (d.exists) mapa[d.id] = d.data(); });
        A.camada[col] = mapa;
        avisar("dados");
      }, function (erro) {
        console.warn("Leitura de " + col + " interrompida:", erro && erro.code);
      });
    });
    return Promise.all([window.claude.use("user"), window.claude.use("assets")]).then(function (r) {
      ns.user = r[0];
      ns.assets = r[1];
      try {
        if (sessionStorage.getItem(CHAVE_SESSAO) === "claude") return A.entrar();
      } catch (e) { /* sem sessão guardada */ }
    }).catch(function () { /* segue sem login */ });
  }

  /* ======================= início ======================= */
  A.iniciar = function () {
    var temClaude = window.claude && typeof window.claude.use === "function";
    var cfg = configSupabase();
    var inicio;
    if (temClaude) {
      inicio = comPrazo(window.claude.use("db"), 8000).then(function (db) {
        if (db) return iniciarClaude(db);
        A.modo = "base";
      }).catch(function () { A.modo = "base"; });
    } else if (cfg) {
      inicio = iniciarSupabase(cfg).catch(function (e) {
        console.warn("Servidor indisponível:", e && e.message);
      });
    } else {
      inicio = Promise.resolve(iniciarLocal());
    }
    return inicio.then(function () {
      limparEnderecoDoEmail();
      A.pronto = true;
      avisar("modo");
    });
  };

  /* ---------- sessão ---------- */
  A.entrar = function (a, b) {
    if (A.modo === "supabase") {
      var email = String(a || "").trim().toLowerCase();
      return sb.auth.signInWithPassword({ email: email, password: String(b || "") }).then(function (r) {
        if (r.error || !r.data || !r.data.session) throw { code: "credenciais" };
        return definirSessaoSupabase(r.data.session);
      }).then(function () {
        avisar("sessao");
        return carregarSupabase(); /* com login, os rascunhos também aparecem */
      });
    }
    if (A.modo === "claude") {
      if (!ns.user) return Promise.reject({ code: "sem_identidade" });
      return Promise.all([ns.user.me(), ns.user.canEdit()]).then(function (r) {
        var me = r[0], pode = r[1];
        if (!pode) throw { code: "sem_permissao" };
        A.sessao = { modo: "claude", id: me.id, nome: me.name || "", avatar: me.avatarUrl };
        try { sessionStorage.setItem(CHAVE_SESSAO, "claude"); } catch (e) { /* ok */ }
        avisar("sessao");
      });
    }
    if (A.modo === "local") {
      A.sessao = { modo: "local", nome: a || "" };
      try { sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(A.sessao)); } catch (e) { /* ok */ }
      avisar("sessao");
      return Promise.resolve();
    }
    return Promise.reject({ code: "sem_servidor" });
  };

  A.sair = function () {
    if (A.modo === "supabase") {
      A.sessao = null;
      avisar("sessao");
      return sb.auth.signOut().then(carregarSupabase);
    }
    A.sessao = null;
    try { sessionStorage.removeItem(CHAVE_SESSAO); } catch (e) { /* ok */ }
    avisar("sessao");
    return Promise.resolve();
  };

  /* Traduz as mensagens do Supabase (em inglês) para códigos que o painel entende. */
  function codigoDoErro(erro) {
    var m = String((erro && erro.message) || "").toLowerCase();
    if (m.indexOf("rate limit") >= 0 || m.indexOf("security purposes") >= 0 || m.indexOf("too many") >= 0) return "espera";
    if (m.indexOf("sending") >= 0 || m.indexOf("not authorized") >= 0) return "envio";
    if (m.indexOf("already") >= 0 || m.indexOf("registered") >= 0) return "ja_existe";
    if (m.indexOf("database error") >= 0 || m.indexOf("convite") >= 0) return "convite";
    if (m.indexOf("signup") >= 0 || m.indexOf("signups") >= 0) return "fechado";
    if (m.indexOf("different") >= 0) return "senha_igual";
    if (m.indexOf("weak") >= 0 || m.indexOf("at least") >= 0 || m.indexOf("password should") >= 0) return "senha_fraca";
    if (m.indexOf("expired") >= 0 || m.indexOf("invalid") >= 0 || m.indexOf("token") >= 0 || m.indexOf("otp") >= 0) return "codigo";
    return "rede";
  }
  function entrarComSessao(sessao) {
    return definirSessaoSupabase(sessao).then(function () {
      avisar("sessao");
      return carregarSupabase();
    });
  }

  /* Primeiro acesso: cria a conta do diretor. O servidor só aceita com a senha padrão certa
     (supabase/primeiro-acesso.sql). Com a confirmação de e-mail ligada no Supabase, a conta
     só fica ativa depois do código enviado ao e-mail: devolve { confirmar: true }. */
  A.criarConta = function (d) {
    if (A.modo !== "supabase") return Promise.reject({ code: "sem_servidor" });
    var email = String(d.email || "").trim().toLowerCase();
    return sb.auth.signUp({
      email: email,
      password: String(d.senha || ""),
      options: {
        data: { convite: String(d.convite || ""), nome: d.nome || "", cargo: d.cargo || "" },
        emailRedirectTo: enderecoDeVolta()
      }
    }).then(function (r) {
      if (r.error) throw { code: codigoDoErro(r.error) };
      var sessao = r.data && r.data.session;
      if (sessao) return entrarComSessao(sessao).then(function () { return { confirmar: false }; });
      var user = r.data && r.data.user;
      /* O Supabase devolve um usuário sem identidades quando o e-mail já tem conta confirmada. */
      if (user && Array.isArray(user.identities) && user.identities.length === 0) throw { code: "ja_existe" };
      return { confirmar: true };
    });
  };

  A.confirmarEmail = function (email, codigo) {
    if (A.modo !== "supabase") return Promise.reject({ code: "sem_servidor" });
    return sb.auth.verifyOtp({ email: String(email).trim().toLowerCase(), token: String(codigo).trim(), type: "signup" }).then(function (r) {
      if (r.error || !r.data || !r.data.session) throw { code: r.error ? codigoDoErro(r.error) : "codigo" };
      return entrarComSessao(r.data.session);
    });
  };

  A.reenviarCodigo = function (email) {
    if (A.modo !== "supabase") return Promise.reject({ code: "sem_servidor" });
    return sb.auth.resend({ type: "signup", email: String(email).trim().toLowerCase(), options: { emailRedirectTo: enderecoDeVolta() } }).then(function (r) {
      if (r.error) throw { code: codigoDoErro(r.error) };
    });
  };

  /* Esqueci minha senha: código por e-mail e senha nova. */
  var recuperando = null; /* e-mail cujo código já foi aceito, caso a troca da senha precise ser repetida */
  A.pedirCodigoSenha = function (email) {
    if (A.modo !== "supabase") return Promise.reject({ code: "sem_servidor" });
    recuperando = null;
    return sb.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), { redirectTo: enderecoDeVolta() }).then(function (r) {
      /* Por segurança, não contamos se o e-mail tem conta; só o limite de envios aparece. */
      var c = r.error ? codigoDoErro(r.error) : "";
      if (c === "espera" || c === "envio") throw { code: c };
    });
  };

  A.redefinirSenha = function (email, codigo, senha) {
    if (A.modo !== "supabase") return Promise.reject({ code: "sem_servidor" });
    email = String(email).trim().toLowerCase();
    var passo = recuperando === email ? Promise.resolve() :
      sb.auth.verifyOtp({ email: email, token: String(codigo).trim(), type: "recovery" }).then(function (r) {
        if (r.error || !r.data || !r.data.session) throw { code: r.error ? codigoDoErro(r.error) : "codigo" };
        recuperando = email;
      });
    return passo.then(function () {
      return sb.auth.updateUser({ password: String(senha || "") });
    }).then(function (r) {
      if (r.error) {
        var c = codigoDoErro(r.error);
        throw { code: c === "codigo" ? "rede" : c };
      }
      recuperando = null;
      return sb.auth.getSession();
    }).then(function (r) {
      var sessao = r && r.data && r.data.session;
      if (!sessao) throw { code: "rede" };
      return entrarComSessao(sessao);
    });
  };

  /* Troca a senha da conta conectada (só no site publicado, com Supabase). */
  A.trocarSenha = function (nova) {
    if (A.modo !== "supabase" || !A.sessao) return Promise.reject({ code: "sem_servidor" });
    return sb.auth.updateUser({ password: String(nova || "") }).then(function (r) {
      if (!r.error) return;
      var msg = String(r.error.message || "").toLowerCase();
      throw {
        code: "senha",
        message: msg.indexOf("different") >= 0
          ? "A nova senha precisa ser diferente da atual."
          : msg.indexOf("weak") >= 0 || msg.indexOf("at least") >= 0 || msg.indexOf("characters") >= 0
            ? "Senha fraca demais. Use mais caracteres, misturando letras e números."
            : msg.indexOf("session") >= 0 || msg.indexOf("jwt") >= 0
              ? "Sua sessão expirou. Saia, entre de novo e tente outra vez."
              : "Não foi possível trocar a senha agora. Tente de novo."
      };
    });
  };

  /* Nomes de quem atualizou cada item (na prévia guardamos só o id da pessoa). */
  A.nomes = function (ids) {
    if (A.modo !== "claude" || !ns.user || !ids.length) return Promise.resolve({});
    return ns.user.profiles(ids).then(function (perfis) {
      var mapa = {};
      Object.keys(perfis).forEach(function (id) { mapa[id] = perfis[id].name || ""; });
      return mapa;
    }).catch(function () { return {}; });
  };

  /* ---------- escrita ---------- */
  A.salvar = function (colecao, item) {
    var id = item.id;
    var corpo = corpoParaSalvar(item);

    if (A.modo === "supabase") {
      corpo.atualizadoPorNome = (A.sessao && A.sessao.nome) || "";
      return sb.from("conteudos").upsert({ colecao: colecao, id: id, dados: corpo, atualizado_em: corpo.atualizadoEm }).then(function (r) {
        if (r.error) throw { code: "invalid_argument", message: r.error.message };
        A.camada[colecao] = Object.assign({}, A.camada[colecao]);
        A.camada[colecao][id] = corpo;
        avisar("dados");
      });
    }
    if (A.modo === "claude") {
      corpo.atualizadoPor = (A.sessao && A.sessao.id) || "";
      return ns.db.collection(colecao).doc(id).set(corpo);
    }
    if (A.modo === "local") {
      corpo.atualizadoPorNome = (A.sessao && A.sessao.nome) || "";
      var dados = lerLocal();
      dados[colecao] = dados[colecao] || {};
      dados[colecao][id] = corpo;
      if (!gravarLocal(dados)) {
        return Promise.reject({ code: "quota_exceeded", message: "O espaço do navegador para a demonstração acabou. Remova fotos ou itens antigos." });
      }
      A.camada[colecao] = dados[colecao];
      avisar("dados");
      return Promise.resolve();
    }
    return Promise.reject({ code: "sem_servidor" });
  };

  A.remover = function (colecao, id) {
    var ehBase = (BASE[colecao] || []).some(function (x) { return x.id === id; });
    if (ehBase) return A.salvar(colecao, { id: id, removido: true });
    if (A.modo === "supabase") {
      return sb.from("conteudos").delete().eq("colecao", colecao).eq("id", id).then(function (r) {
        if (r.error) throw { code: "invalid_argument", message: r.error.message };
        A.camada[colecao] = Object.assign({}, A.camada[colecao]);
        delete A.camada[colecao][id];
        avisar("dados");
      });
    }
    if (A.modo === "claude") return ns.db.collection(colecao).doc(id).delete();
    if (A.modo === "local") {
      var dados = lerLocal();
      if (dados[colecao]) delete dados[colecao][id];
      gravarLocal(dados);
      A.camada[colecao] = dados[colecao] || {};
      avisar("dados");
      return Promise.resolve();
    }
    return Promise.reject({ code: "sem_servidor" });
  };

  /* Fotos: reduzidas no navegador antes de enviar. Devolve {asset} ou {src}. */
  A.enviarImagem = function (arquivo) {
    var local = A.modo === "local";
    return U.reduzirImagem(arquivo, local ? 1200 : 1600, local ? 0.72 : 0.8).then(function (blob) {
      if (A.modo === "supabase") {
        return enviarAoSupabase(nomeArquivo("fotos", "jpg"), blob, "image/jpeg").then(function (url) { return { src: url }; });
      }
      if (A.modo === "claude" && ns.assets) {
        return ns.assets.upload(blob, { type: "image/jpeg" }).then(function (r) { return { asset: r.id }; });
      }
      return U.blobParaDataUrl(blob).then(function (url) { return { src: url }; });
    });
  };

  A.enviarPdf = function (arquivo) {
    if (A.modo === "supabase") {
      if (arquivo.size > 45 * 1024 * 1024) return Promise.reject({ code: "too_large", message: "O PDF pode ter até 45 MB." });
      return enviarAoSupabase(nomeArquivo("materiais", "pdf"), arquivo, "application/pdf").then(function (url) {
        return { src: url, nome: arquivo.name };
      });
    }
    if (A.modo === "claude" && ns.assets) {
      return ns.assets.upload(arquivo, { type: "application/pdf" }).then(function (r) {
        return { asset: r.id, nome: arquivo.name };
      });
    }
    if (arquivo.size > 1.5 * 1024 * 1024) {
      return Promise.reject({ code: "too_large", message: "Na demonstração, o PDF pode ter até 1,5 MB. No site publicado o limite é maior." });
    }
    return U.blobParaDataUrl(arquivo).then(function (url) { return { src: url, nome: arquivo.name }; });
  };

  A.podeEnviarArquivos = function () {
    return A.modo === "local" || A.modo === "supabase" || (A.modo === "claude" && !!ns.assets);
  };

  A.limparDemonstracao = function () {
    if (A.modo !== "local") return;
    try { localStorage.removeItem(CHAVE_LOCAL); } catch (e) { /* ok */ }
    carregarLocal();
    avisar("dados");
  };
})();
