#!/bin/bash
# ============================================
# PII Masker — 클라이언트 파일 자동 생성
# 실행법: bash setup-client.sh
# ※ 먼저 npm create vite@latest client -- --template react-ts 실행 후 사용
# ============================================

echo "📦 클라이언트 파일 생성 시작..."

mkdir -p client/src/{types,services,components,pages}

# ---- 1. .env ----
cat > client/.env << 'ENDOFFILE'
VITE_API_URL=http://localhost:3001
ENDOFFILE
echo "  ✅ .env"

# ---- 2. vite.config.ts ----
cat > client/vite.config.ts << 'ENDOFFILE'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
ENDOFFILE
echo "  ✅ vite.config.ts"

# ---- 3. index.css ----
cat > client/src/index.css << 'ENDOFFILE'
@import "tailwindcss";
ENDOFFILE
echo "  ✅ index.css"

# ---- 4. App.tsx ----
cat > client/src/App.tsx << 'ENDOFFILE'
import Home from "./pages/Home";
function App() { return <Home />; }
export default App;
ENDOFFILE
echo "  ✅ App.tsx"

# ---- 5. types/pii.ts ----
cat > client/src/types/pii.ts << 'ENDOFFILE'
export type PIIType = "주민등록번호" | "전화번호" | "생년월일" | "주소" | "이름";

export interface DetectedPII {
  id: string; type: PIIType; originalText: string; maskedText: string;
  confidence: number; excluded: boolean;
}

export interface UploadResponse {
  jobId: string; status: string; fileName: string;
  totalDetected: number; warnings?: string[];
}

export interface PreviewResponse {
  jobId: string; status: string; fileName: string;
  items: DetectedPII[]; warnings?: string[];
}
ENDOFFILE
echo "  ✅ types/pii.ts"

# ---- 6. services/api.ts ----
cat > client/src/services/api.ts << 'ENDOFFILE'
import type { UploadResponse, PreviewResponse } from "../types/pii";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData(); form.append("file", file);
  const res = await fetch(BASE + "/api/upload", { method: "POST", body: form });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "업로드 실패"); }
  return res.json();
}

export async function getPreview(jobId: string): Promise<PreviewResponse> {
  const res = await fetch(BASE + "/api/upload/preview/" + jobId);
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "미리보기 실패"); }
  return res.json();
}

export async function updateItems(jobId: string, updates: { id: string; excluded: boolean }[]): Promise<void> {
  await fetch(BASE + "/api/upload/preview/" + jobId, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates }) });
}

export async function downloadPdf(jobId: string, fileName: string): Promise<void> {
  const res = await fetch(BASE + "/api/upload/download/" + jobId, { method: "POST" });
  if (!res.ok) throw new Error("다운로드 실패");
  const blob = await res.blob(); const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = "masked_" + fileName.replace(/\.[^.]+$/, "") + ".pdf";
  a.click(); URL.revokeObjectURL(url);
}
ENDOFFILE
echo "  ✅ services/api.ts"

# ---- 7. components/FileUploader.tsx ----
cat > client/src/components/FileUploader.tsx << 'ENDOFFILE'
import { useState, useCallback, useRef } from "react";

interface Props { onUpload: (file: File) => void; isLoading: boolean; }

