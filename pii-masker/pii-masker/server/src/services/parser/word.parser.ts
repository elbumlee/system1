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