import { createWorker } from "tesseract.js";
import { ParsedSegment } from "./parser.interface";

type ProgressCallback = (current: number, total: number) => void;

export interface OcrResult {
  segments: ParsedSegment[];
  avgConfidence: number;
}

export async function ocrParsePdf(
  pdfBuffer: Buffer,
  pageCount: number,
  onProgress?: ProgressCallback
): Promise<OcrResult> {
  // pdf-to-img 동적 import
  let pdfToImg: any;
  try {
    pdfToImg = await import("pdf-to-img");
  } catch {
    throw new Error("OCR_UNAVAILABLE: pdf-to-img 모듈을 로드할 수 없습니다.");
  }

  const pages = await pdfToImg.pdf(pdfBuffer, { scale: 2.0 });

  // Tesseract.js v5 API
  const worker = await createWorker("kor+eng");

  const segments: ParsedSegment[] = [];
  let totalConfidence = 0;
  let confCount = 0;
  let pageIdx = 0;

  for await (const pageImage of pages) {
    pageIdx++;
    onProgress?.(pageIdx, pageCount);

    const { data } = await worker.recognize(pageImage);

    if (!data.words || data.words.length === 0) continue;

    // 같은 라인(y좌표 유사)의 단어를 묶어서 세그먼트 구성
    const lineMap = new Map<number, any[]>();

    for (const word of data.words) {
      const lineKey = Math.round(word.bbox.y0 / 10) * 10;
      if (!lineMap.has(lineKey)) lineMap.set(lineKey, []);
      lineMap.get(lineKey)!.push(word);
    }

    const sortedLines = Array.from(lineMap.entries()).sort(
      ([a], [b]) => a - b
    );

    sortedLines.forEach(([_, lineWords], lineIdx) => {
      lineWords.sort((a: any, b: any) => a.bbox.x0 - b.bbox.x0);

      const text = lineWords.map((w: any) => w.text).join(" ");
      const avgConf =
        lineWords.reduce((sum: number, w: any) => sum + w.confidence, 0) /
        lineWords.length /
        100;

      totalConfidence += avgConf;
      confCount++;

      const x = Math.min(...lineWords.map((w: any) => w.bbox.x0));
      const y = Math.min(...lineWords.map((w: any) => w.bbox.y0));
      const x1 = Math.max(...lineWords.map((w: any) => w.bbox.x1));
      const y1 = Math.max(...lineWords.map((w: any) => w.bbox.y1));

      if (text.trim().length > 0 && avgConf >= 0.6) {
        segments.push({
          source: "ocr",
          location: {
            page: pageIdx,
            line: lineIdx + 1,
            x, y,
            width: x1 - x,
            height: y1 - y,
          },
          text: text.trim(),
          confidence: avgConf,
        });
      }
    });
  }

  await worker.terminate();

  return {
    segments,
    avgConfidence: confCount > 0 ? totalConfidence / confCount : 0,
  };
}