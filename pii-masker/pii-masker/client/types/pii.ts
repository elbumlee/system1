export type PIIType = "주민등록번호" | "전화번호" | "생년월일" | "주소" | "이름";

export interface DetectedPII {
  id: string;
  type: PIIType;
  originalText: string;
  maskedText: string;
  confidence: number;
  excluded: boolean;
}

export interface UploadResponse {
  jobId: string;
  status: string;
  fileName: string;
  totalDetected: number;
  warnings?: string[];
}

export interface PreviewResponse {
  jobId: string;
  status: string;
  fileName: string;
  items: DetectedPII[];
  warnings?: string[];
}