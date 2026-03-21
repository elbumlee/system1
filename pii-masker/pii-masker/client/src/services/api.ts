import type { UploadResponse, PreviewResponse } from "../types/pii";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "업로드 실패");
  }
  return res.json();
}

export async function getPreview(jobId: string): Promise<PreviewResponse> {
  const res = await fetch(`${BASE_URL}/api/upload/preview/${jobId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "미리보기 실패");
  }
  return res.json();
}

export async function updateItems(
  jobId: string,
  updates: { id: string; excluded: boolean }[]
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/upload/preview/${jobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "항목 업데이트 실패");
  }
}

export async function downloadPdf(jobId: string, fileName: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/upload/download/${jobId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("다운로드 실패");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `masked_${fileName.replace(/\.[^.]+$/, "")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}