"""
LLM Service — Ollama (offline) and Gemini (online).

Usage:
    from app.services.llm_service import get_llm_response, check_connectivity

    online = await check_connectivity()
    response = await get_llm_response(query, context, language, prefer_online=online)
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY", "")

_SYSTEM_PROMPT = """You are AAYU, an AI health assistant designed to help rural populations in India.
You provide clear, simple, actionable health guidance in plain language.
Always recommend consulting a healthcare professional for serious conditions.
Keep responses concise — 3 to 5 sentences maximum unless the condition is an emergency.
Never diagnose. Never prescribe specific medications by name."""

_CONNECTIVITY_CACHE: dict[str, Any] = {"online": None, "checked_at": 0.0}
_CONNECTIVITY_TTL = 30.0  # re-check every 30 seconds


async def check_connectivity() -> bool:
    """Return True if internet is reachable. Result cached for 30 seconds."""
    now = time.time()
    if (
        _CONNECTIVITY_CACHE["online"] is not None
        and now - _CONNECTIVITY_CACHE["checked_at"] < _CONNECTIVITY_TTL
    ):
        return bool(_CONNECTIVITY_CACHE["online"])

    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            await client.get("https://dns.google")
        _CONNECTIVITY_CACHE["online"] = True
    except Exception:
        _CONNECTIVITY_CACHE["online"] = False

    _CONNECTIVITY_CACHE["checked_at"] = now
    logger.info("[LLM] Connectivity: %s", "online" if _CONNECTIVITY_CACHE["online"] else "offline")
    return bool(_CONNECTIVITY_CACHE["online"])


def _build_prompt(query: str, context: str) -> str:
    return (
        f"The patient asks: {query}\n\n"
        f"Relevant health knowledge:\n{context}\n\n"
        "Provide clear, safe guidance based on the above information. "
        "If this appears to be an emergency, say so clearly and advise calling 108 immediately."
    )


async def _ollama(query: str, context: str, history: list[dict[str, str]] = None) -> str:
    """Call Ollama local API."""
    prompt = _build_prompt(query, context)
    messages = [{"role": "system", "content": _SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": 300},
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"].strip()
    except httpx.ConnectError:
        raise RuntimeError(
            "Ollama is not running. Start it with: ollama serve"
        )
    except Exception as exc:
        raise RuntimeError(f"Ollama error: {exc}") from exc


async def _gemini(query: str, context: str, history: list[dict[str, str]] = None) -> str:
    """Call Gemini API."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set in environment.")
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Structure the chat/contents with history
        contents = []
        if history:
            for turn in history:
                role = "user" if turn["role"] == "user" else "model"
                contents.append({"role": role, "parts": [turn["content"]]})
        
        prompt = _build_prompt(query, context)
        contents.append({"role": "user", "parts": [prompt]})
        
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=_SYSTEM_PROMPT,
        )
        response = model.generate_content(
            contents,
            generation_config={"temperature": 0.3, "max_output_tokens": 300},
        )
        return response.text.strip()
    except Exception as exc:
        raise RuntimeError(f"Gemini error: {exc}") from exc


async def get_llm_response(
    query: str,
    context: str,
    language: str = "en",
    prefer_online: bool = False,
    history: list[dict[str, str]] = None,
) -> tuple[str, str]:
    """
    Generate a response using Gemini (online) or Ollama (offline).

    Returns (response_text, provider_used) where provider_used is "gemini" or "ollama".

    Falls back to Ollama if Gemini fails, and vice versa.
    Falls back to empty string if both fail (caller handles the fallback gracefully).
    """
    providers = (["gemini", "ollama"] if prefer_online else ["ollama", "gemini"])

    for provider in providers:
        try:
            t0 = time.time()
            if provider == "gemini":
                text = await _gemini(query, context, history)
            else:
                text = await _ollama(query, context, history)
            elapsed_ms = round((time.time() - t0) * 1000)
            logger.info("[LLM] %s responded in %d ms.", provider, elapsed_ms)
            return text, provider
        except RuntimeError as exc:
            logger.warning("[LLM] %s failed: %s — trying next provider.", provider, exc)

    logger.error("[LLM] All providers failed.")
    return "", "none"
