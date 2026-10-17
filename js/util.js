/* Utilidades usadas por todo o site. */
(function () {
  "use strict";
  var U = (window.LAPACApp = window.LAPACApp || {}).util = {};

  /* Cria um elemento. Texto vindo de dados sempre entra como texto, nunca como HTML. */
  U.el = function (tag, atributos, filhos) {
    var n = document.createElement(tag);
    if (atributos) {
      Object.keys(atributos).forEach(function (k) {
        var v = atributos[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") n.className = v;
        else if (k === "text") n.textContent = v;
        else if (k === "html") n.innerHTML = v; /* só para SVG fixo escrito no código */
        else if (k.slice(0, 2) === "on" && typeof v === "function") n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? "" : v);
      });
    }
    (filhos || []).forEach(function (f) {
      if (f === null || f === undefined || f === false) return;
      n.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return n;
  };

  U.dataBR = function (iso) {
    if (!iso) return "";
    var p = String(iso).slice(0, 10).split("-");
    if (p.length !== 3) return iso;
    return p[2] + "/" + p[1] + "/" + p[0];
  };

  U.hojeISO = function () {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + dia;
  };

  U.porDataDesc = function (a, b) {
    return String(b.data || "").localeCompare(String(a.data || ""));
  };

  U.slug = function (texto) {
    return String(texto || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      .slice(0, 48) || "item";
  };

  /* ---------- busca ---------- */
  /* Tira acentos e deixa em minúsculas, caractere por caractere (as posições batem com o texto original). */
  function semAcentoChar(c) {
    var n = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return n.length === 1 ? n : c.toLowerCase().charAt(0);
  }
  U.semAcento = function (texto) {
    return Array.prototype.map.call(String(texto || ""), semAcentoChar).join("");
  };
  /* "Hemograma  anemia" -> ["hemograma", "anemia"] */
  U.termosBusca = function (consulta) {
    return U.semAcento(consulta).split(/\s+/).filter(function (t) { return t.length > 0; });
  };
  /* Verdadeiro se todos os termos aparecem em algum dos textos. */
  U.combina = function (textos, termos) {
    if (!termos.length) return true;
    var tudo = U.semAcento(textos.filter(Boolean).join(" \u0001 "));
    return termos.every(function (t) { return tudo.indexOf(t) >= 0; });
  };
  /* Devolve o texto com os termos encontrados marcados em <mark>. */
  U.destacar = function (texto, termos) {
    texto = String(texto || "");
    var frag = document.createDocumentFragment();
    if (!termos || !termos.length || !texto) { frag.appendChild(document.createTextNode(texto)); return frag; }
    var base = U.semAcento(texto);
    var marcas = new Array(texto.length);
    termos.forEach(function (t) {
      var i = base.indexOf(t);
      while (i >= 0) {
        for (var k = i; k < i + t.length; k++) marcas[k] = true;
        i = base.indexOf(t, i + t.length);
      }
    });
    var ini = 0;
    for (var j = 1; j <= texto.length; j++) {
      if (j === texto.length || !!marcas[j] !== !!marcas[ini]) {
        var pedaco = texto.slice(ini, j);
        frag.appendChild(marcas[ini] ? U.el("mark", { class: "achado", text: pedaco }) : document.createTextNode(pedaco));
        ini = j;
      }
    }
    return frag;
  };

  U.novoId = function (titulo) {
    return U.slug(titulo) + "-" + Math.random().toString(36).slice(2, 6);
  };

  /* Aceita link completo do YouTube ou só o código de 11 caracteres. */
  U.youtubeId = function (valor) {
    var v = String(valor || "").trim();
    if (!v) return "";
    if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    var m = v.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  };

  /* Negrito com **texto**, montado como nós (sem HTML vindo de dados). */
  function linhaComNegrito(texto) {
    var frag = document.createDocumentFragment();
    var partes = String(texto).split("**");
    partes.forEach(function (p, i) {
      if (!p) return;
      frag.appendChild(i % 2 === 1 ? U.el("strong", { text: p }) : document.createTextNode(p));
    });
    return frag;
  }

  /* Formatação simples: parágrafos, "## subtítulo", "- lista", "1. lista numerada", **negrito**. */
  U.renderTexto = function (texto) {
    var raiz = U.el("div", { class: "texto-formatado" });
    var lista = null, tipoLista = "", paragrafo = [];
    function fecharParagrafo() {
      if (paragrafo.length) {
        var p = U.el("p");
        p.appendChild(linhaComNegrito(paragrafo.join(" ")));
        raiz.appendChild(p);
        paragrafo = [];
      }
    }
    function fecharLista() { lista = null; tipoLista = ""; }
    String(texto || "").split(/\r?\n/).forEach(function (bruta) {
      var linha = bruta.trim();
      var m;
      if (!linha) { fecharParagrafo(); fecharLista(); return; }
      if ((m = linha.match(/^#{2,3}\s+(.*)$/))) {
        fecharParagrafo(); fecharLista();
        raiz.appendChild(U.el("h3", { text: m[1] }));
      } else if ((m = linha.match(/^[-•]\s+(.*)$/))) {
        fecharParagrafo();
        if (tipoLista !== "ul") { lista = U.el("ul"); tipoLista = "ul"; raiz.appendChild(lista); }
        var li = U.el("li"); li.appendChild(linhaComNegrito(m[1])); lista.appendChild(li);
      } else if ((m = linha.match(/^\d+[.)]\s+(.*)$/))) {
        fecharParagrafo();
        if (tipoLista !== "ol") { lista = U.el("ol"); tipoLista = "ol"; raiz.appendChild(lista); }
        var li2 = U.el("li"); li2.appendChild(linhaComNegrito(m[1])); lista.appendChild(li2);
      } else {
        fecharLista();
        paragrafo.push(linha);
      }
    });
    fecharParagrafo();
    return raiz;
  };

  /* Aviso curto no canto da tela. */
  U.aviso = function (texto, tipo) {
    var area = document.getElementById("avisos");
    if (!area) {
      area = U.el("div", { id: "avisos", class: "avisos", "aria-live": "polite" });
      document.body.appendChild(area);
    }
    var a = U.el("div", { class: "aviso" + (tipo ? " aviso--" + tipo : ""), text: texto });
    area.appendChild(a);
    setTimeout(function () { a.classList.add("aviso--saindo"); }, 3200);
    setTimeout(function () { a.remove(); }, 3700);
  };

  /* Reduz uma foto escolhida no formulário para no máximo `lado` px, em JPEG. */
  U.reduzirImagem = function (arquivo, lado, qualidade) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(arquivo);
      var img = new Image();
      img.onload = function () {
        var escala = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
        var w = Math.round(img.naturalWidth * escala), h = Math.round(img.naturalHeight * escala);
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(function (blob) {
          if (blob) resolve(blob); else reject(new Error("Não foi possível processar a imagem."));
        }, "image/jpeg", qualidade || 0.8);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Arquivo de imagem inválido.")); };
      img.src = url;
    });
  };

  U.blobParaDataUrl = function (blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(blob);
    });
  };

  U.copiar = function (texto, campo) {
    try {
      navigator.clipboard.writeText(texto).then(function () { U.aviso("Copiado."); }, function () {
        if (campo) { campo.focus(); campo.select(); }
      });
    } catch (e) {
      if (campo) { campo.focus(); campo.select(); }
    }
  };

  U.prefereMenosMovimento = function () {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };
})();
