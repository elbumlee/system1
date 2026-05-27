import uuid
from datetime import date
from typing import Dict, List

from models import Game, OCRResult, OCRConfirm
from storage.base import AbstractStorage


class OCRService:
    def __init__(self) -> None:
        self._cache: Dict[str, OCRResult] = {}

    def process_image(self, image_bytes: bytes) -> OCRResult:
        from ocr.processor import OCRProcessor
        processor = OCRProcessor()

        candidates, platform_hint = processor.process(image_bytes)
        image_id = str(uuid.uuid4())
        result = OCRResult(image_id=image_id, candidates=candidates, platform_hint=platform_hint)
        self._cache[image_id] = result
        return result

    def get_cached_result(self, image_id: str) -> OCRResult | None:
        return self._cache.get(image_id)

    def confirm_games(self, payload: OCRConfirm, storage: AbstractStorage) -> List[Game]:
        cached = self._cache.get(payload.image_id)
        if cached is None:
            return []

        today = date.today().isoformat()
        added_games: List[Game] = []

        for name in payload.selected_names:
            name = name.strip()
            if not name:
                continue
            game = Game(
                id=str(uuid.uuid4()),
                name=name,
                steam=payload.platform == "steam",
                epic=payload.platform == "epic",
                switch=payload.platform == "switch",
                added_date=today,
                genre="",
                favorite=False,
                notes="OCR 추가",
            )
            storage.add_game(game)
            added_games.append(game)

        del self._cache[payload.image_id]
        return added_games
