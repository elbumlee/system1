import pdfParse from "pdf-parse";
import { ParsedSegment } from "./parser.interface";

export interface PdfParseResult {
  segments: ParsedSegment[];
  isImagePdf: boolean;
  pageCount: number;
}

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  let data: Awaited<ReturnType<typeof pdfParse>>;

  try {
    data = await pdfParse(buffer);
  } catch (err: any) {
    // 암호화된 PDF 감지
    if (err.message?.includes("encrypted") || err.message?.includes("password")) {
      throw new Error("ENCRYPTED_PDF");
    }
    throw err;
  }

  const totalText = data.text?.trim() || "";
  const pageCount = data.numpages || 1;

  // 이미지 PDF 감지: 텍스트가 거의 없으면
  if (totalText.length < 10) {
    return { segments: [], isImagePdf: true, pageCount };
  }

  // 페이지 구분자(\f = form feed)로 분리
  const pages = totalText.split("\f");
  const segments: ParsedSegment[] = [];

  pages.forEach((pageText, pageIdx) => {
    const lines = pageText.split("\n").filter((l) => l.trim().length > 0);
    lines.forEach((line, lineIdx) => {
      segments.push({
        source: "pdf",
        location: {
          page: pageIdx + 1,
          line: lineIdx + 1,
        },
        text: line.trim(),
      });
    });
  });

  return { segments, isImagePdf: false, pageCount };
}