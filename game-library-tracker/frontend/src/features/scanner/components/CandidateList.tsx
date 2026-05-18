import { CheckSquare, Square } from 'lucide-react';

interface Props {
  candidates: string[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onToggleAll: () => void;
}

export default function CandidateList({ candidates, selected, onToggle, onToggleAll }: Props) {
  return (
    <>
      <div className="ocr-results-header">
        <span className="form-label">추출된 게임 목록 ({candidates.length}개)</span>
        <button className="btn-link" onClick={onToggleAll}>
          {selected.size === candidates.length ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      {candidates.length === 0 ? (
        <p className="ocr-no-results">
          게임 이름을 찾을 수 없었습니다. 더 선명한 이미지를 시도해 주세요.
        </p>
      ) : (
        <ul className="candidate-list">
          {candidates.map((name) => (
            <li
              key={name}
              className={`candidate-item ${selected.has(name) ? 'selected' : ''}`}
              onClick={() => onToggle(name)}
            >
              {selected.has(name) ? (
                <CheckSquare size={16} className="check-icon active" />
              ) : (
                <Square size={16} className="check-icon" />
              )}
              <span>{name}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
