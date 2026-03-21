import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import uploadRouter from "./routes/upload.route";
import { cleanupTmpOnStartup } from "./utils/cleanup";
import { jobStore } from "./store/jobStore";

const app = express();
const PORT = process.env.PORT || 3001;

// 스타트업 정리
cleanupTmpOnStartup();
jobStore.clearAll();

// 미들웨어
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000").split(",");
app.use(cors({
  origin: (origin, callback) => {
    // 동일 서버(origin 없음) 또는 허용 목록에 있는 경우만 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS 정책에 의해 차단되었습니다."));
    }
  },
}));
app.use(express.json());

// 라우트
app.use("/api/upload", uploadRouter);

// 에러 핸들러
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "파일 크기가 10MB를 초과합니다." });
  }
  if (err.message === "UNSUPPORTED_FILE_TYPE") {
    return res.status(400).json({
      error: "지원하지 않는 파일 형식입니다. (.xlsx, .docx, .pdf만 가능)",
    });
  }
  console.error("[server] 예상치 못한 오류:", err);
  return res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
});

app.listen(PORT, () => {
  console.log(`PII Masker 서버 실행 중: http://localhost:${PORT}`);
});

export default app;