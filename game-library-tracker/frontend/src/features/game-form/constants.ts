export const GENRES = [
  'RPG', 'MMORPG', 'FPS', '슈팅', '뱀서류', '온라인',
  '어드벤처', '전략', '시뮬레이션', '퍼즐', '스포츠',
  '액션', '플랫폼', '격투', '공포', '기타',
] as const;

export type Genre = typeof GENRES[number] | '';
