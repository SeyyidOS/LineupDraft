from typing import List
from pydantic import BaseModel


class CreateGameRequest(BaseModel):
    formation: List[int]
    host: str


class JoinGameRequest(BaseModel):
    name: str
