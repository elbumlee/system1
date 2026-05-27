# 9. 테스트

> 문서 위치: `docs/design/09-testing.md`  
> 전체 기획서: [`docs/PROJECT.md`](../PROJECT.md)  
> 최종 수정: 2026-05-27

## TDD 적용 현황 — 총 101개 테스트 (전체 GREEN ✅)

| 파일 | 개수 | 내용 |
|------|------|------|
| `backend/tests/test_game_service.py` | 16개 | 게임 CRUD, 즐겨찾기, ID 중복 |
| `backend/tests/test_ocr_filters.py` | 41개 | 신뢰도 필터, 텍스트 정제, 후보 병합 |
| `frontend/src/__tests__/useGameForm.test.ts` | 26개 | 초기화, 유효성 검사, setter, reset |
| `frontend/src/__tests__/useFilteredGames.test.ts` | 18개 | 검색, 플랫폼 필터, 정렬, 즐겨찾기 우선순위 |

## 테스트 실행
```bash
# 백엔드
cd backend && pip install -r test-requirements.txt
pytest tests/ -v

# 프론트엔드
cd frontend && npm test
```
