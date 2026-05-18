import io
from typing import List, Tuple

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


class OCRProcessor:
    def __init__(self):
        if not PILLOW_AVAILABLE:
            raise RuntimeError(
                "Pillow is required for OCR. Install it with: pip install Pillow"
            )
        if not TESSERACT_AVAILABLE:
            raise RuntimeError(
                "pytesseract is required for OCR. Install it with: pip install pytesseract"
            )

    def preprocess_image(self, image_bytes: bytes) -> "Image.Image":
        """Preprocess image for better OCR accuracy."""
        image = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB if needed (handles PNG with alpha channel, etc.)
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        # Convert to grayscale for better OCR
        gray = image.convert("L")

        # Enhance contrast
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(2.0)

        # Enhance sharpness
        sharpness_enhancer = ImageEnhance.Sharpness(enhanced)
        sharpened = sharpness_enhancer.enhance(1.5)

        # Apply slight denoise filter
        denoised = sharpened.filter(ImageFilter.MedianFilter(size=3))

        return denoised

    def extract_text(self, image_bytes: bytes) -> str:
        """Extract raw text from image bytes using Tesseract."""
        preprocessed = self.preprocess_image(image_bytes)
        # Use PSM 6 (assume a uniform block of text) for game library screens
        custom_config = r"--oem 3 --psm 6"
        text = pytesseract.image_to_string(preprocessed, config=custom_config)
        return text

    def detect_platform_hint(self, raw_text: str) -> str:
        """Detect which gaming platform this screenshot is from."""
        text_lower = raw_text.lower()

        steam_keywords = ["steam", "steampowered", "valve", "steamworks"]
        epic_keywords = ["epic games", "epicgames", "epic store", "unreal"]
        switch_keywords = ["nintendo", "switch", "eshop", "e-shop", "nintendo switch"]

        steam_score = sum(1 for kw in steam_keywords if kw in text_lower)
        epic_score = sum(1 for kw in epic_keywords if kw in text_lower)
        switch_score = sum(1 for kw in switch_keywords if kw in text_lower)

        scores = {"steam": steam_score, "epic": epic_score, "switch": switch_score}
        best_platform = max(scores, key=scores.get)

        if scores[best_platform] > 0:
            return best_platform
        return "unknown"

    def process(self, image_bytes: bytes) -> Tuple[List[str], str]:
        """
        Main processing method. Returns (candidates, platform_hint).
        candidates: list of potential game name strings
        platform_hint: "steam", "epic", "switch", or "unknown"
        """
        raw_text = self.extract_text(image_bytes)
        platform_hint = self.detect_platform_hint(raw_text)

        # Split into lines and process
        raw_lines = raw_text.split("\n")
        candidates = clean_candidates(raw_lines)

        return candidates, platform_hint
