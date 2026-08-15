"""SpineGuard assistant, backed by GroqCloud's OpenAI-compatible chat API.

If no GROQ_API_KEY is configured (or Groq is unreachable), we degrade gracefully
to the keyword-based canned replies that shipped in the frontend, so the chatbot
never hard-fails.
"""
import logging

import requests
from flask import current_app

log = logging.getLogger("chatbot")

SYSTEM_PROMPT = (
    "You are the SpineGuard assistant, a friendly, concise veterinary information "
    "helper specializing in canine Intervertebral Disc Disease (IVDD). Explain "
    "IVDD, high-risk (chondrodystrophic) breeds like Dachshunds, French Bulldogs "
    "and Corgis, the 1-5 neurological grading scale, warning signs, and general "
    "next steps. Keep answers short (2-4 sentences), warm, and easy to understand. "
    "Always remind users that this is informational only and not a substitute for "
    "an in-person veterinary diagnosis when discussing a specific dog. Never invent "
    "medication dosages."
)


def _fallback_reply(text: str) -> str:
    t = (text or "").lower()

    def has(*words):
        return any(w in t for w in words)

    if has("what is", "what's", "ivdd", "disc disease", "explain"):
        return ("IVDD (Intervertebral Disc Disease) is when the cushioning discs "
                "between a dog's vertebrae bulge or rupture, pressing on the spinal "
                "cord. It ranges from back pain to paralysis, and is most common in "
                "long-backed breeds.")
    if has("breed", "dachshund", "corgi", "frenchie", "french bulldog", "risk"):
        return ("Chondrodystrophic breeds — Dachshunds, French Bulldogs, Corgis, "
                "Beagles, Shih Tzus, Basset Hounds — are far more prone to IVDD "
                "because their discs calcify early. SpineGuard weighs breed heavily "
                "in its estimate.")
    if has("grade", "neuro", "scale"):
        return ("The neurological grade runs 1-5: 1 = pain only, 2 = walks but "
                "wobbly, 3 = can't walk but moves legs, 4 = paralysed with deep "
                "pain, 5 = no deep pain sensation. Higher grades need faster "
                "surgical assessment.")
    if has("symptom", "sign", "hunch", "drag", "knuckl", "pain"):
        return ("Watch for a hunched back, reluctance to jump or climb stairs, "
                "yelping when touched, wobbly hind legs, dragging paws (knuckling), "
                "or loss of bladder control. Sudden onset is a red flag.")
    if has("treat", "surger", "rest", "help", "next"):
        return ("Mild cases often improve with strict crate rest and "
                "anti-inflammatories; severe or worsening cases may need surgery. "
                "Always confirm with your vet — early care makes a big difference.")
    if has("hi", "hello", "hey", "thanks", "thank"):
        return ("Happy to help! Ask me anything about IVDD, breed risk, symptoms, "
                "or how to read your result.")
    return ("I can explain IVDD, which breeds are high-risk, what neurological "
            "grades mean, warning signs to watch for, and next steps. What would "
            "you like to know?")


def reply(message: str, history: list | None = None) -> dict:
    """Return {"reply": str, "source": "groq"|"fallback"}."""
    api_key = current_app.config["GROQ_API_KEY"]
    if not api_key:
        return {"reply": _fallback_reply(message), "source": "fallback"}

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in (history or [])[-8:]:  # keep the last few turns for context
        role = "assistant" if turn.get("from") == "bot" else "user"
        content = turn.get("text", "")
        if content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    try:
        resp = requests.post(
            current_app.config["GROQ_URL"],
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": current_app.config["GROQ_MODEL"],
                "messages": messages,
                "temperature": 0.4,
                "max_tokens": 400,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        return {"reply": content, "source": "groq"}
    except Exception as exc:  # noqa: BLE001
        log.warning("Groq call failed (%s); using fallback reply.", exc)
        return {"reply": _fallback_reply(message), "source": "fallback"}
