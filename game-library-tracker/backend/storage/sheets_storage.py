import os
from typing import List, Optional
from datetime import date

try:
    import gspread
    from google.oauth2.service_account import Credentials
    GSPREAD_AVAILABLE = True
except ImportError:
    GSPREAD_AVAILABLE = False

from models import Game
from storage.base import AbstractStorage


HEADERS = ["ID", "Name", "Steam", "Epic", "Switch", "Added Date", "Notes"]

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


class SheetsStorage(AbstractStorage):
    def __init__(self, sheet_id: str, credentials_path: Optional[str] = None):
        if not GSPREAD_AVAILABLE:
            raise RuntimeError(
                "gspread and google-auth are required for Google Sheets storage. "
                "Install them with: pip install gspread google-auth"
            )
        self.sheet_id = sheet_id
        self.credentials_path = credentials_path or os.environ.get("GOOGLE_CREDENTIALS_PATH", "")
        self._client = None
        self._worksheet = None
        self._connect()

    def _connect(self):
        """Establish connection to Google Sheets."""
        if not self.credentials_path or not os.path.exists(self.credentials_path):
            raise ValueError(
                f"Google credentials file not found at: {self.credentials_path}. "
                "Please provide a valid service account credentials JSON file."
            )

        creds = Credentials.from_service_account_file(self.credentials_path, scopes=SCOPES)
        self._client = gspread.authorize(creds)
        spreadsheet = self._client.open_by_key(self.sheet_id)

        # Try to get or create the "Games" worksheet
        try:
            self._worksheet = spreadsheet.worksheet("Games")
        except gspread.WorksheetNotFound:
            self._worksheet = spreadsheet.add_worksheet(title="Games", rows=1000, cols=len(HEADERS))
            self._setup_headers()

        # Ensure headers exist
        existing_headers = self._worksheet.row_values(1)
        if not existing_headers or existing_headers != HEADERS:
            self._setup_headers()

    def _setup_headers(self):
        """Write header row to the sheet."""
        self._worksheet.update("A1:G1", [HEADERS])
        # Bold the header row
        self._worksheet.format("A1:G1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.12, "green": 0.31, "blue": 0.47},
        })

    def _row_to_game(self, row: list) -> Optional[Game]:
        """Convert a sheet row (list) to a Game object."""
        if not row or not row[0]:
            return None
        # Pad row to ensure it has 7 elements
        while len(row) < 7:
            row.append("")

        game_id, name, steam, epic, switch, added_date, notes = row[:7]
        return Game(
            id=str(game_id),
            name=str(name) if name else "",
            steam=str(steam).upper() in ("TRUE", "1", "YES"),
            epic=str(epic).upper() in ("TRUE", "1", "YES"),
            switch=str(switch).upper() in ("TRUE", "1", "YES"),
            added_date=str(added_date) if added_date else date.today().isoformat(),
            notes=str(notes) if notes else "",
        )

    def get_all_games(self) -> List[Game]:
        """Read all games from the Google Sheet."""
        all_values = self._worksheet.get_all_values()
        games = []
        for row in all_values[1:]:  # Skip header row
            game = self._row_to_game(row)
            if game:
                games.append(game)
        return games

    def _find_row_by_id(self, game_id: str) -> Optional[int]:
        """Find the 1-based row index of a game by ID."""
        id_col = self._worksheet.col_values(1)
        for idx, cell_val in enumerate(id_col):
            if cell_val == game_id:
                return idx + 1  # 1-based
        return None

    def add_game(self, game: Game) -> Game:
        """Append a new game row to the Google Sheet."""
        row_data = [
            game.id,
            game.name,
            str(game.steam),
            str(game.epic),
            str(game.switch),
            game.added_date,
            game.notes,
        ]
        self._worksheet.append_row(row_data)
        return game

    def update_game(self, game_id: str, updates: dict) -> Optional[Game]:
        """Update a game's fields in the Google Sheet."""
        row_idx = self._find_row_by_id(game_id)
        if row_idx is None:
            return None

        row = self._worksheet.row_values(row_idx)
        while len(row) < 7:
            row.append("")

        if "name" in updates and updates["name"] is not None:
            row[1] = updates["name"]
        if "steam" in updates and updates["steam"] is not None:
            row[2] = str(updates["steam"])
        if "epic" in updates and updates["epic"] is not None:
            row[3] = str(updates["epic"])
        if "switch" in updates and updates["switch"] is not None:
            row[4] = str(updates["switch"])
        if "notes" in updates and updates["notes"] is not None:
            row[6] = updates["notes"]

        self._worksheet.update(f"A{row_idx}:G{row_idx}", [row])
        return self.get_game_by_id(game_id)

    def delete_game(self, game_id: str) -> bool:
        """Delete a game row from the Google Sheet."""
        row_idx = self._find_row_by_id(game_id)
        if row_idx is None:
            return False
        self._worksheet.delete_rows(row_idx)
        return True
