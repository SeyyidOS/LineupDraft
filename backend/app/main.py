from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


API_URL = "https://www.thesportsdb.com/api/v1/json/3/searchplayers.php"


@app.get("/players")
async def get_players(search: str):
    """Fetch player names from the free TheSportsDB API."""
    params = {"p": search}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(API_URL, params=params, timeout=10)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    data = response.json()
    names = []
    for player in data.get("player", []) or []:
        name = player.get("strPlayer")
        if name:
            names.append(name)
    return {"players": names}


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
