import { Router, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { upload } from "../middleware/upload.middleware";
import { concurrencyLimit } from "../middleware/rateLimit.middleware";
import { jobStore } from "../store/jobStore";
import { deleteTmpFile } from "../utils/cleanup";
import { parseExcel } from "../services/parser/excel.parser";
import { parseWord } from "../services/parser/word.parser";
import { parsePdf } from "../services/parser/pdf.parser";
import { ocrParsePdf } from "../services/parser/ocr.parser";
import { detectPII } from "../services/detector/pii.detector";
import { applyMasking } from "../services/masker/pii.masker";
import { overlayMaskPdf } from "../services/generator/pdf.overlay";
import { generateNewPdf } from "../services/generator/pdf.generator";
import {
  JobData, SourceType, ParsedSegment,
  UploadResponse, PreviewResponse, PIIType,
} from "../services/parser/parser.interface";

const router = Router();

// Express 4 async 에러 래퍼
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ========== POST /api/upload ==========
router.post(
  "/",
  concurrencyLimit,
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "파일이 첨부되지 않았습니다." });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const jobId = uuidv4();
    const filePath = file.path;
    const warnings: string[] = [];

    try {
      const buffer = await fs.promises.readFile(filePath);
      let segments: ParsedSegment[] = [];
      let sourceType: SourceType = "pdf";
      let fileType: "xlsx" | "docx" | "pdf" = "pdf";
      let originalPdfBuffer: Buffer | undefined;

      if (ext === ".xlsx" || ext === ".xls") {
        fileType = "xlsx";
        sourceType = "excel";
        segments = await parseExcel(buffer);

      } else if (ext === ".docx") {
        fileType = "docx";
        sourceType = "word";
        segments = await parseWord(buffer);

      } else if (ext === ".pdf") {
        fileType = "pdf";
        originalPdfBuffer = buffer;

        const pdfResult = await parsePdf(buffer);

        if (pdfResult.isImagePdf) {
          sourceType = "ocr";
          warnings.push("이미지 기반 PDF입니다. OCR 인식 결과의 정확도가 낮을 수 있습니다.");

          try {
            const ocrResult = await ocrParsePdf(buffer, pdfResult.pageCount);
            segments = ocrResult.segments;

            if (ocrResult.avgConfidence < 0.7) {
              warnings.push("OCR 평균 신뢰도가 낮습니다. 결과를 꼭 확인해 주세요.");
            }
          } catch (ocrErr: any) {
            warnings.push(`OCR 처리 실패: ${ocrErr.message}`);
            segments = [];
          }
        } else {
          sourceType = "pdf";
          segments = pdfResult.segments;
        }
      }

      // 파싱 완료 → 원본 파일 즉시 삭제
      deleteTmpFile(filePath);

      // PII 탐지
      const detectedPII = detectPII(segments);

      // Job 저장
      const job: JobData = {
        id: jobId,
        status: "ready",
        fileName: file.originalname,
        fileType,
        sourceType,
        segments,
        detectedPII,
        originalPdfBuffer,
        createdAt: Date.now(),
      };
      jobStore.set(jobId, job);

      const response: UploadResponse = {
        jobId,
        status: "ready",
        fileName: file.originalname,
        totalDetected: detectedPII.length,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      return res.json(response);

    } catch (err: any) {
      deleteTmpFile(filePath);

      if (err.message === "ENCRYPTED_PDF") {
        return res.status(422).json({
          error: "암호화된 PDF입니다. 비밀번호를 해제 후 다시 업로드해 주세요.",
        });
      }

      console.error("[upload] 처리 오류:", err);
      return res.status(500).json({ error: "파일 처리 중 오류가 발생했습니다." });
    }
  })
);

// ========== GET /api/preview/:jobId ==========
router.get("/preview/:jobId", (req: Request, res: Response) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "작업이 만료되었거나 존재하지 않습니다." });
  }

  const response: PreviewResponse = {
    jobId: job.id,
    status: job.status,
    fileName: job.fileName,
    items: job.detectedPII,
  };

  return res.json(response);
});

// ========== PATCH /api/preview/:jobId ==========
router.patch("/preview/:jobId", (req: Request, res: Response) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "작업이 만료되었거나 존재하지 않습니다." });
  }

  const { updates, additions } = req.body as {
    updates?: { id: string; excluded: boolean }[];
    additions?: {
      type: string;
      originalText: string;
      segmentIndex: number;
      startIndex: number;
      endIndex: number;
    }[];
  };

  if (updates) {
    for (const u of updates) {
      const item = job.detectedPII.find((d) => d.id === u.id);
      if (item) item.excluded = u.excluded;
    }
  }

  const VALID_PII_TYPES: PIIType[] = ["주민등록번호", "전화번호", "생년월일", "주소", "이름"];

  if (additions) {
    for (const add of additions) {
      if (!VALID_PII_TYPES.includes(add.type as PIIType)) continue;

      const segIdx = typeof add.segmentIndex === "number" ? add.segmentIndex : -1;
      const seg = job.segments[segIdx];
      if (!seg) continue;

      const segLen = seg.text.length;
      const start = typeof add.startIndex === "number" ? add.startIndex : -1;
      const end = typeof add.endIndex === "number" ? add.endIndex : -1;
      if (start < 0 || end <= start || end > segLen) continue;

      job.detectedPII.push({
        id: uuidv4(),
        type: add.type as PIIType,
        originalText: add.originalText,
        maskedText: `[${add.type}]`,
        confidence: 1.0,
        segment: seg,
        startIndex: start,
        endIndex: end,
        excluded: false,
      });
    }
  }

  jobStore.set(job.id, job);
  return res.json({ success: true, totalDetected: job.detectedPII.length });
});

// ========== POST /api/download/:jobId ==========
router.post(
  "/download/:jobId",
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const job = jobStore.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "작업이 만료되었거나 존재하지 않습니다." });
    }

    job.status = "generating";
    let pdfBuffer: Buffer;

    if (
      (job.sourceType === "pdf" || job.sourceType === "ocr") &&
      job.originalPdfBuffer
    ) {
      pdfBuffer = await overlayMaskPdf(job.originalPdfBuffer, job.detectedPII);
    } else {
      const maskedSegments = applyMasking(job.segments, job.detectedPII);
      const srcType = job.fileType === "xlsx" ? "excel" : "word";
      pdfBuffer = await generateNewPdf(maskedSegments, srcType);
    }

    const fileName = `masked_${path.parse(job.fileName).name}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(pdfBuffer);

    jobStore.delete(job.id);
  })
);

// ========== DELETE /api/job/:jobId ==========
router.delete("/job/:jobId", (req: Request, res: Response) => {
  jobStore.delete(req.params.jobId);
  return res.json({ success: true });
});

export default router;