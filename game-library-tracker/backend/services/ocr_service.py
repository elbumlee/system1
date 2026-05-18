import uuid
from datetime import date
from typing import Dict, List

from models import Game, OCRResult, OCRConfirm
from storage.base import AbstractStorage


class OCRService:
    _cache: Dict[str, OCRResult] = {}  # class-level cache shared across instances

    def process_image(self, image_bytes: bytes) -> OCRResult:
        """Run OCR on image bytes, cache and return the result."""
        try:
            from ocr.processor import OCRProcessor
            processor = OCRProcessor()
        except RuntimeError:
            raise

        candidates, platform_hint = processor.process(image_bytes)

        image_id = str(uuid.uuid4())
        result = OCRResult(image_id=image_id, candidates=candidates, platform_hint=platform_hint)
        OCRService._cache[image_id] = result
        return result

    def get_cached_result(self, image_id: str) -> OCRResult | None:
        """Retrieve a cached OCR result by image_id."""
        return OCRService._cache.get(image_id)

    def confirm_games(self, payload: OCRConfirm, storage: AbstractStorage) -> List[Game]:
        """Confirm selected game names from a cached OCR result and persist them."""
        cached = OCRService._cache.get(payload.image_id)
        if cached is None:
            return []  # caller should check before calling

        today = date.today().isoformat()
        added_games: List[Game] = []

        for name in payload.selected_names:
            name = name.strip()
            if not name:
                continue

            steam = payload.platform == "steam"
            epic = payload.platform == "epic"
            switch = payload.platform == "switch"

            game = Game(
                id=str(uuid.uuid4()),
                name=name,
                steam=steam,
                epic=epic,
                switch=switch,
                added_date=today,
                notes="Added via OCR",
            )
            storage.add_game(game)
            added_games.append(game)

        # Remove from cache once confirmed
        del OCRService._cache[payload.image_id]
        return added_games
