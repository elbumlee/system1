import { useState } from "react";
import { FileUploader } from "../components/FileUploader";
import { ErrorBanner } from "../components/ErrorBanner";
import { PreviewTable } from "../components/PreviewTable";
import {
  uploadFile, getPreview, updateItems, downloadPdf,
} from "../services/api";
import type { DetectedPII } from "../types/pii";

type Step = "upload" | "preview" | "done";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [jobId, setJobId] = useState("");
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<DetectedPII[]>([]);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setError("");
    setWarnings([]);

    try {
      const result = await uploadFile(file);
      setJobId(result.jobId);
      setFileName(result.fileName);
      if (result.warnings) setWarnings(result.warnings);

      // 미리보기 데이터 로드
      const preview = await getPreview(result.jobId);
      setItems(preview.items);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExclude = async (id: string, excluded: boolean) => {
    // 낙관적 업데이트
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, excluded } : item))
    );
    try {
      await updateItems(jobId, [{ id, excluded }]);
    } catch (err) {
      // 서버 동기화 실패 시 UI 롤백
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, excluded: !excluded } : item))
      );
      setError(err instanceof Error ? err.message : "항목 업데이트에 실패했습니다.");
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      await downloadPdf(jobId, fileName);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setJobId("");
    setFileName("");
    setItems([]);
    setWarnings([]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-10 px-4">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🔒 PII Masker</h1>
          <p className="text-gray-500 mt-2">
            문서에서 개인정보를 탐지하고 마스킹하여 PDF로 변환합니다
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">

          {/* 에러/경고 */}
          {error && <ErrorBanner messages={[error]} type="error" />}
          {warnings.length > 0 && <ErrorBanner messages={warnings} type="warning" />}

          {/* Step 1: 업로드 */}
          {step === "upload" && (
            <FileUploader onUpload={handleUpload} isLoading={isLoading} />
          )}

          {/* Step 2: 미리보기 */}
          {step === "preview" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-700">
                  📋 탐지 결과 — {fileName}
                </h2>
                <span className="text-sm text-gray-400">
                  {items.length}건 탐지
                </span>
              </div>

              <PreviewTable
                items={items}
                onToggleExclude={handleToggleExclude}
              />

              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  ← 다른 파일 업로드
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className={`
                    px-6 py-2.5 rounded-lg text-sm font-medium text-white
                    ${isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                    }
                  `}
                >
                  {isLoading ? "PDF 생성 중..." : "📥 PDF 다운로드"}
                </button>
              </div>
            </>
          )}

          {/* Step 3: 완료 */}
          {step === "done" && (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-xl font-semibold text-gray-700">
                마스킹 완료!
              </h2>
              <p className="text-gray-500">
                PDF 파일이 다운로드되었습니다.
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                새 파일 처리하기
              </button>
            </div>
          )}

        </div>

        {/* 푸터 */}
        <p className="text-center text-xs text-gray-400 mt-6">
          업로드된 파일은 서버에 저장되지 않으며, 처리 즉시 삭제됩니다.
        </p>
      </div>
    </div>
  );
}