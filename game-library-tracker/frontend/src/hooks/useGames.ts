import { useState, useEffect, useCallback } from 'react';
import type { Game, Platform, SortConfig } from '../types';
import { getGames, createGame, updateGame, deleteGame } from '../api/client';

interface UseGamesReturn {
  games: Game[];
  filteredGames: Game[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  platformFilter: Platform | 'all';
  setPlatformFilter: (p: Platform | 'all') => void;
  sortConfig: SortConfig;
  setSortConfig: (s: SortConfig) => void;
  refresh: () => Promise<void>;
  addGame: (payload: {
    name: string;
    steam: boolean;
    epic: boolean;
    switch: boolean;
    notes: string;
  }) => Promise<Game>;
  editGame: (
    id: string,
    payload: Partial<{
      name: string;
      steam: boolean;
      epic: boolean;
      switch: boolean;
      notes: string;
    }>
  ) => Promise<Game>;
  removeGame: (id: string) => Promise<void>;
  togglePlatform: (id: string, platform: Platform, current: boolean) => Promise<void>;
}

export function useGames(): UseGamesReturn {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc',
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGames();
      setGames(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '게임 목록을 불러올 수 없습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredGames = (() => {
    let result = [...games];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }

    // Platform filter
    if (platformFilter !== 'all') {
      result = result.filter((g) => g[platformFilter] === true);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.field] ?? '';
      const bVal = b[sortConfig.field] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), 'ko');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });

    return result;
  })();

  const addGame = useCallback(
    async (payload: {
      name: string;
      steam: boolean;
      epic: boolean;
      switch: boolean;
      notes: string;
    }) => {
      const newGame = await createGame(payload);
      setGames((prev) => [...prev, newGame]);
      return newGame;
    },
    []
  );

  const editGame = useCallback(
    async (
      id: string,
      payload: Partial<{
        name: string;
        steam: boolean;
        epic: boolean;
        switch: boolean;
        notes: string;
      }>
    ) => {
      const updated = await updateGame(id, payload);
      setGames((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return updated;
    },
    []
  );

  const removeGame = useCallback(async (id: string) => {
    await deleteGame(id);
    setGames((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const togglePlatform = useCallback(
    async (id: string, platform: Platform, current: boolean) => {
      const updated = await updateGame(id, { [platform]: !current });
      setGames((prev) => prev.map((g) => (g.id === id ? updated : g)));
    },
    []
  );

  return {
    games,
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
  };
}
