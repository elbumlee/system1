"""
OCR 필터(is_likely_game_name, clean_candidates) TDD 테스트
- pytesseract/Pillow 의존성 없이 순수 필터 로직만 검증
- OCRProcessor.detect_platform_hint 도 함께 검증
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from ocr.filters import is_likely_game_name, clean_candidates


# ---------------------------------------------------------------------------
# 1. is_likely_game_name — 게임 이름으로 판단되는 텍스트 검증
# ---------------------------------------------------------------------------
class TestIsLikelyGameName:
    # --- 통과해야 하는 케이스 ---
    def test_normal_game_name_passes(self):
        """일반적인 게임 이름은 True를 반환해야 한다"""
        assert is_likely_game_name("Hollow Knight") is True

    def test_game_name_with_colon_passes(self):
        """콜론이 포함된 게임 이름도 True를 반환해야 한다"""
        assert is_likely_game_name("Dark Souls: Remastered") is True

    def test_game_name_with_numbers_passes(self):
        """숫자가 일부 포함된 게임 이름은 True를 반환해야 한다"""
        assert is_likely_game_name("Halo 3") is True

    def test_game_name_with_roman_numerals_passes(self):
        """로마 숫자가 포함된 이름도 True를 반환해야 한다"""
        assert is_likely_game_name("Final Fantasy XIV") is True

    def test_game_name_three_chars_minimum(self):
        """3자 이상이면 통과해야 한다 (경계값)"""
        assert is_likely_game_name("Ori") is True

    # --- 거부되어야 하는 케이스 ---
    def test_too_short_one_char_rejected(self):
        """1자 텍스트는 False를 반환해야 한다"""
        assert is_likely_game_name("A") is False

    def test_too_short_two_char_rejected(self):
        """2자 텍스트는 False를 반환해야 한다"""
        assert is_likely_game_name("No") is False

    def test_pure_number_rejected(self):
        """순수 숫자는 False를 반환해야 한다"""
        assert is_likely_game_name("12345") is False

    def test_percentage_rejected(self):
        """퍼센트 표현은 False를 반환해야 한다"""
        assert is_likely_game_name("75%") is False

    def test_url_rejected(self):
        """URL은 False를 반환해야 한다"""
        assert is_likely_game_name("https://store.steampowered.com") is False

    def test_date_string_rejected(self):
        """날짜 형식은 False를 반환해야 한다"""
        assert is_likely_game_name("12/05/2024") is False

    def test_version_number_rejected(self):
        """버전 번호는 False를 반환해야 한다"""
        assert is_likely_game_name("v1.2.3") is False

    def test_file_size_rejected(self):
        """파일 용량은 False를 반환해야 한다"""
        assert is_likely_game_name("512 MB") is False

    def test_ui_keyword_library_rejected(self):
        """UI 키워드 'library'는 False를 반환해야 한다"""
        assert is_likely_game_name("library") is False

    def test_ui_keyword_store_rejected(self):
        """UI 키워드 'store'는 False를 반환해야 한다"""
        assert is_likely_game_name("store") is False

    def test_ui_keyword_play_rejected(self):
        """UI 키워드 'play'는 False를 반환해야 한다"""
        assert is_likely_game_name("play") is False

    def test_mostly_digits_rejected(self):
        """70% 이상이 숫자인 텍스트는 False를 반환해야 한다"""
        # "123a" -> 3/4 = 75% 숫자 -> 거부
        assert is_likely_game_name("123a") is False

    def test_no_alpha_rejected(self):
        """알파벳이 전혀 없으면 False를 반환해야 한다"""
        assert is_likely_game_name("!@#$%") is False

    def test_only_symbols_rejected(self):
        """기호만으로 구성된 텍스트는 False를 반환해야 한다"""
        assert is_likely_game_name("---") is False

    def test_whitespace_only_rejected(self):
        """공백만 있는 텍스트는 False를 반환해야 한다"""
        assert is_likely_game_name("   ") is False

    def test_decimal_price_rejected(self):
        """소수점 숫자(가격)는 False를 반환해야 한다"""
        assert is_likely_game_name("9.99") is False


# ---------------------------------------------------------------------------
# 2. clean_candidates — 라인 목록에서 후보 추출
# ---------------------------------------------------------------------------
class TestCleanCandidates:
    def test_returns_list(self):
        """반환값이 리스트여야 한다"""
        result = clean_candidates([])
        assert isinstance(result, list)

    def test_empty_input_returns_empty(self):
        """빈 입력이면 빈 리스트를 반환해야 한다"""
        assert clean_candidates([]) == []

    def test_valid_game_names_included(self):
        """유효한 게임 이름은 결과에 포함되어야 한다"""
        lines = ["Celeste", "Hollow Knight", "Dead Cells"]
        result = clean_candidates(lines)
        assert "Celeste" in result
        assert "Hollow Knight" in result
        assert "Dead Cells" in result

    def test_ui_noise_filtered_out(self):
        """UI 노이즈(store, library 등)는 제거되어야 한다"""
        lines = ["store", "library", "Hades", "play", "search"]
        result = clean_candidates(lines)
        assert "store" not in result
        assert "library" not in result
        assert "play" not in result
        assert "search" not in result
        # 유효한 이름은 남아야 함
        assert "Hades" in result

    def test_duplicates_removed(self):
        """대소문자 관계없이 중복된 항목은 하나만 남아야 한다"""
        lines = ["Hollow Knight", "hollow knight", "HOLLOW KNIGHT"]
        result = clean_candidates(lines)
        # 케이스 정규화 후 하나만 존재해야 함
        lower_result = [r.lower() for r in result]
        assert lower_result.count("hollow knight") == 1

    def test_pure_numbers_filtered(self):
        """순수 숫자는 필터링되어야 한다"""
        lines = ["12345", "Sekiro", "999"]
        result = clean_candidates(lines)
        assert "12345" not in result
        assert "999" not in result
        assert "Sekiro" in result

    def test_result_capped_at_50(self):
        """결과는 최대 50개로 제한되어야 한다"""
        # 60개의 고유 게임 이름 생성
        lines = [f"Game Title Number {i}" for i in range(60)]
        result = clean_candidates(lines)
        assert len(result) <= 50

    def test_longer_names_sorted_first(self):
        """더 긴 이름이 앞에 오도록 정렬되어야 한다"""
        lines = ["Ori", "Hades", "Hollow Knight", "Dead Cells"]
        result = clean_candidates(lines)
        # 첫 번째 항목이 가장 긴 이름이어야 함
        assert result[0] == "Hollow Knight"

    def test_ocr_artifacts_double_pipe_removed(self):
        """OCR 아티팩트(||, \\\\)가 제거되어야 한다"""
        lines = ["||Celeste||"]
        result = clean_candidates(lines)
        # 파이프 제거 후 'Celeste'로 처리되어야 함
        assert any("Celeste" in r for r in result)

    def test_multiple_spaces_collapsed(self):
        """여러 개의 연속 공백은 하나로 합쳐져야 한다"""
        lines = ["Hollow   Knight"]
        result = clean_candidates(lines)
        # 'Hollow Knight'(공백 1개)로 정규화되어야 함
        assert "Hollow Knight" in result

    def test_tab_separated_parts_split(self):
        """탭으로 구분된 텍스트는 분리되어 각각 처리되어야 한다"""
        lines = ["Celeste\t\tHades\t\tOri"]
        result = clean_candidates(lines)
        # 탭으로 분리되어 각 이름이 별도로 처리
        assert "Celeste" in result
        assert "Hades" in result
        assert "Ori" in result


# ---------------------------------------------------------------------------
# 3. detect_platform_hint — 플랫폼 힌트 추출 (OCRProcessor 메서드)
# ---------------------------------------------------------------------------
class TestDetectPlatformHint:
    """
    OCRProcessor를 직접 인스턴스화하면 Pillow/pytesseract 필요.
    여기서는 메서드를 직접 바인딩하여 플랫폼 감지 로직만 단위 테스트.
    """

    @pytest.fixture(autouse=True)
    def patch_processor(self, monkeypatch):
        """OCRProcessor.__init__을 패치하여 의존성 없이 인스턴스화"""
        from ocr import processor as proc_module

        # Pillow와 pytesseract 가용 여부 플래그 강제 설정
        monkeypatch.setattr(proc_module, "PILLOW_AVAILABLE", True)
        monkeypatch.setattr(proc_module, "TESSERACT_AVAILABLE", True)

        from ocr.processor import OCRProcessor

        # __init__을 no-op으로 대체
        original_init = OCRProcessor.__init__
        monkeypatch.setattr(OCRProcessor, "__init__", lambda self: None)

        self.detect = OCRProcessor().detect_platform_hint

    def test_steam_keyword_detected(self):
        """'steam' 키워드가 있으면 'steam'을 반환해야 한다"""
        assert self.detect("steam store page") == "steam"

    def test_steampowered_detected(self):
        """'steampowered' 키워드가 있으면 'steam'을 반환해야 한다"""
        assert self.detect("store.steampowered.com") == "steam"

    def test_epic_games_detected(self):
        """'epic games' 키워드가 있으면 'epic'을 반환해야 한다"""
        assert self.detect("epic games launcher") == "epic"

    def test_epicgames_detected(self):
        """'epicgames' 키워드가 있으면 'epic'을 반환해야 한다"""
        assert self.detect("www.epicgames.com") == "epic"

    def test_nintendo_switch_detected(self):
        """'nintendo' 키워드가 있으면 'switch'를 반환해야 한다"""
        assert self.detect("nintendo switch eshop") == "switch"

    def test_eshop_detected(self):
        """'eshop' 키워드가 있으면 'switch'를 반환해야 한다"""
        assert self.detect("eshop 5000 gold points") == "switch"

    def test_unknown_when_no_keyword(self):
        """플랫폼 키워드가 없으면 'unknown'을 반환해야 한다"""
        assert self.detect("some random game text") == "unknown"

    def test_case_insensitive(self):
        """대소문자 구분 없이 키워드를 인식해야 한다"""
        assert self.detect("STEAM POWERED") == "steam"

    def test_valve_keyword_detected(self):
        """'valve' 키워드가 있으면 'steam'을 반환해야 한다"""
        assert self.detect("valve corporation") == "steam"
