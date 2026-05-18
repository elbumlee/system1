interface Props {
  value: 'excel' | 'sheets';
  onChange: (v: 'excel' | 'sheets') => void;
}

export default function StorageTypeSelector({ value, onChange }: Props) {
  return (
    <>
      <div className="form-label">저장 방식</div>
      <div className="storage-radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="storage"
            value="excel"
            checked={value === 'excel'}
            onChange={() => onChange('excel')}
          />
          <span>Excel 파일 (.xlsx)</span>
          <span className="radio-desc">로컬에 파일로 저장</span>
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="storage"
            value="sheets"
            checked={value === 'sheets'}
            onChange={() => onChange('sheets')}
          />
          <span>Google Sheets</span>
          <span className="radio-desc">구글 드라이브에 저장</span>
        </label>
      </div>
    </>
  );
}
