import os
from pathlib import Path
from typing import List, Optional
from datetime import date

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

from models import Game


HEADERS = ["ID", "Name", "Steam", "Epic", "Switch", "Added Date", "Notes"]


class ExcelStorage:
    def __init__(self, file_path: Optional[str] = None):
        if file_path:
            self.file_path = Path(os.path.expanduser(file_path))
        else:
            self.file_path = Path.home() / "game_library.xlsx"
        self._ensure_file()

    def _ensure_file(self):
        """Create the Excel file with headers if it doesn't exist."""
        if not self.file_path.exists():
            wb = Workbook()
            ws = wb.active
            ws.title = "Games"

            # Style the header row
            header_font = Font(bold=True, color="FFFFFF")
            header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
            header_alignment = Alignment(horizontal="center", vertical="center")

            for col_idx, header in enumerate(HEADERS, start=1):
                cell = ws.cell(row=1, column=col_idx, value=header)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = header_alignment

            # Set column widths
            col_widths = [36, 40, 8, 8, 8, 15, 40]
            for col_idx, width in enumerate(col_widths, start=1):
                ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = width

            wb.save(self.file_path)

    def _load_workbook(self):
        return load_workbook(self.file_path)

    def get_all_games(self) -> List[Game]:
        """Read all games from the Excel file."""
        wb = self._load_workbook()
        ws = wb.active
        games = []

        for row in ws.iter_rows(min_row=2, values_only=True):
            if row[0] is None:
                continue
            game_id, name, steam, epic, switch, added_date, notes = row
            games.append(Game(
                id=str(game_id),
                name=str(name) if name else "",
                steam=bool(steam) if steam is not None else False,
                epic=bool(epic) if epic is not None else False,
                switch=bool(switch) if switch is not None else False,
                added_date=str(added_date) if added_date else date.today().isoformat(),
                notes=str(notes) if notes else "",
            ))

        return games

    def get_game_by_id(self, game_id: str) -> Optional[Game]:
        """Find a game by ID."""
        games = self.get_all_games()
        for game in games:
            if game.id == game_id:
                return game
        return None

    def add_game(self, game: Game) -> Game:
        """Append a new game row to the Excel file."""
        wb = self._load_workbook()
        ws = wb.active

        # Find next empty row
        next_row = ws.max_row + 1

        ws.cell(row=next_row, column=1, value=game.id)
        ws.cell(row=next_row, column=2, value=game.name)
        ws.cell(row=next_row, column=3, value=game.steam)
        ws.cell(row=next_row, column=4, value=game.epic)
        ws.cell(row=next_row, column=5, value=game.switch)
        ws.cell(row=next_row, column=6, value=game.added_date)
        ws.cell(row=next_row, column=7, value=game.notes)

        wb.save(self.file_path)
        return game

    def update_game(self, game_id: str, updates: dict) -> Optional[Game]:
        """Update a game's fields in the Excel file."""
        wb = self._load_workbook()
        ws = wb.active

        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=False), start=2):
            if row[0].value == game_id:
                if "name" in updates and updates["name"] is not None:
                    ws.cell(row=row_idx, column=2, value=updates["name"])
                if "steam" in updates and updates["steam"] is not None:
                    ws.cell(row=row_idx, column=3, value=updates["steam"])
                if "epic" in updates and updates["epic"] is not None:
                    ws.cell(row=row_idx, column=4, value=updates["epic"])
                if "switch" in updates and updates["switch"] is not None:
                    ws.cell(row=row_idx, column=5, value=updates["switch"])
                if "notes" in updates and updates["notes"] is not None:
                    ws.cell(row=row_idx, column=7, value=updates["notes"])
                wb.save(self.file_path)

                # Reload and return updated game
                return self.get_game_by_id(game_id)

        return None

    def delete_game(self, game_id: str) -> bool:
        """Delete a game row from the Excel file."""
        wb = self._load_workbook()
        ws = wb.active

        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=False), start=2):
            if row[0].value == game_id:
                ws.delete_rows(row_idx)
                wb.save(self.file_path)
                return True

        return False

    def get_file_path(self) -> str:
        return str(self.file_path)
