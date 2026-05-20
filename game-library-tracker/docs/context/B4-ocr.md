# B4: ocr — OCR 처리 컨텍스트

## 모듈 책임
이미지 → 게임명 후보 텍스트 추출. pytesseract + Pillow 사용.
OCR 엔진 교체, 필터 규칙 변경 시 이 모듈만 수정.

## 파일
```
game-library-tracker/backend/ocr/__init__.py
game-library-tracker/backend/ocr/processor.py
game-library-tracker/backend/ocr/filters.py
```

## 현재 코드

### ocr/processor.py
```python
import io
from typing import List, Tuple, Dict

try:
    from PIL import Image, ImageEnhance, ImageFilter
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

from ocr.filters import is_likely_game_name, clean_candidates
from models import OCRCandidate


class OCRProcessor:
    def __init__(self):
        if not PILLOW_AVAILABLE:
            raise RuntimeError("Pillow is required: pip install Pillow")
        if not TESSERACT_AVAILABLE:
            raise RuntimeError("pytesseract is required: pip install pytesseract")
        # Windows 환경에서 Tesseract 경로가 PATH에 없을 때 config에서 직접 지정
        try:
            from config import settings
            if settings.tesseract_cmd:
                pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd
        except Exception:
            pass

    def preprocess_image(self, image_bytes: bytes) -> "Image.Image":
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        gray = image.convert("L")
        enhanced = ImageEnhance.Contrast(gray).enhance(2.0)
        sharpened = ImageEnhance.Sharpness(enhanced).enhance(1.5)
        return sharpened.filter(ImageFilter.MedianFilter(size=3))

    def extract_lines_with_confidence(self, image_bytes: bytes) -> List[Tuple[str, float]]:
        preprocessed = self.preprocess_image(image_bytes)
        config = r"--oem 3 --psm 6"
        try:
            data = pytesseract.image_to_data(
                preprocessed,
                output_type=pytesseract.Output.DICT,
                config=config,
            )
        except Exception:
            text = pytesseract.image_to_string(preprocessed, config=config)
            return [(line.strip(), 70.0) for line in text.split("\n") if line.strip()]

        line_map: Dict[Tuple, Dict] = {}
        n = len(data["text"])
        for i in range(n):
            word = str(data["text"][i]).strip()
            conf = int(data["conf"][i])
            if not word or conf < 0:
                continue
            key = (int(data["block_num"][i]), int(data["par_num"][i]), int(data["line_num"][i]))
            if key not in line_map:
                line_map[key] = {"words": [], "confs": []}
            line_map[key]["words"].append(word)
            line_map[key]["confs"].append(conf)

        result = []
        for key in sorted(line_map):
            line_text = " ".join(line_map[key]["words"])
            confs = line_map[key]["confs"]
            avg_conf = sum(confs) / len(confs) if confs else 50.0
            result.append((line_text, round(avg_conf, 1)))
        return result

    def detect_platform_hint(self, raw_text: str) -> str:
        text_lower = raw_text.lower()
        scores = {
            "steam": sum(1 for kw in ["steam", "steampowered", "valve"] if kw in text_lower),
            "epic": sum(1 for kw in ["epic games", "epicgames", "unreal"] if kw in text_lower),
            "switch": sum(1 for kw in ["nintendo", "switch", "eshop"] if kw in text_lower),
        }
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "unknown"

    def process(self, image_bytes: bytes) -> Tuple[List[OCRCandidate], str]:
        line_data = self.extract_lines_with_confidence(image_bytes)
        raw_text = " ".join(t for t, _ in line_data)
        platform_hint = self.detect_platform_hint(raw_text)
        raw_lines = [t for t, _ in line_data]
        candidate_names = clean_candidates(raw_lines)

        candidates: List[OCRCandidate] = []
        seen = set()
        for name in candidate_names:
            if name.lower() in seen:
                continue
            seen.add(name.lower())
            best_conf = 50.0
            for line_text, conf in line_data:
                if name.lower() in line_text.lower() or line_text.lower() in name.lower():
                    if conf > best_conf:
                        best_conf = conf
                    break
            candidates.append(OCRCandidate(name=name, confidence=round(best_conf, 1)))

        return candidates, platform_hint
```

