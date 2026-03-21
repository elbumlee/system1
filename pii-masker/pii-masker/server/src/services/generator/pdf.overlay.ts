import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as fs from "fs";
import * as path from "path";
import { DetectedPII } from "../parser/parser.interface";

// server/src/services/generator/ → server/fonts/
const FONT_PATH = path.resolve(
  __dirname, "..", "..", "..", "fonts", "NotoSansKR-Regular.subset.ttf"
);

export async function overlayMaskPdf(
  originalPdfBuffer: Buffer,
  detectedItems: DetectedPII[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(originalPdfBuffer);

  // fontkit 등록
  pdfDoc.registerFontkit(fontkit);

  // 한글 폰트 로드
  let korFont: any;
  try {
    if (!fs.existsSync(FONT_PATH)) {
      console.warn("[overlay] 한글 폰트를 찾을 수 없습니다:", FONT_PATH);
      throw new Error("FONT_NOT_FOUND");
    }
    const fontBytes = fs.readFileSync(FONT_PATH);
    korFont = await pdfDoc.embedFont(fontBytes);
  } catch {
    // 폰트 로드 실패 시 기본 폰트 사용 (한글 마스킹 태그가 깨질 수 있음)
    console.warn("[overlay] 한글 폰트 로드 실패 — Helvetica로 대체합니다. 마스킹 태그가 깨질 수 있습니다.");
    korFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const pages = pdfDoc.getPages();
  const activeItems = detectedItems.filter((item) => !item.excluded);

  // OCR 이미지 렌더링 스케일 (ocr.parser.ts의 scale: 2.0과 일치해야 함)
  const OCR_SCALE = 2.0;

  for (const item of activeItems) {
    const loc = item.segment.location;
    const pageIdx = (loc.page || 1) - 1;

    if (pageIdx >= pages.length) continue;

    const page = pages[pageIdx];
    const { height: pageHeight } = page.getSize();

    if (loc.x != null && loc.y != null && loc.width && loc.height) {
      // OCR 좌표는 scale:2.0 이미지 픽셀 단위 → PDF 포인트로 변환
      const isOcr = item.segment.source === "ocr";
      const scale = isOcr ? OCR_SCALE : 1;
      const pdfX = loc.x / scale;
      const pdfW = loc.width / scale;
      const pdfH = loc.height / scale;
      const pdfYTop = loc.y / scale;

      // PDF 좌표계: 좌하단 원점 → y 변환
      const pdfY = pageHeight - pdfYTop - pdfH;

      // 흰색 사각형으로 원본 텍스트 덮기
      page.drawRectangle({
        x: pdfX - 2,
        y: pdfY - 2,
        width: pdfW + 4,
        height: pdfH + 4,
        color: rgb(1, 1, 1),
      });

      // 마스킹 태그 텍스트 삽입
      const fontSize = Math.min(pdfH * 0.7, 12);
      page.drawText(item.maskedText, {
        x: pdfX,
        y: pdfY + 2,
        size: fontSize,
        font: korFont,
        color: rgb(0.8, 0, 0),
      });
    }
  }

  const modifiedBytes = await pdfDoc.save();
  return Buffer.from(modifiedBytes);
}