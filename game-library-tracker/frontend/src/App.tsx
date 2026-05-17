import { useState } from 'react';
import { Plus, ScanLine, Download, Settings, RefreshCw, Search, X } from 'lucide-react';
import { useGames } from './hooks/useGames';
import GameTable from './components/GameTable';
import AddGameModal from './components/AddGameModal';
import OCRUpload from './components/OCRUpload';
import StorageSettings from './components/StorageSettings';
import type { Game, Platform, SortConfig } from './types';

type Modal = 'add' | 'ocr' | 'settings' | null;

const PLATFORM_FILTERS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'steam', label: 'Steam' },
  { value: 'epic', label: 'Epic' },
  { value: 'switch', label: 'Switch' },
];

export default function App() {
  const {
    filteredGames,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    platformFilter,
    setPlatformFilter,
    sortConfig,
    setSortConfig,
    refresh,
    addGame,
    editGame,
    removeGame,
    togglePlatform,
  } = useGames();

  const [modal, setModal] = useState<Modal>(null);
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

  function handleOCRAdded(games: Game[]) {
    void games;
    refresh();
  }

  async function handleEdit(id: string, payload: Partial<Game>) {
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
          <button className={`icon-btn header-btn ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} title="새로고침">
            <RefreshCw size={18} />
          </button>
          <button className="icon-btn header-btn" onClick={() => window.open('/api/export/excel', '_blank')} title="Excel 내보내기">
            <Download size={18} />
          </button>
          <button className="icon-btn header-btn" onClick={() => setModal('settings')} title="저장소 설정">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="controls">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="게임 이름 검색..."
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}><X size={14} /></button>
          )}
        </div>

        <div className="filter-tabs">
          {PLATFORM_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-tab filter-${f.value} ${platformFilter === f.value ? 'active' : ''}`}
              onClick={() => setPlatformFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          백엔드 서버에 연결할 수 없습니다. <code>python main.py</code>를 실행했는지 확인하세요.
        </div>
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
        <button className="fab fab-ocr" onClick={() => setModal('ocr')} title="스크린샷으로 추가">
          <ScanLine size={22} />
        </button>
        <button className="fab fab-add" onClick={() => setModal('add')} title="게임 추가">
          <Plus size={24} />
        </button>
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <AddGameModal onClose={() => setModal(null)} onAdd={addGame} />
      )}
      {modal === 'ocr' && (
        <OCRUpload onClose={() => setModal(null)} onAdded={handleOCRAdded} />
      )}
      {modal === 'settings' && (
        <StorageSettings onClose={() => setModal(null)} />
      )}
    </div>
  );
}
