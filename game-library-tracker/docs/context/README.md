# 모듈 컨텍스트 파일 사용법

## 목적

각 파일은 **하나의 모듈**의 현재 코드 + 인터페이스 계약을 담고 있습니다.
기능 수정 시 관련 모듈 파일만 Claude에 붙여넣어 비용을 절감합니다.

## 파일 목록

| 파일 | 모듈 | 수정이 필요한 경우 |
|------|------|-----------------|
| `B1-models.md` | 데이터 모델 | 게임 필드 추가/제거 |
| `B2-config.md` | 설정/환경변수 | 새 환경변수 추가 |
| `B3-storage.md` | 저장소 (Excel/Sheets) | 저장 로직 변경, 새 백엔드 추가 |
| `B4-ocr.md` | OCR 처리 | OCR 엔진 교체, 필터 규칙 변경 |
| `B5-services.md` | 비즈니스 로직 | 게임 생성/수정 규칙 변경 |
| `B6-routers.md` | HTTP API | 새 엔드포인트 추가 |
| `F1-types.md` | TypeScript 타입 | B1-models와 항상 함께 수정 |
| `F2-api.md` | HTTP 클라이언트 | 새 API 함수 추가 |
| `F3-store.md` | 전역 상태 | 정렬/필터 로직, 새 상태 추가 |
| `F6-library.md` | 게임 목록 UI | 테이블 컬럼, 인라인 편집 |
| `F7-game-form.md` | 게임 추가 폼 | 폼 필드, 장르 목록 |
| `F8-scanner.md` | OCR 스캐너 UI | 후보 표시, 신뢰도 임계값 |

## 사용법

### 예시: 게임에 "평점" 필드 추가
Claude에게 다음 파일들을 붙여넣고 요청:
```
[B1-models.md 내용]
[F1-types.md 내용]
[B3-storage.md 내용]
[F6-library.md 내용]
[F7-game-form.md 내용]

위 파일들을 참고하여 Game에 rating(1-5) 필드를 추가해줘.
```

### 예시: OCR 필터 규칙 변경
```
[B4-ocr.md 내용]

ocr/filters.py의 COMMON_UI_TEXT에 "INSTALLED", "UPDATE" 추가해줘.
```

## 업데이트 규칙

코드 수정 후 해당 모듈의 컨텍스트 파일도 같이 업데이트해야 합니다.
