import { ArrowUpDown } from 'lucide-react';
import type { Game, Platform, SortConfig } from '../types';
import GameRow from './GameRow';

interface Props {
  games: Game[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSort: (field: SortConfig['field']) => void;
  onToggle: (id: string, platform: Platform, current: boolean) => void;
  onEdit: (id: string, payload: Partial<Game>) => void;
  onDelete: (id: string) => void;
}

export default function GameTable({ games, isLoading, sortConfig, onSort, onToggle, onEdit, onDelete }: Props) {
  function SortIcon({ field }: { field: SortConfig['field'] }) {
    if (sortConfig.field !== field) return <ArrowUpDown size={13} className="sort-icon inactive" />;
    return <span className="sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  }

  if (isLoading) {
    return <div className="table-empty">불러오는 중...</div>;
  }

  if (games.length === 0) {
    return (
      <div className="table-empty">
        <p>게임이 없습니다.</p>
        <p className="table-empty-sub">+ 버튼으로 추가하거나 스크린샷을 업로드하세요.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="game-table">
        <thead>
          <tr>
            <th className="th-name" onClick={() => onSort('name')}>
              게임명 <SortIcon field="name" />
            </th>
            <th className="th-platform steam-header">Steam</th>
            <th className="th-platform epic-header">Epic</th>
            <th className="th-platform switch-header">Switch</th>
            <th className="th-date" onClick={() => onSort('added_date')}>
              추가일 <SortIcon field="added_date" />
            </th>
            <th className="th-notes">메모</th>
            <th className="th-actions"></th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <GameRow
              key={game.id}
              game={game}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
      <div className="table-footer">총 {games.length}개 게임</div>
    </div>
  );
}
