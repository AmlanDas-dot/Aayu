"""
LLM Service — Ollama (offline) and Gemini (online).

Usage:
    from app.services.llm_service import get_llm_response, check_connectivity

    online = await check_connectivity()
    response = await get_llm_response(query, context, language, prefer_online=online)
"""

from __future__ import annotations

import sys
print("Interpreter:", sys.executable)
import logging
import os
import time
import traceback
from typing import Any

import httpx

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL    = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

_SYSTEM_PROMPT = """You are AAYU, an AI health assistant designed to help rural populations in India.
You provide clear, simple, actionable health guidance in plain language.
Always recommend consulting a healthcare professional for serious conditions.
Keep responses concise — 3 to 5 sentences maximum unless the condition is an emergency.
Never diagnose. Never prescribe specific medications by name."""

PROMPT_GENERAL_HEALTH = _SYSTEM_PROMPT

PROMPT_MENTAL_HEALTH = """You are AAYU, a highly empathetic and supportive AI health assistant.
The user is seeking emotional support or mental health guidance.
Your tone must be warm, reassuring, and non-judgmental.
Listen to them and validate their feelings.
Do not diagnose mental health conditions.
Encourage them to speak to loved ones or a mental health professional if they are in distress."""

PROMPT_CASUAL_CHAT = """You are AAYU, a friendly and conversational AI health assistant.
The user is making casual conversation or greeting you.
Respond warmly and naturally. Keep it brief.
If they ask how you are, reply cheerfully and ask how you can help them with their health, nutrition, or government schemes today."""

PROMPT_DISEASE_INFO = """You are AAYU, an AI health assistant.
The user is asking about a specific disease or health condition.
Use the provided knowledge base context to explain the disease simply and clearly.
Avoid medical jargon. Keep responses concise — 3 to 5 sentences.
Always recommend consulting a doctor for actual medical concerns."""

PROMPT_NUTRITION = """You are AAYU, an AI health assistant specializing in nutrition.
The user is asking about food, diet, or nutrition.
Use the provided nutrition context to give relevant dietary advice.
Suggest specific local foods if they are in the context.
Keep your response concise, practical, and easy to understand."""

PROMPT_SCHEMES = """You are AAYU, an AI health assistant knowledgeable about government schemes.
The user is asking about health or welfare schemes.
Use the provided context to explain the scheme, its benefits, and basic eligibility.
Keep the explanation clear and straightforward. Avoid bureaucratic jargon."""


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


async def _ollama(query: str, context: str, history: list[dict[str, str]] = None, system_prompt: str = None, max_tokens: int = 300) -> str:
    """Call Ollama local API."""
    prompt = _build_prompt(query, context)
    messages = [{"role": "system", "content": system_prompt or _SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": max_tokens},
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


async def _openai(query: str, context: str, history: list[dict[str, str]] = None, system_prompt: str = None, max_tokens: int = 300) -> str:
    """Call OpenAI API."""
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError("OpenAI error: No module named 'openai'") from exc

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set in environment.")

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        messages = [{"role": "system", "content": system_prompt or _SYSTEM_PROMPT}]
        if history:
            messages.extend(history)
            
        prompt = _build_prompt(query, context)
        messages.append({"role": "user", "content": prompt})

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=max_tokens,
        )

        response_text = response.choices[0].message.content
        if not response_text:
            raise RuntimeError("OpenAI returned an empty response.")

        return response_text.strip()

    except Exception as exc:
        logger.error("[LLM] OpenAI raw exception:\n%s", traceback.format_exc())
        raise RuntimeError(f"OpenAI error: {exc}") from exc


async def get_llm_response(
    query: str,
    context: str,
    language: str = "en",
    prefer_online: bool = False,
    history: list[dict[str, str]] = None,
    system_prompt: str = None,
    max_tokens: int = 300,
) -> tuple[str, str]:
    """
    Generate a response using OpenAI (online) or Ollama (offline).

    Returns (response_text, provider_used) where provider_used is "openai" or "ollama".

    Falls back to Ollama if OpenAI fails, and vice versa.
    Falls back to empty string if both fail (caller handles the fallback gracefully).
    """
    providers = (["openai", "ollama"] if prefer_online else ["ollama", "openai"])

    for provider in providers:
        try:
            t0 = time.time()
            if provider == "openai":
                logger.info("[LLM] Using OpenAI")
                text = await _openai(query, context, history, system_prompt, max_tokens)
            else:
                text = await _ollama(query, context, history, system_prompt, max_tokens)
            elapsed_ms = round((time.time() - t0) * 1000)
            logger.info("[LLM] %s responded in %d ms.", provider, elapsed_ms)
            return text, provider
        except RuntimeError as exc:
            logger.warning("[LLM] %s failed:\n%s\nTrying next provider.", provider, traceback.format_exc())

    logger.error("[LLM] All providers failed.")
    return "The AI service is currently unavailable.", "none"
