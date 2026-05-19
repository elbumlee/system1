# B-4: ocr — 이미지 텍스트 인식

## 책임 범위

- 이미지 파일에서 게임 이름 후보 추출 (Tesseract OCR)
- 신뢰도 점수 계산 (단어 수준 → 줄 수준 평균)
- 노이즈/UI 텍스트 필터링
- 플랫폼 힌트 감지 (스크린샷 특징 기반)

## 파일

```
backend/ocr/
  __init__.py       ← OCRProcessor, clean_candidates export
  processor.py      ← 이미지 → OCRCandidate 목록
  filters.py        ← 노이즈 필터링 규칙
```

## 인터페이스

### processor.py

```python
class OCRProcessor:
    def process(self, image_bytes: bytes) -> Tuple[List[OCRCandidate], str]:
        """
        Returns:
            candidates: 신뢰도 기준 내림차순 정렬된 후보 목록
            platform_hint: "steam"|"epic"|"switch"|"unknown"
        """
```

### filters.py

```python
COMMON_UI_TEXT: Set[str]    # "Library", "Store", "PLAY" 등 UI 텍스트
NOISE_PATTERNS: List[str]   # 숫자만, 특수문자만 등 정규식 패턴

def is_likely_game_name(text: str) -> bool: ...
def clean_candidates(raw_lines: List[str]) -> List[str]: ...
```

## 신뢰도 계산 규칙

```
1. pytesseract.image_to_data(DICT output_type)로 단어 수준 데이터 취득
2. (block_num, par_num, line_num) 키로 단어를 줄 단위로 그룹핑
3. 줄 내 단어들의 conf 평균 = 줄 신뢰도
4. 줄 텍스트를 OCRCandidate.name, 줄 신뢰도를 confidence로 설정
5. image_to_data 실패 시 image_to_string 폴백 (confidence=70.0 고정)
```

## 규칙

### 변경 규칙
1. **OCR 엔진 교체**: `processor.py`만 수정. 반환 타입(`List[OCRCandidate]`, `str`)은 유지.
2. **필터 규칙 추가**: `filters.py`의 `COMMON_UI_TEXT`나 `NOISE_PATTERNS`에 항목 추가.
   다른 파일 수정 불필요.
3. **플랫폼 힌트 개선**: `processor.py` 내 `_detect_platform()` 함수만 수정.

### 금지 사항
- `processor.py`에서 `filters.py` 외 다른 모듈 import 금지.
- OCR 모듈이 저장소(B-3)나 서비스(B-5)를 참조 금지.
- 이미지 캐시는 B-5(ocr_service)가 관리. 이 모듈에서 캐시 로직 금지.
- Tesseract 설정값(lang, config) 하드코딩 금지. 상수로 분리:
  ```python
  TESSERACT_LANG = "kor+eng"
  TESSERACT_CONFIG = "--psm 6"
  ```

## 필터 업데이트 시나리오

스팀 라이브러리 스크린샷에서 "INSTALLED", "UPDATE" 같은 버튼 텍스트가 후보로 잡힌다면:
```python
# filters.py
COMMON_UI_TEXT.update({"INSTALLED", "UPDATE", "DOWNLOAD"})
```
영향: **B-4(ocr/filters.py) 만**
