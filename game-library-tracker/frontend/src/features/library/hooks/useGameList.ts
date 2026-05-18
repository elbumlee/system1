import { useEffect } from 'react';
import { useGameStore, useFilteredGames } from '../../../store/gameStore';
import { getGames } from '../../../api/games';
import type { Game } from '../../../types';

export function useGameList(): {
  filteredGames: Game[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const setGames = useGameStore((s) => s.setGames);
  const setLoading = useGameStore((s) => s.setLoading);
  const setError = useGameStore((s) => s.setError);
  const isLoading = useGameStore((s) => s.isLoading);
  const error = useGameStore((s) => s.error);
  const filteredGames = useFilteredGames();

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await getGames();
      setGames(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '게임 목록을 불러올 수 없습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { filteredGames, isLoading, error, refresh };
}
