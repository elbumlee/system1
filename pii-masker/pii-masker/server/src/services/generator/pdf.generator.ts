import PDFDocument from "pdfkit";
import * as path from "path";
import * as fs from "fs";
import { ParsedSegment } from "../parser/parser.interface";

// server/src/services/generator/ → server/fonts/
const FONT_PATH = path.resolve(
  __dirname, "..", "..", "..", "fonts", "NotoSansKR-Regular.subset.ttf"
);

export async function generateNewPdf(
  maskedSegments: ParsedSegment[],
  sourceType: "excel" | "word"
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // 폰트 파일 존재 확인
    if (!fs.existsSync(FONT_PATH)) {
      return reject(new Error(
        `한글 폰트를 찾을 수 없습니다: ${FONT_PATH}\n` +
        `fonts/ 폴더에 NotoSansKR-Regular.subset.ttf 파일을 넣어주세요.`
      ));
    }

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // 한글 폰트 등록
    doc.registerFont("NotoSansKR", FONT_PATH);
    doc.font("NotoSansKR");

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // 제목
    doc.fontSize(16).text("개인정보 마스킹 처리 결과", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(8).fillColor("#888888")
      .text(`처리 일시: ${new Date().toLocaleString("ko-KR")}`, { align: "right" });
    doc.moveDown(1);
    doc.fillColor("#000000");

    if (sourceType === "excel") {
      renderExcelTable(doc, maskedSegments);
    } else {
      renderWordParagraphs(doc, maskedSegments);
    }

    doc.end();
  });
}

function renderExcelTable(doc: PDFKit.PDFDocument, segments: ParsedSegment[]) {
  const sheets = new Map<string, ParsedSegment[]>();
  for (const seg of segments) {
    const sheet = seg.location.sheet || "Sheet1";
    if (!sheets.has(sheet)) sheets.set(sheet, []);
    sheets.get(sheet)!.push(seg);
  }

  for (const [sheetName, segs] of sheets) {
    doc.fontSize(12).fillColor("#333333").text(`시트: ${sheetName}`, { underline: true });
    doc.moveDown(0.5);

    const rows = new Map<number, Map<number, string>>();
    for (const seg of segs) {
      const r = seg.location.row || 0;
      const c = seg.location.col || 0;
      if (!rows.has(r)) rows.set(r, new Map());
      rows.get(r)!.set(c, seg.text);
    }

    const sortedRows = Array.from(rows.entries()).sort(([a], [b]) => a - b);
    for (const [_, cols] of sortedRows) {
      const sortedCols = Array.from(cols.entries()).sort(([a], [b]) => a - b);
      const rowText = sortedCols.map(([__, val]) => val).join("  |  ");

      doc.fontSize(9).fillColor("#000000").text(rowText, {
        width: 500,
        lineGap: 3,
      });
    }

    doc.moveDown(1);
  }
}

function renderWordParagraphs(doc: PDFKit.PDFDocument, segments: ParsedSegment[]) {
  for (const seg of segments) {
    const parts = seg.text.split(/(\[[^\]]+\])/g);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const isLast = i === parts.length - 1;

      if (/^\[.+\]$/.test(part)) {
        doc.fontSize(10).fillColor("#CC0000").text(part, {
          continued: !isLast,
        });
      } else {
        doc.fontSize(10).fillColor("#000000").text(part, {
          continued: !isLast,
        });
      }
    }

    doc.moveDown(0.3);
  }
}