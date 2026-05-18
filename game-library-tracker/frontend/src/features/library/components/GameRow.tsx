import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import type { Game, Platform } from '../../../types';
import PlatformToggle from '../../platform/components/PlatformToggle';

interface Props {
  game: Game;
  onToggle: (id: string, platform: Platform, current: boolean) => void;
  onEdit: (id: string, payload: Partial<Game>) => void;
  onDelete: (id: string) => void;
}

export default function GameRow({ game, onToggle, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(game.name);
  const [editNotes, setEditNotes] = useState(game.notes);

  function saveEdit() {
    if (editName.trim()) {
      onEdit(game.id, { name: editName.trim(), notes: editNotes.trim() });
    }
    setEditing(false);
  }

  function cancelEdit() {
    setEditName(game.name);
    setEditNotes(game.notes);
    setEditing(false);
  }

  return (
    <tr className="game-row">
      <td className="game-name-cell">
        {editing ? (
          <input
            className="edit-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            autoFocus
          />
        ) : (
          <span className="game-name">{game.name}</span>
        )}
      </td>

      {(['steam', 'epic', 'switch'] as Platform[]).map((p) => (
        <td key={p} className="platform-cell">
          <PlatformToggle
            platform={p}
            active={game[p]}
            onClick={() => onToggle(game.id, p, game[p])}
          />
        </td>
      ))}

      <td className="date-cell">{game.added_date}</td>

      <td className="notes-cell">
        {editing ? (
          <input
            className="edit-input"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="메모"
          />
        ) : (
          <span className="notes-text">{game.notes}</span>
        )}
      </td>

      <td className="actions-cell">
        {editing ? (
          <div className="action-btns">
            <button className="icon-btn confirm-btn" onClick={saveEdit} title="저장">
              <Check size={15} />
            </button>
            <button className="icon-btn cancel-btn" onClick={cancelEdit} title="취소">
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="action-btns">
            <button className="icon-btn edit-btn" onClick={() => setEditing(true)} title="편집">
              <Edit2 size={15} />
            </button>
            <button className="icon-btn delete-btn" onClick={() => onDelete(game.id)} title="삭제">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
