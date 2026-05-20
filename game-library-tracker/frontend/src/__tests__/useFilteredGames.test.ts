/**
 * useFilteredGames 훅 TDD 테스트
 * - Zustand 스토어의 필터/정렬 로직을 단독 검증
 * - 각 테스트 전 스토어를 초기 상태로 리셋하여 독립성 보장
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilteredGames, useGameStore } from '../store/gameStore';
import type { Game } from '../types';

// ---------------------------------------------------------------------------
// 테스트 픽스처: 샘플 게임 데이터
// ---------------------------------------------------------------------------
const makeGame = (overrides: Partial<Game> & { id: string; name: string }): Game => ({
  steam: false,
  epic: false,
  switch: false,
  added_date: '2024-01-01',
  genre: '',
  favorite: false,
  notes: '',
  ...overrides,
});

const GAMES: Game[] = [
  makeGame({ id: '1', name: 'Hades', steam: true, favorite: true, added_date: '2023-01-01', genre: 'roguelike' }),
  makeGame({ id: '2', name: 'Celeste', steam: true, epic: false, added_date: '2022-06-01', genre: 'platformer' }),
  makeGame({ id: '3', name: 'Dead Cells', steam: true, switch: true, added_date: '2021-03-15', genre: 'roguelike' }),
  makeGame({ id: '4', name: 'Hollow Knight', switch: true, added_date: '2024-05-01', genre: 'metroidvania' }),
  makeGame({ id: '5', name: 'Ori and the Blind Forest', epic: true, added_date: '2020-09-10', genre: 'platformer' }),
];

// ---------------------------------------------------------------------------
// 각 테스트 전 스토어를 초기화
// ---------------------------------------------------------------------------
beforeEach(() => {
  // 스토어를 초기 상태로 리셋
  act(() => {
    useGameStore.setState({
      games: [],
      searchQuery: '',
      platformFilter: 'all',
      sortConfig: { field: 'name', direction: 'asc' },
    });
  });
});

// ---------------------------------------------------------------------------
// 1. 기본 동작 (필터 없음)
// ---------------------------------------------------------------------------
describe('useFilteredGames — 기본 동작', () => {
  it('게임이 없으면 빈 배열을 반환해야 한다', () => {
    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toEqual([]);
  });

  it('필터 없이 전체 게임을 반환해야 한다', () => {
    act(() => {
      useGameStore.getState().setGames(GAMES);
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toHaveLength(GAMES.length);
  });
});

// ---------------------------------------------------------------------------
// 2. 검색 필터 (searchQuery)
// ---------------------------------------------------------------------------
describe('useFilteredGames — 검색 필터', () => {
  beforeEach(() => {
    act(() => {
      useGameStore.getState().setGames(GAMES);
    });
  });

  it('검색어와 이름이 일치하는 게임만 반환해야 한다', () => {
    act(() => {
      useGameStore.getState().setSearchQuery('Hades');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Hades');
  });

  it('검색은 대소문자를 구분하지 않아야 한다', () => {
    act(() => {
      useGameStore.getState().setSearchQuery('hades');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Hades');
  });

  it('부분 일치 검색이 작동해야 한다', () => {
    act(() => {
      useGameStore.getState().setSearchQuery('cells');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Dead Cells');
  });

  it('일치하는 게임이 없으면 빈 배열을 반환해야 한다', () => {
    act(() => {
      useGameStore.getState().setSearchQuery('존재하지않는게임');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toHaveLength(0);
  });

  it('검색어가 공백만 있으면 전체 게임을 반환해야 한다', () => {
    act(() => {
      useGameStore.getState().setSearchQuery('   ');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toHaveLength(GAMES.length);
  });

  it('검색어를 지우면 전체 게임이 다시 나타나야 한다', () => {
    act(() => {
      useGameStore.getState().setSearchQuery('Hades');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toHaveLength(1);

    act(() => {
      useGameStore.getState().setSearchQuery('');
    });

    expect(result.current).toHaveLength(GAMES.length);
  });
});

// ---------------------------------------------------------------------------
// 3. 플랫폼 필터 (platformFilter)
// ---------------------------------------------------------------------------
describe('useFilteredGames — 플랫폼 필터', () => {
  beforeEach(() => {
    act(() => {
      useGameStore.getState().setGames(GAMES);
    });
  });

  it("platformFilter가 'all'이면 전체 게임을 반환해야 한다", () => {
    act(() => {
      useGameStore.getState().setPlatformFilter('all');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toHaveLength(GAMES.length);
  });

  it("platformFilter가 'steam'이면 steam=true인 게임만 반환해야 한다", () => {
    act(() => {
      useGameStore.getState().setPlatformFilter('steam');
    });

    const { result } = renderHook(() => useFilteredGames());
    const steamGames = GAMES.filter((g) => g.steam);
    expect(result.current).toHaveLength(steamGames.length);
    expect(result.current.every((g) => g.steam)).toBe(true);
  });

  it("platformFilter가 'epic'이면 epic=true인 게임만 반환해야 한다", () => {
    act(() => {
      useGameStore.getState().setPlatformFilter('epic');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current.every((g) => g.epic)).toBe(true);
  });

  it("platformFilter가 'switch'이면 switch=true인 게임만 반환해야 한다", () => {
    act(() => {
      useGameStore.getState().setPlatformFilter('switch');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current.every((g) => g.switch)).toBe(true);
  });

  it('플랫폼 필터와 검색이 함께 작동해야 한다 (AND 조건)', () => {
    act(() => {
      useGameStore.getState().setPlatformFilter('steam');
      useGameStore.getState().setSearchQuery('Celeste');
    });

    const { result } = renderHook(() => useFilteredGames());
    // Celeste는 steam=true이므로 결과에 포함
    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Celeste');
  });

  it('플랫폼 필터와 검색이 겹치지 않으면 빈 배열을 반환해야 한다', () => {
    // Hollow Knight는 switch 전용, epic 필터에는 포함되지 않음
    act(() => {
      useGameStore.getState().setPlatformFilter('epic');
      useGameStore.getState().setSearchQuery('Hollow Knight');
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4. 정렬 (sortConfig)
// ---------------------------------------------------------------------------
describe('useFilteredGames — 정렬', () => {
  beforeEach(() => {
    act(() => {
      useGameStore.getState().setGames(GAMES);
    });
  });

  it("name asc 정렬 시 알파벳 오름차순으로 정렬되어야 한다 (favorite 우선)", () => {
    act(() => {
      useGameStore.getState().setSortConfig({ field: 'name', direction: 'asc' });
    });

    const { result } = renderHook(() => useFilteredGames());
    // favorite=true인 Hades가 맨 앞에 위치
    expect(result.current[0].name).toBe('Hades');
    // 나머지는 이름 오름차순: Celeste, Dead Cells, Hollow Knight, Ori and the Blind Forest
    const nonFavs = result.current.filter((g) => !g.favorite).map((g) => g.name);
    expect(nonFavs).toEqual([...nonFavs].sort((a, b) => a.localeCompare(b, 'ko')));
  });

  it("name desc 정렬 시 알파벳 내림차순으로 정렬되어야 한다 (favorite 우선)", () => {
    act(() => {
      useGameStore.getState().setSortConfig({ field: 'name', direction: 'desc' });
    });

    const { result } = renderHook(() => useFilteredGames());
    // Hades(favorite)가 여전히 맨 앞
    expect(result.current[0].name).toBe('Hades');
    // 나머지는 이름 내림차순
    const nonFavs = result.current.filter((g) => !g.favorite).map((g) => g.name);
    expect(nonFavs).toEqual([...nonFavs].sort((a, b) => b.localeCompare(a, 'ko')));
  });

  it("added_date asc 정렬 시 날짜 오름차순으로 정렬되어야 한다 (favorite 우선)", () => {
    act(() => {
      useGameStore.getState().setSortConfig({ field: 'added_date', direction: 'asc' });
    });

    const { result } = renderHook(() => useFilteredGames());
    // Hades(favorite) 맨 앞
    expect(result.current[0].name).toBe('Hades');
    // 나머지는 날짜 오름차순
    const nonFavDates = result.current.filter((g) => !g.favorite).map((g) => g.added_date);
    expect(nonFavDates).toEqual([...nonFavDates].sort());
  });
});

// ---------------------------------------------------------------------------
// 5. favorite 우선순위
// ---------------------------------------------------------------------------
describe('useFilteredGames — favorite 우선순위', () => {
  it('favorite=true인 게임은 항상 맨 앞에 나와야 한다', () => {
    const gamesWithFavs: Game[] = [
      makeGame({ id: 'a', name: 'Aaa', favorite: false }),
      makeGame({ id: 'b', name: 'Bbb', favorite: true }),
      makeGame({ id: 'c', name: 'Ccc', favorite: false }),
    ];

    act(() => {
      useGameStore.getState().setGames(gamesWithFavs);
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current[0].name).toBe('Bbb');
  });

  it('favorite=true인 게임이 여럿이면 이름 정렬이 그 안에서 적용되어야 한다', () => {
    const gamesWithFavs: Game[] = [
      makeGame({ id: 'a', name: 'Zelda', favorite: true }),
      makeGame({ id: 'b', name: 'Aaaa Game', favorite: true }),
      makeGame({ id: 'c', name: 'Non Favorite', favorite: false }),
    ];

    act(() => {
      useGameStore.getState().setGames(gamesWithFavs);
      useGameStore.getState().setSortConfig({ field: 'name', direction: 'asc' });
    });

    const { result } = renderHook(() => useFilteredGames());
    // favorite 두 개가 앞에, 그 중 이름 오름차순이면 Aaaa Game이 먼저
    expect(result.current[0].name).toBe('Aaaa Game');
    expect(result.current[1].name).toBe('Zelda');
    expect(result.current[2].name).toBe('Non Favorite');
  });
});

// ---------------------------------------------------------------------------
// 6. 스토어 게임 mutate (upsertGame, removeGame)
// ---------------------------------------------------------------------------
describe('useFilteredGames — 스토어 게임 변경 반영', () => {
  it('upsertGame으로 게임을 추가하면 필터 결과에 즉시 반영되어야 한다', () => {
    act(() => {
      useGameStore.getState().setGames(GAMES);
    });

    const newGame = makeGame({ id: '99', name: 'Undertale', steam: true });
    act(() => {
      useGameStore.getState().upsertGame(newGame);
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current.some((g) => g.name === 'Undertale')).toBe(true);
  });

  it('removeGame으로 게임을 삭제하면 필터 결과에서 즉시 제거되어야 한다', () => {
    act(() => {
      useGameStore.getState().setGames(GAMES);
    });

    act(() => {
      useGameStore.getState().removeGame('1'); // Hades 삭제
    });

    const { result } = renderHook(() => useFilteredGames());
    expect(result.current.some((g) => g.id === '1')).toBe(false);
    expect(result.current).toHaveLength(GAMES.length - 1);
  });
});
