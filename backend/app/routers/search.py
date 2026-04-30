import json
import os
import re

import anthropic
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..messages import (
    ERR_ANTHROPIC_API_KEY_MISSING,
    ERR_RAWG_API_ACCESS_FAILED,
    ERR_RAWG_API_KEY_MISSING,
)

router = APIRouter(prefix="/api/search", tags=["search"])

# RAWG genre slug → our master value
GENRE_MAP: dict[str, str] = {
    "action": "action",
    "adventure": "adventure",
    "role-playing-games-rpg": "rpg",
    "strategy": "strategy",
    "shooter": "shooting",
    "simulation": "simulation",
    "puzzle": "puzzle",
    "racing": "racing",
    "sports": "sports",
    "fighting": "fighting",
}


class GameSearchRequest(BaseModel):
    title: str
    hardware: str | None = None


class GameSearchResult(BaseModel):
    maker: str | None = None
    genre: str | None = None
    release_year: str | None = None
    official_url: str | None = None
    price_used: int | None = None
    price_new: int | None = None
    found: bool = False
    source_title: str | None = None


async def _fetch_metadata_from_rawg(title: str, api_key: str) -> dict:
    """Return raw RAWG fields: maker, genre, release_year, official_url, source_title."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        search_resp = await client.get(
            "https://api.rawg.io/api/games",
            params={"key": api_key, "search": title, "page_size": 3, "search_precise": "true"},
        )
        if search_resp.status_code != 200:
            raise HTTPException(502, ERR_RAWG_API_ACCESS_FAILED)

        results = search_resp.json().get("results", [])
        if not results:
            return {}

        game = results[0]
        source_title = game.get("name")

        genre: str | None = None
        for g in game.get("genres", []):
            mapped = GENRE_MAP.get(g.get("slug", ""))
            if mapped:
                genre = mapped
                break

        released = game.get("released") or ""
        release_year = released[:4] if released else None

        detail_resp = await client.get(
            f"https://api.rawg.io/api/games/{game['id']}",
            params={"key": api_key},
        )
        maker: str | None = None
        official_url: str | None = None
        if detail_resp.status_code == 200:
            detail = detail_resp.json()
            developers = detail.get("developers", [])
            publishers = detail.get("publishers", [])
            names = [d["name"] for d in developers] or [p["name"] for p in publishers]
            maker = ", ".join(names) if names else None
            official_url = detail.get("website") or None

    return {
        "maker": maker,
        "genre": genre,
        "release_year": release_year,
        "official_url": official_url,
        "source_title": source_title,
    }


async def _fetch_prices_via_claude(title: str, hardware: str | None) -> tuple[int | None, int | None]:
    """Return (price_used, price_new) from Japanese market via Claude web search.
    Returns (None, None) on any error so the caller degrades gracefully.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return None, None

    subject = f"「{title}」" + (f"（{hardware}）" if hardware else "")
    prompt = (
        f"{subject} の日本の中古市場での現在の価格を調べてください。\n"
        "駿河屋・ヤフオク・メルカリ等の情報を参考にしてください。\n"
        "以下のJSON形式のみで回答してください（余分なテキスト不要）:\n"
        '{"price_used": 中古品の相場（円・整数・不明はnull）, '
        '"price_new": 未使用品の相場（円・整数・未使用品の出品がない場合はnull）}'
    )

    try:
        claude = anthropic.AsyncAnthropic(api_key=api_key)
        response = await claude.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 3}],
            messages=[{"role": "user", "content": prompt}],
        )

        text = "".join(block.text for block in response.content if block.type == "text")
        m = re.search(r'\{[^{}]*"price_used"[^{}]*\}', text)
        if not m:
            return None, None

        data = json.loads(m.group())
        price_used = data.get("price_used")
        price_new = data.get("price_new")

        return (
            int(price_used) if isinstance(price_used, (int, float)) else None,
            int(price_new) if isinstance(price_new, (int, float)) else None,
        )
    except Exception:
        return None, None


@router.post("/game-info", response_model=GameSearchResult)
async def search_game_info(body: GameSearchRequest):
    rawg_key = os.getenv("RAWG_API_KEY", "").strip()
    if not rawg_key:
        raise HTTPException(503, ERR_RAWG_API_KEY_MISSING)

    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not anthropic_key:
        raise HTTPException(503, ERR_ANTHROPIC_API_KEY_MISSING)

    import asyncio

    metadata, (price_used, price_new) = await asyncio.gather(
        _fetch_metadata_from_rawg(body.title, rawg_key),
        _fetch_prices_via_claude(body.title, body.hardware),
    )

    if not metadata:
        return GameSearchResult(found=False)

    return GameSearchResult(
        maker=metadata.get("maker"),
        genre=metadata.get("genre"),
        release_year=metadata.get("release_year"),
        official_url=metadata.get("official_url"),
        price_used=price_used,
        price_new=price_new,
        found=True,
        source_title=metadata.get("source_title"),
    )