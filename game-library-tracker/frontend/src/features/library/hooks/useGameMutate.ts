import { useGameStore } from '../../../store/gameStore';
import { createGame, updateGame, deleteGame } from '../../../api/games';
import type { Game, Platform } from '../../../types';

export function useGameMutate() {
  const upsertGame = useGameStore((s) => s.upsertGame);
  const removeGameFromStore = useGameStore((s) => s.removeGame);

  async function addGame(payload: {
    name: string;
    steam: boolean;
    epic: boolean;
    switch: boolean;
    genre: string;
    favorite: boolean;
    notes: string;
  }): Promise<Game> {
    const newGame = await createGame(payload);
    upsertGame(newGame);
    return newGame;
  }

  async function editGame(id: string, payload: Partial<Game>): Promise<Game> {
    const updated = await updateGame(id, payload);
    upsertGame(updated);
    return updated;
  }

  async function removeGame(id: string): Promise<void> {
    await deleteGame(id);
    removeGameFromStore(id);
  }

  async function togglePlatform(id: string, platform: Platform, current: boolean): Promise<void> {
    const updated = await updateGame(id, { [platform]: !current });
    upsertGame(updated);
  }

  return { addGame, editGame, removeGame, togglePlatform };
}
