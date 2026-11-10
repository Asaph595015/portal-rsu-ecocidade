"""EcoCidade - servidor do portal + API de avaliações do cliente.

Variáveis de ambiente:
  ADMIN_PASSWORD  (obrigatória) senha para ver/excluir avaliações em resultado.html
  DATA_DIR        (opcional)    pasta onde salvar as avaliações (padrão: ./data)
"""
import hmac
import json
import os
import threading
import uuid
from datetime import datetime, timezone

from flask import Flask, abort, jsonify, request, send_from_directory

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR", os.path.join(BASE, "data"))
DATA_FILE = os.path.join(DATA_DIR, "avaliacoes.json")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
LOCK = threading.Lock()

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024  # 100 KB por envio

DECISOES = {"manter", "modificar", "retirar", "adicionar", "não avaliado"}


def ler():
    try:
        with open(DATA_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def gravar(lista):
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = DATA_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)
    os.replace(tmp, DATA_FILE)


def txt(valor, limite):
    return str(valor or "").strip()[:limite]


def exige_admin():
    if not ADMIN_PASSWORD:
        abort(503, description="ADMIN_PASSWORD não configurada no servidor.")
    enviada = request.headers.get("X-Admin-Password", "")
    if not hmac.compare_digest(enviada.encode(), ADMIN_PASSWORD.encode()):
        abort(401, description="Senha incorreta.")


@app.errorhandler(401)
@app.errorhandler(413)
@app.errorhandler(503)
def erro(e):
    return jsonify(erro=e.description), e.code


@app.post("/api/avaliacoes")
def enviar():
    d = request.get_json(silent=True)
    if not isinstance(d, dict):
        return jsonify(erro="Dados inválidos."), 400
    reviews = []
    for r in (d.get("reviews") or [])[:30]:
        if not isinstance(r, dict):
            continue
        decisao = txt(r.get("decision"), 20)
        reviews.append({
            "section": txt(r.get("section"), 120),
            "decision": decisao if decisao in DECISOES else "não avaliado",
            "comment": txt(r.get("comment"), 2000),
        })
    client = d.get("client") if isinstance(d.get("client"), dict) else {}
    registro = {
        "id": uuid.uuid4().hex[:12],
        "submittedAt": datetime.now(timezone.utc).isoformat(),
        "client": {"name": txt(client.get("name"), 150), "contact": txt(client.get("contact"), 150)},
        "reviews": reviews,
        "newIdeas": txt(d.get("newIdeas"), 5000),
        "finalApproval": bool(d.get("finalApproval")),
    }
    with LOCK:
        lista = ler()
        lista.append(registro)
        gravar(lista)
    return jsonify(ok=True, id=registro["id"]), 201


@app.get("/api/avaliacoes")
def listar():
    exige_admin()
    with LOCK:
        lista = ler()
    return jsonify(sorted(lista, key=lambda x: x["submittedAt"], reverse=True))


@app.delete("/api/avaliacoes/<aid>")
def excluir(aid):
    exige_admin()
    with LOCK:
        lista = ler()
        nova = [a for a in lista if a["id"] != aid]
        gravar(nova)
    return jsonify(ok=True, removidas=len(lista) - len(nova))


# ---- arquivos estáticos (somente o que faz parte do site) ----
@app.get("/")
def home():
    return send_from_directory(BASE, "index.html")


@app.get("/<path:caminho>")
def estaticos(caminho):
    pastas = ("css/", "js/", "img/")
    if caminho.endswith(".html") and "/" not in caminho or caminho.startswith(pastas):
        return send_from_directory(BASE, caminho)
    abort(404)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