export function FileUploader({ onUpload, isLoading }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(e.type === "dragenter" || e.type === "dragover"); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) setSelectedFile(f); }, []);

  return (
    <div className="space-y-4">
      <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={"border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors " + (isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400")}>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.docx,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} className="hidden" />
        <div className="text-4xl mb-3">📂</div>
        <p className="text-gray-600 font-medium">파일을 여기에 끌어다 놓으세요</p>
        <p className="text-sm text-gray-400 mt-1">.xlsx, .docx, .pdf (최대 10MB)</p>
      </div>
      {selectedFile && (
        <div className="flex items-center justify-between bg-white border rounded-lg p-3">
          <span className="text-sm text-gray-700 truncate">📄 {selectedFile.name} <span className="text-gray-400 ml-2">({(selectedFile.size/1024/1024).toFixed(1)}MB)</span></span>
          <button onClick={() => onUpload(selectedFile)} disabled={isLoading}
            className={"px-5 py-2 rounded-lg text-sm font-medium text-white " + (isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700")}>
            {isLoading ? "분석 중..." : "업로드 & 분석 시작"}</button>
        </div>
      )}
    </div>
  );
}
ENDOFFILE
echo "  ✅ components/FileUploader.tsx"

# ---- 8. components/ErrorBanner.tsx ----
cat > client/src/components/ErrorBanner.tsx << 'ENDOFFILE'
interface Props { messages: string[]; type: "error" | "warning"; }
export function ErrorBanner({ messages, type }: Props) {
  if (!messages.length) return null;
  const s = { error: "bg-red-50 border-red-200 text-red-800", warning: "bg-yellow-50 border-yellow-200 text-yellow-800" };
  const icon = type === "error" ? "❌" : "⚠️";
  return <div className={"border rounded-lg p-3 " + s[type]}>{messages.map((m,i) => <p key={i} className="text-sm">{icon} {m}</p>)}</div>;
}
ENDOFFILE
echo "  ✅ components/ErrorBanner.tsx"

# ---- 9. components/PreviewTable.tsx ----
cat > client/src/components/PreviewTable.tsx << 'ENDOFFILE'
import type { DetectedPII } from "../types/pii";
interface Props { items: DetectedPII[]; onToggleExclude: (id: string, excluded: boolean) => void; }

function confBadge(c: number) {
  if (c >= 0.85) return { color: "bg-green-100 text-green-800", label: c.toFixed(2) };
  if (c >= 0.6) return { color: "bg-yellow-100 text-yellow-800", label: c.toFixed(2) };
  return { color: "bg-red-100 text-red-800", label: "⚠️ " + c.toFixed(2) };
}
function typeBg(t: string) {
  const m: Record<string,string> = { 주민등록번호:"bg-red-100 text-red-700", 전화번호:"bg-blue-100 text-blue-700", 생년월일:"bg-purple-100 text-purple-700", 주소:"bg-green-100 text-green-700", 이름:"bg-orange-100 text-orange-700" };
  return m[t] || "bg-gray-100 text-gray-700";
}

export function PreviewTable({ items, onToggleExclude }: Props) {
  if (!items.length) return <div className="text-center py-8 text-gray-500">탐지된 개인정보가 없습니다.</div>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">ℹ️ 이름은 키워드/성씨 사전 기반 탐지. 누락 항목은 수동 추가하세요.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-gray-50"><th className="text-left p-3 font-medium">유형</th><th className="text-left p-3 font-medium">원본</th><th className="text-left p-3 font-medium">마스킹</th><th className="text-center p-3 font-medium">신뢰도</th><th className="text-center p-3 font-medium">제외</th></tr></thead>
          <tbody>{items.map(it => { const b = confBadge(it.confidence); return (
            <tr key={it.id} className={"border-b hover:bg-gray-50 " + (it.excluded ? "opacity-40 line-through " : "") + (it.confidence < 0.6 ? "bg-yellow-50" : "")}>
              <td className="p-3"><span className={"px-2 py-1 rounded-full text-xs font-medium " + typeBg(it.type)}>{it.type}</span></td>
              <td className="p-3 font-mono text-xs max-w-[200px] truncate">{it.originalText}</td>
              <td className="p-3 text-red-600 font-medium text-xs">{it.maskedText}</td>
              <td className="p-3 text-center"><span className={"px-2 py-0.5 rounded text-xs " + b.color}>{b.label}</span></td>
              <td className="p-3 text-center"><input type="checkbox" checked={it.excluded} onChange={e => onToggleExclude(it.id, e.target.checked)} className="w-4 h-4 rounded" /></td>
            </tr>); })}</tbody>
        </table>
      </div>
      <div className="text-right text-xs text-gray-400">총 {items.filter(i => !i.excluded).length}건 적용 / {items.filter(i => i.excluded).length}건 제외</div>
    </div>
  );
}
ENDOFFILE
echo "  ✅ components/PreviewTable.tsx"

# ---- 10. pages/Home.tsx ----
cat > client/src/pages/Home.tsx << 'ENDOFFILE'
import { useState } from "react";
import { FileUploader } from "../components/FileUploader";
import { ErrorBanner } from "../components/ErrorBanner";
import { PreviewTable } from "../components/PreviewTable";
import { uploadFile, getPreview, updateItems, downloadPdf } from "../services/api";
import type { DetectedPII } from "../types/pii";

type Step = "upload" | "preview" | "done";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warns, setWarns] = useState<string[]>([]);
  const [jobId, setJobId] = useState("");
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<DetectedPII[]>([]);

  const handleUpload = async (file: File) => {
    setLoading(true); setError(""); setWarns([]);
    try {
      const r = await uploadFile(file); setJobId(r.jobId); setFileName(r.fileName);
      if (r.warnings) setWarns(r.warnings);
      const p = await getPreview(r.jobId); setItems(p.items); setStep("preview");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  const toggleExclude = async (id: string, ex: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, excluded: ex } : i));
    await updateItems(jobId, [{ id, excluded: ex }]);
  };
  const handleDL = async () => {
    setLoading(true);
    try { await downloadPdf(jobId, fileName); setStep("done"); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  const reset = () => { setStep("upload"); setJobId(""); setFileName(""); setItems([]); setWarns([]); setError(""); };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🔒 PII Masker</h1>
          <p className="text-gray-500 mt-2">문서에서 개인정보를 탐지하고 마스킹하여 PDF로 변환합니다</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
          {error && <ErrorBanner messages={[error]} type="error" />}
          {warns.length > 0 && <ErrorBanner messages={warns} type="warning" />}

          {step === "upload" && <FileUploader onUpload={handleUpload} isLoading={loading} />}

          {step === "preview" && (<>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-700">📋 탐지 결과 — {fileName}</h2>
              <span className="text-sm text-gray-400">{items.length}건</span>
            </div>
            <PreviewTable items={items} onToggleExclude={toggleExclude} />
            <div className="flex justify-between pt-4 border-t">
              <button onClick={reset} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">← 다른 파일</button>
              <button onClick={handleDL} disabled={loading}
                className={"px-6 py-2.5 rounded-lg text-sm font-medium text-white " + (loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700")}>
                {loading ? "생성 중..." : "📥 PDF 다운로드"}</button>
            </div></>)}

          {step === "done" && (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-xl font-semibold text-gray-700">마스킹 완료!</h2>
              <p className="text-gray-500">PDF가 다운로드되었습니다.</p>
              <button onClick={reset} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">새 파일 처리</button>
            </div>)}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">파일은 서버에 저장되지 않으며 처리 즉시 삭제됩니다.</p>
      </div>
    </div>
  );
}
ENDOFFILE
echo "  ✅ pages/Home.tsx"

echo ""
echo "🎉 클라이언트 파일 전체 (10/10) 생성 완료!"
echo ""
echo "============================================"
echo "  📋 전체 세팅 완료! 다음 단계:"
echo "============================================"
echo ""
echo "  1. cd server && npm install"
echo "  2. fonts/ 폴더에 NotoSansKR 폰트 저장"
echo "  3. npm run dev              ← 서버 실행"
echo "  4. (새 터미널) cd client && npm install"
echo "  5. npm install --save-dev tailwindcss @tailwindcss/vite"
echo "  6. npm run dev              ← 클라이언트 실행"
echo "  7. http://localhost:5173 접속"
echo ""