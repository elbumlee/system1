interface Props {
  src: string;
  onReset: () => void;
}

export default function ImagePreview({ src, onReset }: Props) {
  return (
    <div className="ocr-preview-row">
      <img src={src} alt="업로드" className="preview-thumb" />
      <button className="btn btn-secondary btn-sm" onClick={onReset}>
        다시 업로드
      </button>
    </div>
  );
}
