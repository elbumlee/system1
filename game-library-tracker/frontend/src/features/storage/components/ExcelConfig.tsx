interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function ExcelConfig({ value, onChange }: Props) {
  return (
    <label className="form-label">
      파일 경로
      <input
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="~/game_library.xlsx"
      />
    </label>
  );
}
