#!/bin/bash
# ============================================
# PII Masker — 서버 파일 자동 생성 스크립트
# 실행법: bash setup-server.sh
# ============================================

echo "📦 PII Masker 서버 파일 생성 시작..."

# 폴더 생성
mkdir -p server/src/{routes,services/{parser,detector,masker,generator},middleware,store,utils}
mkdir -p fonts tmp

echo "✅ 폴더 구조 생성 완료"

# ---- 1. package.json ----
cat > server/package.json << 'ENDOFFILE'
{
  "name": "pii-masker-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "multer": "1.4.5-lts.1",
    "uuid": "^9.0.1",
    "exceljs": "^4.4.0",
    "mammoth": "^1.8.0",
    "pdf-parse": "^1.1.1",
    "pdf-lib": "^1.17.1",
    "@pdf-lib/fontkit": "^1.1.1",
    "pdfkit": "^0.14.0",
    "tesseract.js": "^5.1.1",
    "pdf-to-img": "^4.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.11",
    "@types/uuid": "^9.0.7",
    "@types/pdfkit": "^0.13.4",
    "@types/node": "^20.11.0"
  }
}
ENDOFFILE
echo "  ✅ server/package.json"

# ---- 2. tsconfig.json ----
cat > server/tsconfig.json << 'ENDOFFILE'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
ENDOFFILE
echo "  ✅ server/tsconfig.json"

# ---- 3. app.ts ----
cat > server/src/app.ts << 'ENDOFFILE'
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import uploadRouter from "./routes/upload.route";
import { cleanupTmpOnStartup } from "./utils/cleanup";
import { jobStore } from "./store/jobStore";

const app = express();
const PORT = process.env.PORT || 3001;

cleanupTmpOnStartup();
jobStore.clearAll();

app.use(cors());
app.use(express.json());
app.use("/api/upload", uploadRouter);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "파일 크기가 10MB를 초과합니다." });
  }
  if (err.message === "UNSUPPORTED_FILE_TYPE") {
    return res.status(400).json({ error: "지원하지 않는 파일 형식입니다." });
  }
  console.error("[server] 오류:", err);
  return res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
});

app.listen(PORT, () => {
  console.log(`PII Masker 서버 실행 중: http://localhost:${PORT}`);
});

export default app;
ENDOFFILE
echo "  ✅ server/src/app.ts"

# ---- 4. jobStore.ts ----
cat > server/src/store/jobStore.ts << 'ENDOFFILE'
import { JobData } from "../services/parser/parser.interface";

const TTL_MS = 15 * 60 * 1000;
const jobs = new Map<string, JobData>();
const timers = new Map<string, NodeJS.Timeout>();

export const jobStore = {
  set(id: string, data: JobData) {
    jobs.set(id, data);
    if (timers.has(id)) clearTimeout(timers.get(id)!);
    timers.set(id, setTimeout(() => this.delete(id), TTL_MS));
  },
  get(id: string): JobData | undefined { return jobs.get(id); },
  delete(id: string) {
    jobs.delete(id);
    if (timers.has(id)) { clearTimeout(timers.get(id)!); timers.delete(id); }
  },
  clearAll() { for (const [id] of jobs) this.delete(id); },
  activeCount(): number { return jobs.size; },
};
ENDOFFILE
echo "  ✅ server/src/store/jobStore.ts"

# ---- 5. cleanup.ts ----
cat > server/src/utils/cleanup.ts << 'ENDOFFILE'
import * as fs from "fs";
import * as path from "path";

const TMP_DIR = path.resolve(__dirname, "..", "..", "tmp");

export function cleanupTmpOnStartup() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    console.log(`[cleanup] tmp 디렉토리 생성: ${TMP_DIR}`);
    return;
  }
  const files = fs.readdirSync(TMP_DIR);
  for (const file of files) {
    try { fs.unlinkSync(path.join(TMP_DIR, file)); } catch {}
  }
  console.log(`[cleanup] tmp 정리 완료 (${files.length}건)`);
}

export function deleteTmpFile(filePath: string) {
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
}
ENDOFFILE
echo "  ✅ server/src/utils/cleanup.ts"

# ---- 6. upload.middleware.ts ----
cat > server/src/middleware/upload.middleware.ts << 'ENDOFFILE'
import multer from "multer";
import * as path from "path";

