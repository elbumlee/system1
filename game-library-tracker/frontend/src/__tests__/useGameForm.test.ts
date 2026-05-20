/**
 * useGameForm 훅 TDD 테스트
 * - 게임 폼 상태 관리 및 유효성 검사 로직을 단독으로 검증
 * - React 컴포넌트 렌더링 없이 renderHook으로 훅만 테스트
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameForm } from '../features/game-form/hooks/useGameForm';

// ---------------------------------------------------------------------------
// 1. 초기 상태 (initial state)
// ---------------------------------------------------------------------------
describe('useGameForm — 초기 상태', () => {
  it('초기값 없이 호출하면 name이 빈 문자열이어야 한다', () => {
    const { result } = renderHook(() => useGameForm());
    expect(result.current.fields.name).toBe('');
  });

  it('초기값 없이 호출하면 모든 플랫폼 플래그가 false여야 한다', () => {
    const { result } = renderHook(() => useGameForm());
    expect(result.current.fields.steam).toBe(false);
    expect(result.current.fields.epic).toBe(false);
    expect(result.current.fields.switch).toBe(false);
  });

  it('초기값 없이 호출하면 favorite이 false여야 한다', () => {
    const { result } = renderHook(() => useGameForm());
    expect(result.current.fields.favorite).toBe(false);
  });

  it('initial 값을 전달하면 name이 해당 값으로 초기화되어야 한다', () => {
    const { result } = renderHook(() =>
      useGameForm({ name: 'Hollow Knight', steam: true })
    );
    expect(result.current.fields.name).toBe('Hollow Knight');
    expect(result.current.fields.steam).toBe(true);
  });

  it('initial에 없는 필드는 기본값으로 채워져야 한다', () => {
    const { result } = renderHook(() => useGameForm({ name: 'Celeste' }));
    expect(result.current.fields.epic).toBe(false);
    expect(result.current.fields.genre).toBe('');
    expect(result.current.fields.notes).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 2. 유효성 검사 (isValid)
// ---------------------------------------------------------------------------
describe('useGameForm — isValid 유효성 검사', () => {
  it('name이 빈 문자열이면 isValid가 false여야 한다', () => {
    const { result } = renderHook(() => useGameForm());
    expect(result.current.isValid).toBe(false);
  });

  it('name이 공백만 있으면 isValid가 false여야 한다', () => {
    const { result } = renderHook(() => useGameForm({ name: '   ' }));
    expect(result.current.isValid).toBe(false);
  });

  it('name에 유효한 문자가 있으면 isValid가 true여야 한다', () => {
    const { result } = renderHook(() => useGameForm({ name: 'Hades' }));
    expect(result.current.isValid).toBe(true);
  });

  it('setName으로 유효한 이름을 입력하면 isValid가 true로 바뀌어야 한다', () => {
    const { result } = renderHook(() => useGameForm());
    // 초기에는 invalid
    expect(result.current.isValid).toBe(false);

    act(() => {
      result.current.setName('Dead Cells');
    });

    expect(result.current.isValid).toBe(true);
  });

  it('setName으로 이름을 지우면 isValid가 false로 바뀌어야 한다', () => {
    const { result } = renderHook(() => useGameForm({ name: 'Sekiro' }));
    expect(result.current.isValid).toBe(true);

    act(() => {
      result.current.setName('');
    });

    expect(result.current.isValid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. 필드 setter 동작
// ---------------------------------------------------------------------------
describe('useGameForm — 필드 setter', () => {
  it('setName 호출 시 name 필드가 변경되어야 한다', () => {
    const { result } = renderHook(() => useGameForm());

    act(() => {
      result.current.setName('Ori and the Blind Forest');
    });

    expect(result.current.fields.name).toBe('Ori and the Blind Forest');
  });

  it('setSteam(true) 호출 시 steam 필드가 true로 바뀌어야 한다', () => {
    const { result } = renderHook(() => useGameForm());

    act(() => {
      result.current.setSteam(true);
    });

    expect(result.current.fields.steam).toBe(true);
  });

  it('setEpic(true) 호출 시 epic 필드가 true로 바뀌어야 한다', () => {
    const { result } = renderHook(() => useGameForm());

    act(() => {
      result.current.setEpic(true);
    });

    expect(result.current.fields.epic).toBe(true);
  });

  it('setSwitch(true) 호출 시 switch 필드가 true로 바뀌어야 한다', () => {
    const { result } = renderHook(() => useGameForm());

    act(() => {
      result.current.setSwitch(true);
    });

    expect(result.current.fields.switch).toBe(true);
  });

  it('setGenre 호출 시 genre 필드가 변경되어야 한다', () => {
    const { result } = renderHook(() => useGameForm());

    act(() => {
      result.current.setGenre('action');
    });

    expect(result.current.fields.genre).toBe('action');
  });

  it('setFavorite(true) 호출 시 favorite 필드가 true로 바뀌어야 한다', () => {
    const { result } = renderHook(() => useGameForm());

    act(() => {
      result.current.setFavorite(true);
    });

    expect(result.current.fields.favorite).toBe(true);
  });

  it('setNotes 호출 시 notes 필드가 변경되어야 한다', () => {
    const { result } = renderHook(() => useGameForm());

    act(() => {
      result.current.setNotes('최고의 메트로배니아');
    });

    expect(result.current.fields.notes).toBe('최고의 메트로배니아');
  });

  it('한 필드를 변경해도 다른 필드는 유지되어야 한다', () => {
    const { result } = renderHook(() =>
      useGameForm({ name: 'Hades', steam: true, epic: true })
    );

    act(() => {
      result.current.setGenre('roguelike');
    });

    // 변경한 genre만 바뀌고 나머지는 유지
    expect(result.current.fields.name).toBe('Hades');
    expect(result.current.fields.steam).toBe(true);
    expect(result.current.fields.epic).toBe(true);
    expect(result.current.fields.genre).toBe('roguelike');
  });
});

// ---------------------------------------------------------------------------
// 4. reset 동작
// ---------------------------------------------------------------------------
describe('useGameForm — reset', () => {
  it('reset() 호출 시 initial이 없으면 빈 상태로 돌아와야 한다', () => {
    const { result } = renderHook(() => useGameForm());

    act(() => {
      result.current.setName('Cuphead');
      result.current.setSteam(true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.fields.name).toBe('');
    expect(result.current.fields.steam).toBe(false);
  });

  it('reset() 호출 시 initial 값이 있으면 initial로 복원되어야 한다', () => {
    const { result } = renderHook(() =>
      useGameForm({ name: 'Celeste', steam: true })
    );

    act(() => {
      result.current.setName('Changed Name');
      result.current.setSteam(false);
    });

    act(() => {
      result.current.reset();
    });

    // initial 값으로 복원
    expect(result.current.fields.name).toBe('Celeste');
    expect(result.current.fields.steam).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. getPayload 동작
// ---------------------------------------------------------------------------
describe('useGameForm — getPayload', () => {
  it('getPayload()는 현재 fields의 복사본을 반환해야 한다', () => {
    const { result } = renderHook(() =>
      useGameForm({ name: 'Hades', steam: true, genre: 'roguelike' })
    );

    const payload = result.current.getPayload();
    expect(payload.name).toBe('Hades');
    expect(payload.steam).toBe(true);
    expect(payload.genre).toBe('roguelike');
  });

  it('getPayload()는 name의 앞뒤 공백을 trim해야 한다', () => {
    const { result } = renderHook(() => useGameForm({ name: '  Celeste  ' }));
    const payload = result.current.getPayload();
    expect(payload.name).toBe('Celeste');
  });

  it('getPayload()는 notes의 앞뒤 공백을 trim해야 한다', () => {
    const { result } = renderHook(() => useGameForm({ notes: '  좋은 게임  ' }));
    const payload = result.current.getPayload();
    expect(payload.notes).toBe('좋은 게임');
  });
});
