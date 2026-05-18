import uuid
from datetime import date
from typing import List, Optional

from models import Game, GameCreate, GameUpdate
from storage.base import AbstractStorage


class GameService:
    def __init__(self, storage: AbstractStorage):
        self.storage = storage

    def list_games(self) -> List[Game]:
        """Return all games from storage."""
        return self.storage.get_all_games()

    def create_game(self, payload: GameCreate) -> Game:
        """Create and persist a new game."""
        game = Game(
            id=str(uuid.uuid4()),
            name=payload.name,
            steam=payload.steam,
            epic=payload.epic,
            switch=payload.switch,
            added_date=date.today().isoformat(),
            notes=payload.notes,
        )
        return self.storage.add_game(game)

    def update_game(self, game_id: str, payload: GameUpdate) -> Optional[Game]:
        """Apply partial updates to an existing game. Returns None if not found."""
        updates = payload.model_dump(exclude_none=True)
        return self.storage.update_game(game_id, updates)

    def delete_game(self, game_id: str) -> bool:
        """Delete a game by ID. Returns True if deleted, False if not found."""
        return self.storage.delete_game(game_id)
