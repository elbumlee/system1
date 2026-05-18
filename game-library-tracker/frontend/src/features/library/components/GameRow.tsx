import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import type { Game, Platform } from '../../../types';
import PlatformToggle from '../../platform/components/PlatformToggle';
import { GENRES } from '../../game-form/constants';

interface Props {
  game: Game;
  onToggle: (id: string, platform: Platform, current: boolean) => void;
  onEdit: (id: string, payload: Partial<Game>) => void;
  onDelete: (id: string) => void;
  onFavoriteToggle: (id: string, current: boolean) => void;
}

export default function GameRow({ game, onToggle, onEdit, onDelete, onFavoriteToggle }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(game.name);
  const [editNotes, setEditNotes] = useState(game.notes);
  const [editGenre, setEditGenre] = useState(game.genre ?? '');

  function saveEdit() {
    if (editName.trim()) {
      onEdit(game.id, {
        name: editName.trim(),
        notes: editNotes.trim(),
        genre: editGenre,
      });
    }
    setEditing(false);
  }

  function cancelEdit() {
    setEditName(game.name);
    setEditNotes(game.notes);
    setEditGenre(game.genre ?? '');
    setEditing(false);
  }

  return (
    <tr className="game-row">
      {/* Favorite star */}
      <td className="fav-cell">
        <button
          className={`fav-btn ${game.favorite ? 'active' : 'inactive'}`}
          onClick={() => onFavoriteToggle(game.id, game.favorite)}
          title={game.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          {game.favorite ? '★' : '☆'}
        </button>
      </td>

      {/* Game name */}
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

      {/* Platform toggles */}
      {(['steam', 'epic', 'switch'] as Platform[]).map((p) => (
        <td key={p} className="platform-cell">
          <PlatformToggle
            platform={p}
            active={game[p]}
            onClick={() => onToggle(game.id, p, game[p])}
          />
        </td>
      ))}

      {/* Date */}
      <td className="date-cell">{game.added_date}</td>

      {/* Genre */}
      <td className="genre-cell">
        {editing ? (
          <select
            className="edit-input"
            value={editGenre}
            onChange={(e) => setEditGenre(e.target.value)}
            style={{ minWidth: 80 }}
          >
            <option value="">-</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        ) : game.genre ? (
          <span className="genre-badge">{game.genre}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>-</span>
        )}
      </td>

      {/* Notes */}
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

      {/* Actions */}
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
