import { useRef } from 'react';
import { Upload, Camera } from 'lucide-react';

interface Props {
  onFile: (f: File) => void;
  loading: boolean;
}

export default function DropZone({ onFile, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) onFile(f);
  }

  return (
    <div
      className={`drop-zone ${loading ? 'loading' : ''}`}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <div className="drop-icons">
        <Upload size={32} />
        <Camera size={32} />
      </div>
      <p>클릭하여 이미지 선택 또는 드래그</p>
      <p className="drop-sub">스팀 라이브러리, 에픽 스토어, 닌텐도 스위치 화면 등</p>
      {loading && <p className="loading-text">OCR 분석 중...</p>}
    </div>
  );
}
