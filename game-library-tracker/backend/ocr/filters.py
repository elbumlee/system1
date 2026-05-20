import re
from typing import List


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


def is_likely_game_name(text: str) -> bool:
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


def clean_candidates(raw_lines: List[str]) -> List[str]:
    """Clean and deduplicate candidate game names."""
    candidates = []
    seen = set()

    for line in raw_lines:
        line = line.strip()

        # Remove common OCR artifacts
        line = re.sub(r"[|\\]{2,}", "", line)  # Double pipes/backslashes
        line = line.strip(".-_|/\\")             # Leading/trailing symbols

        # Split on obvious separators that wouldn't be in game names
        # (탭 분리를 공백 정규화 전에 수행해야 탭이 보존됨)
        parts = re.split(r"\t+", line)
        parts = [re.sub(r" {2,}", " ", p) for p in parts]  # Multiple spaces in each part

        for part in parts:
            part = part.strip()
            if is_likely_game_name(part):
                normalized = part.lower()
                if normalized not in seen:
                    seen.add(normalized)
                    candidates.append(part)

    # Sort by length (longer = more likely a full game title)
    candidates.sort(key=lambda x: -len(x))

    return candidates[:50]  # Cap at 50 candidates
