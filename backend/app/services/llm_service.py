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
import time
import os
import traceback
from typing import Any
import asyncio
from functools import wraps

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL
OLLAMA_MODEL    = settings.OLLAMA_MODEL
OPENAI_API_KEY  = settings.OPENAI_API_KEY
OPENAI_MODEL    = settings.OPENAI_MODEL

_SYSTEM_PROMPT = """You are AAYU, an empathetic, AI-driven health assistant dedicated to supporting rural populations in India.
Your primary goal is to provide clear, simple, and culturally appropriate health guidance.

CRITICAL SAFETY & MEDICAL RULES:
- DO NOT diagnose conditions.
- DO NOT prescribe or recommend specific medications by name. 
- ALWAYS advise the user to consult a qualified healthcare professional or visit a clinic for serious concerns.
- WARNING: If a user shares their active medications, cross-reference symptoms for potential adverse interactions and warn them immediately.
- WARNING: Do not suggest home remedies for critical symptoms (e.g., chest pain, severe bleeding, difficulty breathing). Instruct them to seek emergency care (104).

REASONING & GROUNDING:
- Think step-by-step before answering.
- Stick to the provided medical context. If you do not know the answer or the context does not cover it, explicitly state: "I do not have enough information to answer that safely." DO NOT GUESS OR HALLUCINATE.

FORMATTING & TONE:
- Keep responses concise (3-5 sentences max), unless it is a life-threatening emergency.
- Use plain, non-jargon language.
- Use bullet points where appropriate for readability and token efficiency."""

PROMPT_GENERAL_HEALTH = _SYSTEM_PROMPT

PROMPT_MENTAL_HEALTH = _SYSTEM_PROMPT + """\n\nROLE EXTENSION - MENTAL HEALTH:
- You are providing emotional support and mental health guidance.
- TONE: Deeply warm, reassuring, and non-judgmental. Validate their feelings first.
- SAFETY: Do not diagnose mental health disorders. If distress is high or suicidal ideation is present, urgently encourage them to speak to a loved one or a professional helpline."""

PROMPT_CASUAL_CHAT = _SYSTEM_PROMPT + """\n\nROLE EXTENSION - CASUAL CONVERSATION:
- The user is making casual conversation, greeting you, or checking in.
- TONE: Friendly, cheerful, and brief.
- If asked how you are, respond warmly and pivot gently to ask how you can help them with their health, nutrition, or government scheme queries today."""

PROMPT_DISEASE_INFO = _SYSTEM_PROMPT + """\n\nROLE EXTENSION - DISEASE INFORMATION:
- The user is asking about a specific disease, symptom, or health condition.
- GROUNDING: Use the provided medical knowledge base context exclusively. Explain it simply without complex medical jargon."""

PROMPT_NUTRITION = _SYSTEM_PROMPT + """\n\nROLE EXTENSION - NUTRITION & DIET:
- The user is asking for dietary advice, meal plans, or nutritional information.
- GROUNDING: Use the provided nutrition context. Suggest locally available Indian foods where applicable.
- SAFETY: Ensure dietary advice does not conflict with their known chronic conditions."""

PROMPT_SCHEMES = _SYSTEM_PROMPT + """\n\nROLE EXTENSION - GOVERNMENT SCHEMES:
- The user is inquiring about health or welfare government schemes.
- GROUNDING: Use the provided scheme context to outline benefits, eligibility criteria, and application steps clearly. Avoid bureaucratic jargon."""


_CONNECTIVITY_CACHE: dict[str, Any] = {"online": None, "checked_at": 0.0}
_CONNECTIVITY_TTL = 30.0  # re-check every 30 seconds

_http_client: httpx.AsyncClient | None = None

def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        limits = httpx.Limits(max_keepalive_connections=20, max_connections=100)
        _http_client = httpx.AsyncClient(limits=limits, timeout=60.0)
    return _http_client

def async_retry(retries=3, delay=1.0, backoff=2.0):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_delay = delay
            for attempt in range(retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == retries - 1:
                        raise e
                    logger.warning(f"[Retry] {func.__name__} failed (attempt {attempt + 1}/{retries}): {e}. Retrying in {current_delay}s...")
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
        return wrapper
    return decorator


async def check_connectivity() -> bool:
    """Return True if internet is reachable. Result cached for 30 seconds."""
    now = time.time()
    if (
        _CONNECTIVITY_CACHE["online"] is not None
        and now - _CONNECTIVITY_CACHE["checked_at"] < _CONNECTIVITY_TTL
    ):
        return bool(_CONNECTIVITY_CACHE["online"])

    try:
        client = get_http_client()
        await client.get("https://dns.google", timeout=2.5)
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


@async_retry(retries=2, delay=1.0)
async def _ollama(query: str, context: str, history: list[dict[str, str]] = None, system_prompt: str = None, max_tokens: int = 300, response_format: str = "text") -> str:
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
    if response_format == "json_object":
        payload["format"] = "json"
    try:
        client = get_http_client()
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


@async_retry(retries=2, delay=1.0)
async def _openai(query: str, context: str, history: list[dict[str, str]] = None, system_prompt: str = None, max_tokens: int = 300, response_format: str = "text") -> str:
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

        kwargs = {
            "model": OPENAI_MODEL,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": max_tokens,
        }
        if response_format == "json_object":
            kwargs["response_format"] = {"type": "json_object"}
            
        response = client.chat.completions.create(**kwargs)

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
    response_format: str = "text",
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
                text = await _openai(query, context, history, system_prompt, max_tokens, response_format)
            else:
                text = await _ollama(query, context, history, system_prompt, max_tokens, response_format)
            elapsed_ms = round((time.time() - t0) * 1000)
            logger.info("[LLM] %s responded in %d ms.", provider, elapsed_ms)
            return text, provider
        except RuntimeError as exc:
            logger.warning("[LLM] %s failed:\n%s\nTrying next provider.", provider, traceback.format_exc())

    logger.error("[LLM] All providers failed.")
    return "The AI service is currently unavailable.", "none"
