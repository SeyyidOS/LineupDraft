from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import time

app = FastAPI()

player_search_cache = {}
player_detail_cache = {}
CACHE_TTL = 3600

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    app.state.client = httpx.AsyncClient()


@app.on_event("shutdown")
async def shutdown_event():
    await app.state.client.aclose()


@app.get("/")
async def root():
    return {"message": "Hello World"}


API_URL = "https://www.thesportsdb.com/api/v1/json/3/searchplayers.php"


@app.get("/players")
async def get_players(search: str):
    """Fetch player names from the free TheSportsDB API."""
    now = time.time()
    cached = player_search_cache.get(search.lower())
    if cached and now - cached[0] < CACHE_TTL:
        return {"players": cached[1]}

    params = {"p": search}
    try:
        response = await app.state.client.get(API_URL, params=params, timeout=10)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    data = response.json()
    names = []
    for player in data.get("player", []) or []:
        name = player.get("strPlayer")
        if name:
            names.append(name)

    player_search_cache[search.lower()] = (now, names)
    return {"players": names}


@app.get("/player")
async def get_player_details(name: str):
    """Fetch details for a specific player."""
    now = time.time()
    cached = player_detail_cache.get(name.lower())
    if cached and now - cached[0] < CACHE_TTL:
        return cached[1]

    params = {"p": name}
    try:
        response = await app.state.client.get(API_URL, params=params, timeout=10)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    data = response.json()
    player_list = data.get("player", []) or []
    if not player_list:
        raise HTTPException(status_code=404, detail="Player not found")
    player = player_list[0]
    result = {
        "name": player.get("strPlayer"),
        "nationality": player.get("strNationality"),
        "club": player.get("strTeam"),
        "league": player.get("strLeague"),
    }
    player_detail_cache[name.lower()] = (now, result)
    return result


# # Allow React dev server on localhost:3000
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.on_event("startup")
# def on_startup():
#     database.Base.metadata.create_all(bind=database.engine)


# @app.get("/health")
# def health_check():
#     return {"status": "ok"}
