import { useState } from 'react';
import type { Game } from '../../../types';

interface GameFormFields {
  name: string;
  steam: boolean;
  epic: boolean;
  switch: boolean;
  genre: string;
  favorite: boolean;
  notes: string;
}

interface UseGameFormReturn {
  fields: GameFormFields;
  setName: (v: string) => void;
  setSteam: (v: boolean) => void;
  setEpic: (v: boolean) => void;
  setSwitch: (v: boolean) => void;
  setGenre: (v: string) => void;
  setFavorite: (v: boolean) => void;
  setNotes: (v: string) => void;
  isValid: boolean;
  reset: () => void;
  getPayload: () => GameFormFields;
}

function buildInitial(initial?: Partial<Game>): GameFormFields {
  return {
    name: initial?.name ?? '',
    steam: initial?.steam ?? false,
    epic: initial?.epic ?? false,
    switch: initial?.switch ?? false,
    genre: initial?.genre ?? '',
    favorite: initial?.favorite ?? false,
    notes: initial?.notes ?? '',
  };
}

export function useGameForm(initial?: Partial<Game>): UseGameFormReturn {
  const [fields, setFields] = useState<GameFormFields>(() => buildInitial(initial));

  const setName = (v: string) => setFields((f) => ({ ...f, name: v }));
  const setSteam = (v: boolean) => setFields((f) => ({ ...f, steam: v }));
  const setEpic = (v: boolean) => setFields((f) => ({ ...f, epic: v }));
  const setSwitchVal = (v: boolean) => setFields((f) => ({ ...f, switch: v }));
  const setGenre = (v: string) => setFields((f) => ({ ...f, genre: v }));
  const setFavorite = (v: boolean) => setFields((f) => ({ ...f, favorite: v }));
  const setNotes = (v: string) => setFields((f) => ({ ...f, notes: v }));

  const isValid = fields.name.trim().length > 0;

  function reset() {
    setFields(buildInitial(initial));
  }

  function getPayload(): GameFormFields {
    return {
      name: fields.name.trim(),
      steam: fields.steam,
      epic: fields.epic,
      switch: fields.switch,
      genre: fields.genre,
      favorite: fields.favorite,
      notes: fields.notes.trim(),
    };
  }

  return {
    fields,
    setName,
    setSteam,
    setEpic,
    setSwitch: setSwitchVal,
    setGenre,
    setFavorite,
    setNotes,
    isValid,
    reset,
    getPayload,
  };
}
