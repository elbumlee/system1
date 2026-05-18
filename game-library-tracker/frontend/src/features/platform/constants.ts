export const PLATFORMS = {
  steam: { label: 'Steam', color: '#66c0f4', bg: '#1b2838' },
  epic: { label: 'Epic Games', color: '#0078f2', bg: '#2d2d2d' },
  switch: { label: 'Nintendo Switch', color: '#ffffff', bg: '#e4000f' },
} as const;

export type PlatformKey = keyof typeof PLATFORMS;
