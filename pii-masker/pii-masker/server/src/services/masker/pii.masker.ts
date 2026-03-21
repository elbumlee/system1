import { ParsedSegment, DetectedPII } from "../parser/parser.interface";

export function applyMasking(
  segments: ParsedSegment[],
  detectedItems: DetectedPII[]
): ParsedSegment[] {
  const segmentMap = new Map<number, DetectedPII[]>();

  detectedItems.forEach((item) => {
    if (item.excluded) return;

    // segment 객체를 segments 배열에서 찾기 (참조 비교)
    let segIdx = segments.indexOf(item.segment);

    // 참조 비교 실패 시 text+location 기반 폴백
    if (segIdx === -1) {
      segIdx = segments.findIndex(
        (s) =>
          s.text === item.segment.text &&
          s.location.page === item.segment.location.page &&
          s.location.row === item.segment.location.row
      );
    }

    if (segIdx === -1) return;

    if (!segmentMap.has(segIdx)) segmentMap.set(segIdx, []);
    segmentMap.get(segIdx)!.push(item);
  });

  return segments.map((seg, idx) => {
    const items = segmentMap.get(idx);
    if (!items || items.length === 0) {
      return { ...seg };
    }

    // 뒤에서부터 치환 (인덱스 밀림 방지)
    const sorted = [...items].sort((a, b) => b.startIndex - a.startIndex);
    let maskedText = seg.text;

    for (const item of sorted) {
      maskedText =
        maskedText.substring(0, item.startIndex) +
        item.maskedText +
        maskedText.substring(item.endIndex);
    }

    return { ...seg, text: maskedText };
  });
}