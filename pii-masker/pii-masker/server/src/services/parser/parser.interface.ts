// ============================================
// ParsedSegment: 모든 파서의 통합 출력 인터페이스
// ============================================

export type SourceType = "excel" | "word" | "pdf" | "ocr";

export interface SegmentLocation {
  // Excel
  sheet?: string;
  row?: number;
  col?: number;
  header?: string;
  // Word
  paragraph?: number;
  // PDF / OCR
  page?: number;
  line?: number;
  // PDF 좌표 (오버레이 마스킹용)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ParsedSegment {
  source: SourceType;
  location: SegmentLocation;
  text: string;
  confidence?: number; // OCR 신뢰도 (0~1)
}

// ============================================
// PII 탐지 결과 인터페이스
// ============================================

export type PIIType =
  | "주민등록번호"
  | "전화번호"
  | "생년월일"
  | "주소"
  | "이름";

export interface DetectedPII {
  id: string;
  type: PIIType;
  originalText: string;
  maskedText: string;       // "[주민등록번호]" 등
  confidence: number;       // 탐지 신뢰도 (0~1)
  segment: ParsedSegment;   // 원본 세그먼트 참조
  startIndex: number;       // 세그먼트 내 시작 위치
  endIndex: number;         // 세그먼트 내 끝 위치
  excluded: boolean;        // 사용자가 제외 처리했는지
}

// ============================================
// Job 상태 관리 인터페이스
// ============================================

export type JobStatus =
  | "parsing"
  | "detecting"
  | "ready"      // 미리보기 가능
  | "generating" // PDF 생성 중
  | "done"
  | "error";

export interface JobData {
  id: string;
  status: JobStatus;
  fileName: string;
  fileType: "xlsx" | "docx" | "pdf";
  sourceType: SourceType;           // "pdf" | "ocr" 구분 포함
  segments: ParsedSegment[];
  detectedPII: DetectedPII[];
  originalPdfBuffer?: Buffer;       // PDF 오버레이용 원본 (PDF일 때만)
  createdAt: number;
  error?: string;
  ocrProgress?: { current: number; total: number };
}

// ============================================
// API 응답 인터페이스
// ============================================

export interface UploadResponse {
  jobId: string;
  status: JobStatus;
  fileName: string;
  totalDetected: number;
  warnings?: string[];
  ocrProgress?: { current: number; total: number };
}

export interface PreviewResponse {
  jobId: string;
  status: JobStatus;
  fileName: string;
  items: DetectedPII[];
  warnings?: string[];
}

export interface PatchItem {
  id: string;
  excluded?: boolean;
}

export interface ManualAddItem {
  type: PIIType;
  originalText: string;
  segmentIndex: number;
  startIndex: number;
  endIndex: number;
}