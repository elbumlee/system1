import { v4 as uuidv4 } from "uuid";
import { ParsedSegment, DetectedPII, PIIType } from "../parser/parser.interface";
import {
  RRN_PATTERNS, RRN_CONTEXT_KEYWORDS,
  PHONE_PATTERNS, PHONE_CONTEXT_KEYWORDS,
  DOB_PATTERNS, DOB_CONTEXT_KEYWORDS,
  ADDRESS_PATTERNS,
  NAME_CONTEXT_KEYWORDS, NAME_CONTEXT_PATTERN,
} from "./patterns";
import { evaluateAsName } from "./surname.dict";

function hasContextKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function findMatches(
  segment: ParsedSegment,
  pattern: RegExp,
  type: PIIType,
  confidence: number,
  requireContext: boolean,
  contextKeywords: string[]
): DetectedPII[] {
  const results: DetectedPII[] = [];
  const text = segment.text;

  if (requireContext && !hasContextKeyword(text, contextKeywords)) {
    return results;
  }

  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const originalText = match[0];
    results.push({
      id: uuidv4(),
      type,
      originalText,
      maskedText: `[${type}]`,
      confidence,
      segment,
      startIndex: match.index,
      endIndex: match.index + originalText.length,
      excluded: false,
    });
  }
  return results;
}

export function detectPII(segments: ParsedSegment[]): DetectedPII[] {
  const results: DetectedPII[] = [];

  for (const segment of segments) {
    const text = segment.text;
    if (!text || text.trim() === "") continue;

    // 1. 주민등록번호
    results.push(...findMatches(segment, RRN_PATTERNS.withHyphen, "주민등록번호", 0.98, false, []));
    results.push(...findMatches(segment, RRN_PATTERNS.partialMasked, "주민등록번호", 0.95, false, []));
    results.push(...findMatches(segment, RRN_PATTERNS.noHyphen, "주민등록번호", 0.85, true, RRN_CONTEXT_KEYWORDS));

    // 2. 전화번호
    results.push(...findMatches(segment, PHONE_PATTERNS.withHyphen, "전화번호", 0.95, false, []));
    results.push(...findMatches(segment, PHONE_PATTERNS.withSpace, "전화번호", 0.90, false, []));
    results.push(...findMatches(segment, PHONE_PATTERNS.withParens, "전화번호", 0.93, false, []));
    results.push(...findMatches(segment, PHONE_PATTERNS.noSeparator, "전화번호", 0.80, true, PHONE_CONTEXT_KEYWORDS));

    // 3. 생년월일
    results.push(...findMatches(segment, DOB_PATTERNS.fourDigitYear, "생년월일", 0.92, false, []));
    results.push(...findMatches(segment, DOB_PATTERNS.twoDigitYear, "생년월일", 0.75, true, DOB_CONTEXT_KEYWORDS));
    results.push(...findMatches(segment, DOB_PATTERNS.eightDigits, "생년월일", 0.80, true, DOB_CONTEXT_KEYWORDS));

    // 4. 주소
    results.push(...findMatches(segment, ADDRESS_PATTERNS.oldStyle, "주소", 0.90, false, []));
    results.push(...findMatches(segment, ADDRESS_PATTERNS.roadStyle, "주소", 0.90, false, []));
    // zipCode는 주소 패턴과 함께 매칭된 경우에만 독립으로 검사하지 않음 (false positive 방지)

    // 5. 이름 — 키워드 컨텍스트 패턴 (높은 신뢰도)
    {
      const namePattern = NAME_CONTEXT_PATTERN;
      namePattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = namePattern.exec(text)) !== null) {
        const nameCandidate = match[1];
        const { isName, confidence } = evaluateAsName(nameCandidate);
        if (isName) {
          const startIndex = match.index + match[0].length - match[1].length;
          const endIndex = startIndex + match[1].length;
          results.push({
            id: uuidv4(),
            type: "이름",
            originalText: nameCandidate,
            maskedText: "[이름]",
            confidence,
            segment,
            startIndex,
            endIndex,
            excluded: false,
          });
        }
      }
    }

    // 5-b. 이름 — 문맥 키워드 있을 때 한글 2~4자 전체 스캔
    if (hasContextKeyword(text, NAME_CONTEXT_KEYWORDS)) {
      const koreanWordPattern = /[가-힣]{2,4}/g;
      koreanWordPattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = koreanWordPattern.exec(text)) !== null) {
        const candidate = match[0];
        const { isName, confidence } = evaluateAsName(candidate);
        if (isName && confidence >= 0.65) {
          const alreadyAdded = results.some(
            (r) =>
              r.type === "이름" &&
              r.segment === segment &&
              r.startIndex <= match!.index &&
              r.endIndex >= match!.index + candidate.length
          );
          if (!alreadyAdded) {
            results.push({
              id: uuidv4(),
              type: "이름",
              originalText: candidate,
              maskedText: "[이름]",
              confidence,
              segment,
              startIndex: match.index,
              endIndex: match.index + candidate.length,
              excluded: false,
            });
          }
        }
      }
    }
  }

  // 동일 세그먼트 내 같은 위치·타입 중복 제거
  const deduplicated: DetectedPII[] = [];
  const seen = new Set<string>();
  for (const item of results) {
    const loc = item.segment.location;
    const key = `${loc.page ?? ""}_${loc.row ?? ""}_${loc.paragraph ?? ""}_${item.startIndex}_${item.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(item);
    }
  }

  return deduplicated;
}
