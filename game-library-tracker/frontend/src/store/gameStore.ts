import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Game, Platform, SortConfig } from '../types';

interface GameStore {
  games: Game[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  platformFilter: Platform | 'all';
  sortConfig: SortConfig;
  setGames: (games: Game[]) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setSearchQuery: (q: string) => void;
  setPlatformFilter: (p: Platform | 'all') => void;
  setSortConfig: (s: SortConfig) => void;
  upsertGame: (game: Game) => void;
  removeGame: (id: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  games: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  platformFilter: 'all',
  sortConfig: { field: 'name', direction: 'asc' },

  setGames: (games) => set({ games }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setPlatformFilter: (p) => set({ platformFilter: p }),
  setSortConfig: (s) => set({ sortConfig: s }),
  upsertGame: (game) =>
    set((state) => {
      const exists = state.games.some((g) => g.id === game.id);
      return {
        games: exists
          ? state.games.map((g) => (g.id === game.id ? game : g))
          : [...state.games, game],
      };
    }),
  removeGame: (id) =>
    set((state) => ({ games: state.games.filter((g) => g.id !== id) })),
}));

export function useFilteredGames(): Game[] {
  return useGameStore(
    useShallow((state) => {
      let result = [...state.games];

      if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase();
        result = result.filter((g) => g.name.toLowerCase().includes(q));
      }

      if (state.platformFilter !== 'all') {
        result = result.filter((g) => g[state.platformFilter as Platform] === true);
      }

      result.sort((a, b) => {
        const aVal = a[state.sortConfig.field] ?? '';
        const bVal = b[state.sortConfig.field] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal), 'ko');
        return state.sortConfig.direction === 'asc' ? cmp : -cmp;
      });

      return result;
    })
  );
}
