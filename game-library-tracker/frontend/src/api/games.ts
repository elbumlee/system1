import api from './client';
import type { Game } from '../types';

export const getGames = async (): Promise<Game[]> => {
  const res = await api.get<Game[]>('/games');
  return res.data;
};

export const createGame = async (payload: {
  name: string;
  steam: boolean;
  epic: boolean;
  switch: boolean;
  notes: string;
}): Promise<Game> => {
  const res = await api.post<Game>('/games', payload);
  return res.data;
};

export const updateGame = async (
  id: string,
  payload: Partial<{
    name: string;
    steam: boolean;
    epic: boolean;
    switch: boolean;
    notes: string;
  }>
): Promise<Game> => {
  const res = await api.put<Game>(`/games/${id}`, payload);
  return res.data;
};

export const deleteGame = async (id: string): Promise<void> => {
  await api.delete(`/games/${id}`);
};
