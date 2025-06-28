from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class Game:
    code: str
    formation: List[int]
    players: List[str] = field(default_factory=list)
    lineups: Dict[str, List[List[Optional[str]]]] = field(default_factory=dict)
    current_index: int = 0
    picker_index: int = 0
    condition: Optional[dict] = None
    used_players: List[str] = field(default_factory=list)
    connections: Dict[str, List[asyncio.Queue]] = field(default_factory=dict)

    def add_player(self, name: str) -> None:
        if name in self.players:
            raise ValueError("Name taken")
        self.players.append(name)
        self.lineups[name] = [ [None]*c for c in self.formation ]
        self.connections[name] = []

    def next_turn(self):
        self.current_index = (self.current_index + 1) % len(self.players)
        if self.current_index == self.picker_index:
            self.picker_index = (self.picker_index + 1) % len(self.players)
            self.condition = None


class GameManager:
    def __init__(self):
        self.games: Dict[str, Game] = {}

    def create_game(self, formation: List[int]) -> Game:
        code = uuid.uuid4().hex[:6]
        game = Game(code=code, formation=formation)
        self.games[code] = game
        return game

    def get_game(self, code: str) -> Optional[Game]:
        return self.games.get(code)


game_manager = GameManager()
