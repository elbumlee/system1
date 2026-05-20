"""
게임 서비스(GameService) TDD 테스트
- MockStorage를 사용해 파일 I/O 없이 순수 비즈니스 로직만 검증
"""
import sys
import os

# backend 디렉터리를 sys.path에 추가 (상대 임포트 지원)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from typing import Dict, List, Optional

import pytest

from models import Game, GameCreate, GameUpdate
from services.game_service import GameService
from storage.base import AbstractStorage


# ---------------------------------------------------------------------------
# MockStorage: 파일 I/O 없이 메모리에서 동작하는 테스트용 스토리지
# ---------------------------------------------------------------------------
class MockStorage(AbstractStorage):
    def __init__(self):
        # 인메모리 게임 저장소 (id -> Game)
        self._store: Dict[str, Game] = {}

    def get_all_games(self) -> List[Game]:
        """저장된 모든 게임 반환"""
        return list(self._store.values())

    def add_game(self, game: Game) -> Game:
        """게임 추가"""
        self._store[game.id] = game
        return game

    def update_game(self, game_id: str, updates: dict) -> Optional[Game]:
        """게임 부분 업데이트. 없는 ID면 None 반환"""
        if game_id not in self._store:
            return None
        existing = self._store[game_id]
        updated = existing.model_copy(update=updates)
        self._store[game_id] = updated
        return updated

    def delete_game(self, game_id: str) -> bool:
        """게임 삭제. 없으면 False 반환"""
        if game_id not in self._store:
            return False
        del self._store[game_id]
        return True


# ---------------------------------------------------------------------------
# 픽스처
# ---------------------------------------------------------------------------
@pytest.fixture
def storage():
    """각 테스트마다 빈 MockStorage를 새로 생성"""
    return MockStorage()


@pytest.fixture
def service(storage):
    """MockStorage를 주입한 GameService 인스턴스"""
    return GameService(storage)


@pytest.fixture
def sample_payload():
    """기본 게임 생성 payload"""
    return GameCreate(
        name="Hollow Knight",
        steam=True,
        epic=False,
        switch=True,
        genre="action",
        favorite=False,
        notes="좋은 게임",
    )


# ---------------------------------------------------------------------------
# 1. 게임 생성 (create_game)
# ---------------------------------------------------------------------------
class TestCreateGame:
    def test_create_returns_game_with_id(self, service, sample_payload):
        """게임 생성 시 UUID 형태의 id가 자동 부여되어야 한다"""
        game = service.create_game(sample_payload)
        assert game.id, "id가 빈 문자열이면 안 된다"
        assert len(game.id) == 36, "UUID 형식(36자)이어야 한다"

    def test_create_stores_correct_name(self, service, sample_payload):
        """생성된 게임의 name이 payload와 일치해야 한다"""
        game = service.create_game(sample_payload)
        assert game.name == "Hollow Knight"

    def test_create_stores_platform_flags(self, service, sample_payload):
        """플랫폼 플래그(steam, epic, switch)가 payload 그대로 저장되어야 한다"""
        game = service.create_game(sample_payload)
        assert game.steam is True
        assert game.epic is False
        assert game.switch is True

    def test_create_sets_added_date(self, service, sample_payload):
        """added_date가 YYYY-MM-DD 형식으로 자동 설정되어야 한다"""
        import re
        game = service.create_game(sample_payload)
        assert re.match(r"\d{4}-\d{2}-\d{2}", game.added_date), \
            f"날짜 형식이 올바르지 않음: {game.added_date}"

    def test_create_two_games_have_different_ids(self, service):
        """두 게임을 생성하면 서로 다른 id를 가져야 한다"""
        g1 = service.create_game(GameCreate(name="Game A"))
        g2 = service.create_game(GameCreate(name="Game B"))
        assert g1.id != g2.id

    def test_create_game_appears_in_list(self, service, sample_payload):
        """생성된 게임이 list_games()에 포함되어야 한다"""
        game = service.create_game(sample_payload)
        all_games = service.list_games()
        assert any(g.id == game.id for g in all_games)


# ---------------------------------------------------------------------------
# 2. 게임 목록 조회 (list_games)
# ---------------------------------------------------------------------------
class TestListGames:
    def test_empty_storage_returns_empty_list(self, service):
        """저장소가 비어 있으면 빈 리스트를 반환해야 한다"""
        assert service.list_games() == []

    def test_list_returns_all_created_games(self, service):
        """생성된 모든 게임이 목록에 포함되어야 한다"""
        service.create_game(GameCreate(name="Game A"))
        service.create_game(GameCreate(name="Game B"))
        service.create_game(GameCreate(name="Game C"))
        games = service.list_games()
        assert len(games) == 3
        names = {g.name for g in games}
        assert names == {"Game A", "Game B", "Game C"}


# ---------------------------------------------------------------------------
# 3. 게임 수정 (update_game)
# ---------------------------------------------------------------------------
class TestUpdateGame:
    def test_update_name_changes_name(self, service, sample_payload):
        """name 필드를 업데이트하면 변경된 name이 반환되어야 한다"""
        game = service.create_game(sample_payload)
        updated = service.update_game(game.id, GameUpdate(name="Hollow Knight: Silksong"))
        assert updated is not None
        assert updated.name == "Hollow Knight: Silksong"

    def test_update_partial_only_changes_specified_fields(self, service, sample_payload):
        """부분 업데이트 시 지정하지 않은 필드는 변경되지 않아야 한다"""
        game = service.create_game(sample_payload)
        updated = service.update_game(game.id, GameUpdate(favorite=True))
        assert updated is not None
        assert updated.favorite is True
        # name, genre 등 다른 필드는 원래 값 유지
        assert updated.name == "Hollow Knight"
        assert updated.genre == "action"

    def test_update_nonexistent_game_returns_none(self, service):
        """존재하지 않는 id로 업데이트 시 None을 반환해야 한다"""
        result = service.update_game("nonexistent-id", GameUpdate(name="Ghost"))
        assert result is None

    def test_update_platform_flags(self, service, sample_payload):
        """플랫폼 플래그를 False에서 True로 변경할 수 있어야 한다"""
        game = service.create_game(sample_payload)
        updated = service.update_game(game.id, GameUpdate(epic=True))
        assert updated is not None
        assert updated.epic is True
        assert updated.steam is True  # 기존 값 유지


# ---------------------------------------------------------------------------
# 4. 게임 삭제 (delete_game)
# ---------------------------------------------------------------------------
class TestDeleteGame:
    def test_delete_existing_game_returns_true(self, service, sample_payload):
        """존재하는 게임을 삭제하면 True를 반환해야 한다"""
        game = service.create_game(sample_payload)
        result = service.delete_game(game.id)
        assert result is True

    def test_delete_removes_game_from_list(self, service, sample_payload):
        """삭제된 게임은 list_games()에 나타나지 않아야 한다"""
        game = service.create_game(sample_payload)
        service.delete_game(game.id)
        all_games = service.list_games()
        assert not any(g.id == game.id for g in all_games)

    def test_delete_nonexistent_game_returns_false(self, service):
        """존재하지 않는 id로 삭제 시 False를 반환해야 한다"""
        result = service.delete_game("does-not-exist")
        assert result is False

    def test_delete_one_game_leaves_others_intact(self, service):
        """게임 하나를 삭제해도 나머지 게임은 남아 있어야 한다"""
        g1 = service.create_game(GameCreate(name="Game A"))
        g2 = service.create_game(GameCreate(name="Game B"))
        service.delete_game(g1.id)
        remaining = service.list_games()
        assert len(remaining) == 1
        assert remaining[0].id == g2.id
