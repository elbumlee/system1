# 4. 기술 스택

> 문서 위치: `docs/design/04-tech-stack.md`  
> 전체 기획서: [`docs/PROJECT.md`](../PROJECT.md)  
> 최종 수정: 2026-05-27

## 백엔드
| 항목 | 기술 |
|------|------|
| 프레임워크 | FastAPI |
| 서버 | Uvicorn |
| OCR | pytesseract + Pillow |
| Excel 저장 | openpyxl |
| Google Sheets | gspread + google-auth |
| 설정 관리 | pydantic-settings + python-dotenv |

## 프론트엔드
| 항목 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| PWA | vite-plugin-pwa |
| 아이콘 | lucide-react |

## 배포/패키징
| 항목 | 기술 |
|------|------|
| Portable .exe | PyInstaller (--onedir) |
| 빌드 자동화 | build.bat |
| 개발 실행 | start.bat / start.sh |
