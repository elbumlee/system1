# 7. 데이터 모델

> 문서 위치: `docs/design/07-data-model.md`  
> 전체 기획서: [`docs/PROJECT.md`](../PROJECT.md)  
> 최종 수정: 2026-05-27

## Game
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string (UUID) | 고유 식별자 |
| name | string | 게임 이름 (필수) |
| steam | boolean | Steam 보유 여부 |
| epic | boolean | Epic Games 보유 여부 |
| switch | boolean | Nintendo Switch 보유 여부 |
| added_date | string (YYYY-MM-DD) | 추가일 |
| genre | string | 장르 |
| favorite | boolean | 즐겨찾기 |
| notes | string | 메모 |

## 장르 목록 (16종)
RPG, MMORPG, FPS, 슈팅, 뱀서류, 온라인, 어드벤처, 전략, 시뮬레이션, 퍼즐, 스포츠, 액션, 플랫폼, 격투, 공포, 기타
