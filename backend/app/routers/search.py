import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..messages import ERR_RAWG_API_ACCESS_FAILED, ERR_RAWG_API_KEY_MISSING

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


class GameSearchResult(BaseModel):
    maker: str | None = None
    genre: str | None = None
    release_year: str | None = None
    official_url: str | None = None
    found: bool = False
    source_title: str | None = None


@router.post("/game-info", response_model=GameSearchResult)
async def search_game_info(body: GameSearchRequest):
    api_key = os.getenv("RAWG_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(503, ERR_RAWG_API_KEY_MISSING)

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Step 1: search
        search_resp = await client.get(
            "https://api.rawg.io/api/games",
            params={"key": api_key, "search": body.title, "page_size": 3, "search_precise": "true"},
        )
        if search_resp.status_code != 200:
            raise HTTPException(502, ERR_RAWG_API_ACCESS_FAILED)

        results = search_resp.json().get("results", [])
        if not results:
            return GameSearchResult(found=False)

        game = results[0]
        game_id = game["id"]
        source_title = game.get("name")

        # Map genre (take first matching genre)
        genre: str | None = None
        for g in game.get("genres", []):
            mapped = GENRE_MAP.get(g.get("slug", ""))
            if mapped:
                genre = mapped
                break

        # Release year
        released = game.get("released") or ""
        release_year = released[:4] if released else None

        # Step 2: get developer/publisher from game detail
        detail_resp = await client.get(
            f"https://api.rawg.io/api/games/{game_id}",
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

    return GameSearchResult(
        maker=maker,
        genre=genre,
        release_year=release_year,
        official_url=official_url,
        found=True,
        source_title=source_title,
    )
