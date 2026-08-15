"""Chatbot endpoint — proxies to GroqCloud (with a graceful fallback)."""
from flask import Blueprint, request, jsonify

import chatbot

bp = Blueprint("chat", __name__, url_prefix="/api")


@bp.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []
    if not message:
        return jsonify({"error": "Message is required."}), 400

    out = chatbot.reply(message, history)
    return jsonify(out)
