from fastapi import APIRouter, Depends, HTTPException

from deps import get_storage
from models import Game, GameCreate, GameUpdate
from services.game_service import GameService
from storage.base import AbstractStorage

router = APIRouter(prefix="/api/games", tags=["games"])


def _service(storage: AbstractStorage = Depends(get_storage)) -> GameService:
    return GameService(storage)


@router.get("", response_model=list[Game])
def list_games(svc: GameService = Depends(_service)):
    """Return all games from the current storage backend."""
    return svc.list_games()


@router.post("", response_model=Game, status_code=201)
def create_game(payload: GameCreate, svc: GameService = Depends(_service)):
    """Add a new game to the library."""
    return svc.create_game(payload)


@router.put("/{game_id}", response_model=Game)
def update_game(game_id: str, payload: GameUpdate, svc: GameService = Depends(_service)):
    """Update a game (e.g. toggle platform checkbox)."""
    updated = svc.update_game(game_id, payload)
    if updated is None:
        raise HTTPException(status_code=404, detail=f"Game '{game_id}' not found.")
    return updated


@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: str, svc: GameService = Depends(_service)):
    """Delete a game from the library."""
    deleted = svc.delete_game(game_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Game '{game_id}' not found.")
