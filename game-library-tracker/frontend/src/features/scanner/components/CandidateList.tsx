import { useState, useRef } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { OCRCandidate } from '../../../types';

interface Props {
  candidates: OCRCandidate[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onToggleAll: () => void;
  onRename: (oldName: string, newName: string) => void;
}

interface EditingState {
  name: string;
  value: string;
}

export default function CandidateList({
  candidates,
  selected,
  onToggle,
  onToggleAll,
  onRename,
}: Props) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(name: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing({ name, value: name });
    // Focus input on next tick after render
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEdit() {
    if (editing) {
      onRename(editing.name, editing.value);
      setEditing(null);
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditing(null);
    }
  }

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
          {candidates.map((candidate) => {
            const { name, confidence } = candidate;
            const isLow = confidence < 80;
            const isSelected = selected.has(name);
            const isEditingThis = editing?.name === name;

            return (
              <li
                key={name}
                className={`candidate-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (!isEditingThis) onToggle(name);
                }}
              >
                {isSelected ? (
                  <CheckSquare size={16} className="check-icon active" />
                ) : (
                  <Square size={16} className="check-icon" />
                )}

                {isEditingThis ? (
                  <input
                    ref={inputRef}
                    className="candidate-name-edit"
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onBlur={commitEdit}
                    onKeyDown={handleEditKeyDown}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={isLow ? 'low-confidence' : ''}
                    onDoubleClick={(e) => startEdit(name, e)}
                    title="더블클릭하여 이름 편집"
                  >
                    {name}
                  </span>
                )}

                <span className={`conf-badge ${isLow ? 'conf-low' : 'conf-ok'}`}>
                  {confidence}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
