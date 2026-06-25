"""
Session-based conversation memory.

Stores the last N turns per session_id in memory (not persisted to disk).
Used to provide context from previous messages within the same conversation.
"""

from __future__ import annotations

import time
from collections import deque
from typing import Any

_MAX_TURNS = 5           # keep last 5 turns
_SESSION_TTL = 3600.0   # expire sessions after 1 hour of inactivity

_sessions: dict[str, dict[str, Any]] = {}


def _cleanup() -> None:
    now = time.time()
    expired = [sid for sid, s in _sessions.items() if now - s["last_active"] > _SESSION_TTL]
    for sid in expired:
        del _sessions[sid]


def get_history(session_id: str) -> list[dict[str, str]]:
    """Return list of {"role": "user"|"assistant", "content": str} dicts."""
    _cleanup()
    if session_id not in _sessions:
        return []
    return list(_sessions[session_id]["turns"])


def add_turn(session_id: str, user_msg: str, assistant_msg: str) -> None:
    """Append a user+assistant turn to session history."""
    if not session_id:
        return
    if session_id not in _sessions:
        _sessions[session_id] = {"turns": deque(maxlen=_MAX_TURNS * 2), "last_active": 0.0}
    q = _sessions[session_id]["turns"]
    q.append({"role": "user",      "content": user_msg})
    q.append({"role": "assistant", "content": assistant_msg})
    _sessions[session_id]["last_active"] = time.time()


def clear_session(session_id: str) -> None:
    """Wipe a session's history."""
    _sessions.pop(session_id, None)
