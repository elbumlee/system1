from abc import ABC, abstractmethod
from typing import List, Optional

from models import Game


class AbstractStorage(ABC):
    @abstractmethod
    def get_all_games(self) -> List[Game]: ...

    @abstractmethod
    def add_game(self, game: Game) -> Game: ...

    @abstractmethod
    def update_game(self, game_id: str, updates: dict) -> Optional[Game]: ...

    @abstractmethod
    def delete_game(self, game_id: str) -> bool: ...

    def get_game_by_id(self, game_id: str) -> Optional[Game]:
        return next((g for g in self.get_all_games() if g.id == game_id), None)
