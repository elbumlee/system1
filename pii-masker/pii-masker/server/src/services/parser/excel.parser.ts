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

        // 첫 번째 행을 헤더로 취급
        if (rowNumber === 1) {
          headers[colNumber] = text;
          return;
        }

        segments.push({
          source: "excel",
          location: {
            sheet: sheet.name,
            row: rowNumber,
            col: colNumber,
            header: headers[colNumber] || undefined,
          },
          text,
        });
      });
    });
  });

  return segments;
}