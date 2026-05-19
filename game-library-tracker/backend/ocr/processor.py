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
        """Return list of (line_text, avg_confidence) using image_to_data."""
        preprocessed = self.preprocess_image(image_bytes)
        config = r"--oem 3 --psm 6"
        try:
            data = pytesseract.image_to_data(
                preprocessed,
                output_type=pytesseract.Output.DICT,
                config=config,
            )
        except Exception:
            # Fallback: plain string extraction with neutral confidence
            text = pytesseract.image_to_string(preprocessed, config=config)
            return [(line.strip(), 70.0) for line in text.split("\n") if line.strip()]

        # Group words by (block_num, par_num, line_num)
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
        """Main entry: returns (candidates_with_confidence, platform_hint)."""
        line_data = self.extract_lines_with_confidence(image_bytes)
        raw_text = " ".join(t for t, _ in line_data)
        platform_hint = self.detect_platform_hint(raw_text)

        # Build name->confidence map (use highest conf if name appears in multiple lines)
        conf_map: Dict[str, float] = {}
        for line_text, conf in line_data:
            conf_map[line_text] = conf

        raw_lines = [t for t, _ in line_data]
        candidate_names = clean_candidates(raw_lines)

        candidates: List[OCRCandidate] = []
        seen = set()
        for name in candidate_names:
            norm = name.lower()
            if norm in seen:
                continue
            seen.add(norm)

            # Find best confidence for this candidate
            best_conf = 50.0
            for line_text, conf in line_data:
                if name.lower() in line_text.lower() or line_text.lower() in name.lower():
                    if conf > best_conf:
                        best_conf = conf
                    break

            candidates.append(OCRCandidate(name=name, confidence=round(best_conf, 1)))

        return candidates, platform_hint
