import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ScanLine, Download, Settings, RefreshCw } from 'lucide-react';
import { useGameList } from '../features/library/hooks/useGameList';
import { useGameMutate } from '../features/library/hooks/useGameMutate';
import GameTable from '../features/library/components/GameTable';
import AddGameModal from '../features/game-form/components/AddGameModal';
import PlatformFilterBar from '../features/platform/components/PlatformFilterBar';
import SearchInput from '../shared/components/SearchInput';
import ErrorBanner from '../shared/components/ErrorBanner';
import { useGameStore } from '../store/gameStore';
import type { Platform, SortConfig } from '../types';

export default function LibraryPage() {
  const { filteredGames, isLoading, error, refresh } = useGameList();
  const { editGame, removeGame, togglePlatform } = useGameMutate();

  const searchQuery = useGameStore((s) => s.searchQuery);
  const setSearchQuery = useGameStore((s) => s.setSearchQuery);
  const platformFilter = useGameStore((s) => s.platformFilter);
  const setPlatformFilter = useGameStore((s) => s.setPlatformFilter);
  const sortConfig = useGameStore((s) => s.sortConfig);
  const setSortConfig = useGameStore((s) => s.setSortConfig);

  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function toggleSort(field: SortConfig['field']) {
    setSortConfig({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleEdit(id: string, payload: Parameters<typeof editGame>[1]) {
    await editGame(id, payload);
  }

  async function handleDelete(id: string) {
    if (confirm('이 게임을 삭제하시겠습니까?')) {
      await removeGame(id);
    }
  }

  async function handleToggle(id: string, platform: Platform, current: boolean) {
    await togglePlatform(id, platform, current);
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">🎮 게임 라이브러리</h1>
        </div>
        <div className="header-right">
          <button
            className={`icon-btn header-btn ${refreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            title="새로고침"
          >
            <RefreshCw size={18} />
          </button>
          <button
            className="icon-btn header-btn"
            onClick={() => window.open('/api/export/excel', '_blank')}
            title="Excel 내보내기"
          >
            <Download size={18} />
          </button>
          <button
            className="icon-btn header-btn"
            onClick={() => navigate('/settings')}
            title="저장소 설정"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="controls">
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        <PlatformFilterBar value={platformFilter} onChange={setPlatformFilter} />
      </div>

      {/* Error */}
      {error && (
        <ErrorBanner message="백엔드 서버에 연결할 수 없습니다. python main.py를 실행했는지 확인하세요." />
      )}

      {/* Table */}
      <main className="app-main">
        <GameTable
          games={filteredGames}
          isLoading={isLoading}
          sortConfig={sortConfig}
          onSort={toggleSort}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* FAB buttons */}
      <div className="fab-group">
        <button
          className="fab fab-ocr"
          onClick={() => navigate('/scanner')}
          title="스크린샷으로 추가"
        >
          <ScanLine size={22} />
        </button>
        <button
          className="fab fab-add"
          onClick={() => setShowAddModal(true)}
          title="게임 추가"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Add Game Modal */}
      {showAddModal && <AddGameModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
