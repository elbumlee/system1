import React, { useState, useCallback, useRef } from "react";

interface Props {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function FileUploader({ onUpload, isLoading }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.docx,.pdf"
          onChange={handleChange}
          className="hidden"
        />
        <div className="text-4xl mb-3">📂</div>
        <p className="text-gray-600 font-medium">
          파일을 여기에 끌어다 놓으세요
        </p>
        <p className="text-sm text-gray-400 mt-1">
          .xlsx, .docx, .pdf (최대 10MB)
        </p>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between bg-white border rounded-lg p-3">
          <span className="text-sm text-gray-700 truncate">
            📄 {selectedFile.name}
            <span className="text-gray-400 ml-2">
              ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
            </span>
          </span>
          <button
            onClick={() => onUpload(selectedFile)}
            disabled={isLoading}
            className={`
              px-5 py-2 rounded-lg text-sm font-medium text-white
              transition-colors
              ${isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            {isLoading ? "분석 중..." : "업로드 & 분석 시작"}
          </button>
        </div>
      )}
    </div>
  );
}