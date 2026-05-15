import re
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


# Common UI text to filter out (exact matches or substrings)
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

# Patterns that are unlikely to be game names
NOISE_PATTERNS = [
    r"^\d+$",                         # Pure numbers
    r"^[\W_]+$",                       # Only punctuation/symbols
    r"^\s+$",                          # Only whitespace
    r"^.{1,2}$",                       # Too short (1-2 chars)
    r"^\d+[\.,]\d+$",                  # Decimal numbers like prices
    r"^\d+%$",                         # Percentages
    r"^(https?|ftp)://",              # URLs
    r"^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$",  # Dates
    r"^v?\d+\.\d+(\.\d+)?$",          # Version numbers
    r"^\d+\s*(MB|GB|KB|TB)$",         # File sizes
    r"^\d+\s*(min|hr|hrs|hours|minutes)$",  # Time durations
]


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

    def preprocess_image(self, image_bytes: bytes) -> Image.Image:
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

    def _is_likely_game_name(self, text: str) -> bool:
        """Return True if the text looks like a plausible game name."""
        text = text.strip()

        # Check minimum length
        if len(text) < 3:
            return False

        # Check noise patterns
        for pattern in NOISE_PATTERNS:
            if re.match(pattern, text, re.IGNORECASE):
                return False

        # Check against common UI text
        if text.lower() in COMMON_UI_TEXT:
            return False

        # Check if it's mostly numbers (more than 70% digits)
        digit_ratio = sum(c.isdigit() for c in text) / max(len(text), 1)
        if digit_ratio > 0.7:
            return False

        # Must have at least one letter
        if not any(c.isalpha() for c in text):
            return False

        return True

    def _clean_candidates(self, raw_lines: List[str]) -> List[str]:
        """Clean and deduplicate candidate game names."""
        candidates = []
        seen = set()

        for line in raw_lines:
            line = line.strip()

            # Remove common OCR artifacts
            line = re.sub(r"[|\\]{2,}", "", line)  # Double pipes/backslashes
            line = re.sub(r"\s{2,}", " ", line)     # Multiple spaces
            line = line.strip(".-_|/\\")             # Leading/trailing symbols

            # Split on obvious separators that wouldn't be in game names
            parts = re.split(r"\s{3,}|\t+", line)

            for part in parts:
                part = part.strip()
                if self._is_likely_game_name(part):
                    normalized = part.lower()
                    if normalized not in seen:
                        seen.add(normalized)
                        candidates.append(part)

        # Sort by length (longer = more likely a full game title)
        candidates.sort(key=lambda x: -len(x))

        return candidates[:50]  # Cap at 50 candidates

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
        candidates = self._clean_candidates(raw_lines)

        return candidates, platform_hint
