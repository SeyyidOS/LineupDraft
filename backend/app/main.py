from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import time

app = FastAPI()

player_search_cache = {}
player_detail_cache = {}
SEARCH_CACHE_TTL = 3600
DETAIL_CACHE_TTL = 60  # keep player details fresh

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

# Most popular leagues and teams are hard coded to avoid fetching
# large lists from the upstream API which slowed down the app.
# Limit leagues to those required by the frontend.  These names should
# match exactly what the upstream API returns so that league lookups work
# correctly.
POPULAR_LEAGUES = [
    "English Premier League",
    "Spanish La Liga",
    "Italian Serie A",
    "German Bundesliga",
    "French Ligue 1",
]

POPULAR_TEAMS = {
    "English Premier League": [
        "Arsenal",
        "Chelsea",
        "Liverpool",
        "Manchester City",
        "Manchester United",
        "Tottenham Hotspur",
        "Newcastle United",
        "Everton",
        "Aston Villa",
        "Leeds United",
    ],
    "Spanish La Liga": [
        "Real Madrid",
        "Barcelona",
        "Atl\u00e9tico Madrid",
        "Sevilla",
        "Valencia",
        "Villarreal",
        "Real Sociedad",
        "Athletic Bilbao",
        "Real Betis",
        "Celta Vigo",
    ],
    "Italian Serie A": [
        "Juventus",
        "AC Milan",
        "Inter",
        "Roma",
        "Lazio",
        "Napoli",
        "Fiorentina",
        "Atalanta",
        "Torino",
        "Sampdoria",
    ],
    "German Bundesliga": [
        "Bayern Munich",
        "Borussia Dortmund",
        "RB Leipzig",
        "Bayer Leverkusen",
        "Schalke 04",
        "VfL Wolfsburg",
        "Borussia M\u00f6nchengladbach",
        "Eintracht Frankfurt",
        "Hertha Berlin",
        "Werder Bremen",
    ],
    "French Ligue 1": [
        "Paris Saint-Germain",
        "Marseille",
        "Lyon",
        "Monaco",
        "Lille",
        "Nice",
        "Rennes",
        "Bordeaux",
        "Saint-\u00c9tienne",
        "Nantes",
    ],
    # Additional leagues can be added here if needed
}

# Some common nationalities to provide as options
NATIONALITIES = [
    "Brazil",
    "Spain",
    "Italy",
    "France",
    "Germany",
    "Argentina",
    "Portugal",
    "The Netherlands",
    "England",
    "Belgium",
    "Croatia",
    "Uruguay",
    "Mexico",
    "United States",
    "Japan",
    "South Korea",
]


@app.get("/leagues")
async def get_leagues():
    """Return a curated list of popular soccer leagues."""
    return {"leagues": POPULAR_LEAGUES}


@app.get("/teams")
async def get_teams(league: str):
    """Return up to 10 popular team names for the given league."""
    teams = POPULAR_TEAMS.get(league, [])
    return {"teams": teams[:10]}


@app.get("/nationalities")
async def get_nationalities():
    """Return a list of common nationalities."""
    return {"nationalities": NATIONALITIES}


@app.get("/players")
async def get_players(search: str):
    """Fetch player names from the free TheSportsDB API."""
    now = time.time()
    cached = player_search_cache.get(search.lower())
    if cached and now - cached[0] < SEARCH_CACHE_TTL:
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
    if cached and now - cached[0] < DETAIL_CACHE_TTL:
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
    # TheSportsDB may return multiple players for a given search string.
    # Prefer an exact case-insensitive match on the player's name when
    # available to avoid picking an unrelated player (which often happens
    # to be from the English Premier League).
    player = None
    lowered_name = name.lower()
    for p in player_list:
        if (p.get("strPlayer") or "").lower() == lowered_name:
            player = p
            break
    if player is None:
        player = player_list[0]

    # Fetch the player's league by searching for the team name. Using the
    # search endpoint avoids issues where the team ID doesn't return complete
    # league information.
    league = None
    if player.get("strTeam"):
        team_params = {"t": player.get("strTeam")}
        try:
            team_resp = await app.state.client.get(
                "https://www.thesportsdb.com/api/v1/json/3/searchteams.php",
                params=team_params,
                timeout=10,
            )
            team_resp.raise_for_status()
            team_data = team_resp.json()
            team_list = team_data.get("teams", []) or []
            if team_list:
                league = team_list[0].get("strLeague")
        except httpx.HTTPError:
            league = None

    result = {
        "name": player.get("strPlayer"),
        "nationality": player.get("strNationality"),
        "club": player.get("strTeam"),
        "league": league,
        "photo": player.get("strCutout")
        or player.get("strThumb")
        or player.get("strRender"),
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