### ocr/filters.py
```python
import re
from typing import List

COMMON_UI_TEXT = {
    "library", "store", "community", "profile", "friends", "home", "search",
    "settings", "help", "support", "news", "installed", "not installed",
    "play", "install", "update", "download", "downloading", "updating",
    "steam", "epic games", "epic", "nintendo", "switch", "eshop", "e-shop",
    "sign in", "sign out", "login", "logout", "account", "browse",
    "recent", "wishlist", "cart", "checkout", "owned", "free",
    "all games", "my games", "game library", "game library tracker",
    "filter", "sort", "view", "list", "grid", "details", "category",
    "action", "adventure", "rpg", "strategy", "simulation", "sports",
    "indie", "multiplayer", "singleplayer", "co-op", "achievements",
    "dlc", "add-on", "bundle", "sale", "discount", "price", "buy",
    "ok", "cancel", "yes", "no", "confirm", "back", "next", "previous",
    "page", "loading", "error", "warning", "info", "notification",
    "menu", "options", "preferences", "language", "region", "country",
}

NOISE_PATTERNS = [
    r"^\d+$",
    r"^[\W_]+$",
    r"^\s+$",
    r"^.{1,2}$",
    r"^\d+[\.,]\d+$",
    r"^\d+%$",
    r"^(https?|ftp)://",
    r"^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$",
    r"^v?\d+\.\d+(\.\d+)?$",
    r"^\d+\s*(MB|GB|KB|TB)$",
    r"^\d+\s*(min|hr|hrs|hours|minutes)$",
]

def is_likely_game_name(text: str) -> bool:
    text = text.strip()
    if len(text) < 3:
        return False
    for pattern in NOISE_PATTERNS:
        if re.match(pattern, text, re.IGNORECASE):
            return False
    if text.lower() in COMMON_UI_TEXT:
        return False
    digit_ratio = sum(c.isdigit() for c in text) / max(len(text), 1)
    if digit_ratio > 0.7:
        return False
    if not any(c.isalpha() for c in text):
        return False
    return True

def clean_candidates(raw_lines: List[str]) -> List[str]:
    candidates = []
    seen = set()
    for line in raw_lines:
        line = line.strip()
        line = re.sub(r"[|\\]{2,}", "", line)
        line = re.sub(r"\s{2,}", " ", line)
        line = line.strip(".-_|/\\")
        parts = re.split(r"\s{3,}|\t+", line)
        for part in parts:
            part = part.strip()
            if is_likely_game_name(part):
                normalized = part.lower()
                if normalized not in seen:
                    seen.add(normalized)
                    candidates.append(part)
    candidates.sort(key=lambda x: -len(x))
    return candidates[:50]
```

## 공개 인터페이스
```python
from ocr.processor import OCRProcessor   # B5-ocr_service에서만 사용
# processor.process(image_bytes) → (List[OCRCandidate], platform_hint_str)
```

## 이 모듈의 의존성
```python
from models import OCRCandidate  # B1만 참조
from config import settings      # B2 (tesseract_cmd 적용)
```

## 신뢰도 계산 구조
```
image_to_data(DICT) → 단어별 conf
→ (block_num, par_num, line_num) 키로 그룹핑
→ 줄별 평균 conf
→ OCRCandidate.confidence (0-100)
```

## 수정 규칙

### UI 텍스트 필터 추가
```python
# filters.py의 COMMON_UI_TEXT에 추가
COMMON_UI_TEXT.update({"INSTALLED", "UPDATE", "DOWNLOAD"})
```
수정 대상: **ocr/filters.py만**

### 신뢰도 임계값 변경
임계값은 필터가 아닌 프론트엔드(F8-scanner)에서 처리.
`CandidateList.tsx`의 `LOW_CONFIDENCE_THRESHOLD = 80` 변경.

### OCR 언어 추가 (일본어 등)
```python
# processor.py
config = r"--oem 3 --psm 6 -l kor+eng+jpn"
```
수정 대상: **ocr/processor.py만**

## 격리 보장
- storage, services, routers import 금지
- HTTP 요청 없음
- 캐시 없음 (B5-ocr_service가 담당)