const TMP_DIR_PATH = path.resolve(__dirname, "..", "..", "tmp");

const ALLOWED_MIMES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
]);
const ALLOWED_EXTS = new Set([".xlsx", ".xls", ".docx", ".pdf"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => { cb(null, TMP_DIR_PATH); },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.has(ext) || !ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error("UNSUPPORTED_FILE_TYPE"));
    }
    cb(null, true);
  },
});
ENDOFFILE
echo "  ✅ server/src/middleware/upload.middleware.ts"

# ---- 7. rateLimit.middleware.ts ----
cat > server/src/middleware/rateLimit.middleware.ts << 'ENDOFFILE'
import { Request, Response, NextFunction } from "express";
import { jobStore } from "../store/jobStore";

const MAX_CONCURRENT = 3;

export function concurrencyLimit(req: Request, res: Response, next: NextFunction) {
  if (jobStore.activeCount() >= MAX_CONCURRENT) {
    return res.status(429).json({ error: "서버가 현재 처리 중입니다. 잠시 후 다시 시도해 주세요." });
  }
  next();
}
ENDOFFILE
echo "  ✅ server/src/middleware/rateLimit.middleware.ts"

# ---- 8. parser.interface.ts ----
cat > server/src/services/parser/parser.interface.ts << 'ENDOFFILE'
export type SourceType = "excel" | "word" | "pdf" | "ocr";

export interface SegmentLocation {
  sheet?: string; row?: number; col?: number; header?: string;
  paragraph?: number;
  page?: number; line?: number;
  x?: number; y?: number; width?: number; height?: number;
}

export interface ParsedSegment {
  source: SourceType;
  location: SegmentLocation;
  text: string;
  confidence?: number;
}

export type PIIType = "주민등록번호" | "전화번호" | "생년월일" | "주소" | "이름";

export interface DetectedPII {
  id: string; type: PIIType; originalText: string; maskedText: string;
  confidence: number; segment: ParsedSegment;
  startIndex: number; endIndex: number; excluded: boolean;
}

export type JobStatus = "parsing" | "detecting" | "ready" | "generating" | "done" | "error";

export interface JobData {
  id: string; status: JobStatus; fileName: string;
  fileType: "xlsx" | "docx" | "pdf"; sourceType: SourceType;
  segments: ParsedSegment[]; detectedPII: DetectedPII[];
  originalPdfBuffer?: Buffer; createdAt: number;
  error?: string; ocrProgress?: { current: number; total: number };
}

export interface UploadResponse {
  jobId: string; status: JobStatus; fileName: string;
  totalDetected: number; warnings?: string[];
}

export interface PreviewResponse {
  jobId: string; status: JobStatus; fileName: string;
  items: DetectedPII[]; warnings?: string[];
}
ENDOFFILE
echo "  ✅ server/src/services/parser/parser.interface.ts"

# ---- 9. excel.parser.ts ----
cat > server/src/services/parser/excel.parser.ts << 'ENDOFFILE'
import ExcelJS from "exceljs";
import { ParsedSegment } from "./parser.interface";

export async function parseExcel(buffer: Buffer): Promise<ParsedSegment[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const segments: ParsedSegment[] = [];

  workbook.eachSheet((sheet) => {
    const headers: Record<number, string> = {};
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const text = cell.text?.toString().trim();
        if (!text) return;
        if (rowNumber === 1) { headers[colNumber] = text; return; }
        segments.push({
          source: "excel",
          location: { sheet: sheet.name, row: rowNumber, col: colNumber, header: headers[colNumber] || undefined },
          text,
        });
      });
    });
  });
  return segments;
}
ENDOFFILE
echo "  ✅ server/src/services/parser/excel.parser.ts"

# ---- 10. word.parser.ts ----
cat > server/src/services/parser/word.parser.ts << 'ENDOFFILE'
import mammoth from "mammoth";
import { ParsedSegment } from "./parser.interface";

export async function parseWord(buffer: Buffer): Promise<ParsedSegment[]> {
  const result = await mammoth.extractRawText({ buffer });
  const paragraphs = result.value.split("\n").filter((p) => p.trim().length > 0);
  return paragraphs.map((text, idx) => ({
    source: "word" as const,
    location: { paragraph: idx + 1 },
    text: text.trim(),
  }));
}
ENDOFFILE
echo "  ✅ server/src/services/parser/word.parser.ts"

