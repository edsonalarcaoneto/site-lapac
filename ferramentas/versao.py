#!/usr/bin/env python3
"""Marca uma versão nova nos arquivos do site (css e js) dentro do index.html.

O GitHub Pages manda o navegador guardar cada arquivo por 10 minutos. Com o número
de versão no endereço (ex.: js/app.js?v=20261017-1930), o navegador baixa o arquivo novo
assim que o index.html muda. Rode antes de cada envio ao GitHub:

    python3 ferramentas/versao.py
"""
import datetime
import pathlib
import re

raiz = pathlib.Path(__file__).resolve().parent.parent
index = raiz / "index.html"
versao = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
texto = index.read_text(encoding="utf-8")
novo, n = re.subn(r'((?:src|href)="(?:js|css)/[^"?]+\.(?:js|css))(?:\?v=[^"]*)?"', r'\1?v=' + versao + '"', texto)
index.write_text(novo, encoding="utf-8")
print(f"versão {versao} em {n} arquivos")
