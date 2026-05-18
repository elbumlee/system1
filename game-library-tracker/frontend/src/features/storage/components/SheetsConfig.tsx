interface Props {
  sheetId: string;
  credPath: string;
  onSheetIdChange: (v: string) => void;
  onCredPathChange: (v: string) => void;
}

export default function SheetsConfig({ sheetId, credPath, onSheetIdChange, onCredPathChange }: Props) {
  return (
    <>
      <label className="form-label">
        Google Sheet ID
        <input
          className="form-input"
          value={sheetId}
          onChange={(e) => onSheetIdChange(e.target.value)}
          placeholder="스프레드시트 URL의 /d/ 뒤 ID"
        />
      </label>
      <label className="form-label">
        서비스 계정 JSON 경로
        <input
          className="form-input"
          value={credPath}
          onChange={(e) => onCredPathChange(e.target.value)}
          placeholder="~/credentials.json"
        />
      </label>
      <p className="form-hint">
        Google Cloud Console에서 서비스 계정을 생성하고, 해당 계정에 스프레드시트 편집 권한을 부여하세요.
      </p>
    </>
  );
}