# ---- 11. pdf.parser.ts ----
cat > server/src/services/parser/pdf.parser.ts << 'ENDOFFILE'
import pdfParse from "pdf-parse";
import { ParsedSegment } from "./parser.interface";

export interface PdfParseResult {
  segments: ParsedSegment[]; isImagePdf: boolean; pageCount: number;
}

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  let data: Awaited<ReturnType<typeof pdfParse>>;
  try { data = await pdfParse(buffer); }
  catch (err: any) {
    if (err.message?.includes("encrypted") || err.message?.includes("password"))
      throw new Error("ENCRYPTED_PDF");
    throw err;
  }
  const totalText = data.text?.trim() || "";
  const pageCount = data.numpages || 1;
  if (totalText.length < 10) return { segments: [], isImagePdf: true, pageCount };

  const pages = totalText.split("\f");
  const segments: ParsedSegment[] = [];
  pages.forEach((pageText, pageIdx) => {
    const lines = pageText.split("\n").filter((l) => l.trim().length > 0);
    lines.forEach((line, lineIdx) => {
      segments.push({ source: "pdf", location: { page: pageIdx + 1, line: lineIdx + 1 }, text: line.trim() });
    });
  });
  return { segments, isImagePdf: false, pageCount };
}
ENDOFFILE
echo "  ✅ server/src/services/parser/pdf.parser.ts"

# ---- 12. ocr.parser.ts ----
cat > server/src/services/parser/ocr.parser.ts << 'ENDOFFILE'
import { createWorker } from "tesseract.js";
import { ParsedSegment } from "./parser.interface";

type ProgressCallback = (current: number, total: number) => void;
export interface OcrResult { segments: ParsedSegment[]; avgConfidence: number; }

export async function ocrParsePdf(
  pdfBuffer: Buffer, pageCount: number, onProgress?: ProgressCallback
): Promise<OcrResult> {
  let pdfToImg: any;
  try { pdfToImg = await import("pdf-to-img"); }
  catch { throw new Error("OCR_UNAVAILABLE"); }

  const pages = await pdfToImg.pdf(pdfBuffer, { scale: 2.0 });
  const worker = await createWorker("kor+eng");
  const segments: ParsedSegment[] = [];
  let totalConf = 0, confCnt = 0, pageIdx = 0;

  for await (const pageImage of pages) {
    pageIdx++; onProgress?.(pageIdx, pageCount);
    const { data } = await worker.recognize(pageImage);
    if (!data.words || data.words.length === 0) continue;

    const lineMap = new Map<number, any[]>();
    for (const word of data.words) {
      const key = Math.round(word.bbox.y0 / 10) * 10;
      if (!lineMap.has(key)) lineMap.set(key, []);
      lineMap.get(key)!.push(word);
    }

    Array.from(lineMap.entries()).sort(([a], [b]) => a - b)
      .forEach(([_, lineWords], lineIdx) => {
        lineWords.sort((a: any, b: any) => a.bbox.x0 - b.bbox.x0);
        const text = lineWords.map((w: any) => w.text).join(" ");
        const avgConf = lineWords.reduce((s: number, w: any) => s + w.confidence, 0) / lineWords.length / 100;
        totalConf += avgConf; confCnt++;
        const x = Math.min(...lineWords.map((w: any) => w.bbox.x0));
        const y = Math.min(...lineWords.map((w: any) => w.bbox.y0));
        const x1 = Math.max(...lineWords.map((w: any) => w.bbox.x1));
        const y1 = Math.max(...lineWords.map((w: any) => w.bbox.y1));
        if (text.trim().length > 0 && avgConf >= 0.6) {
          segments.push({ source: "ocr", location: { page: pageIdx, line: lineIdx+1, x, y, width: x1-x, height: y1-y }, text: text.trim(), confidence: avgConf });
        }
      });
  }
  await worker.terminate();
  return { segments, avgConfidence: confCnt > 0 ? totalConf / confCnt : 0 };
}
ENDOFFILE
echo "  ✅ server/src/services/parser/ocr.parser.ts"

echo ""
echo "📦 서버 파일 Part 1 (12/19) 생성 완료!"
echo "➡️ 다음: bash setup-server2.sh 실행"