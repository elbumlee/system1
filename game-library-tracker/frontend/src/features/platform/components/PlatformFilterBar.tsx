import { PLATFORMS } from '../constants';
import type { Platform } from '../../../types';

interface Props {
  value: Platform | 'all';
  onChange: (p: Platform | 'all') => void;
}

const FILTER_OPTIONS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'steam', label: PLATFORMS.steam.label },
  { value: 'epic', label: 'Epic' },
  { value: 'switch', label: 'Switch' },
];

export default function PlatformFilterBar({ value, onChange }: Props) {
  return (
    <div className="filter-tabs">
      {FILTER_OPTIONS.map((f) => (
        <button
          key={f.value}
          className={`filter-tab filter-${f.value} ${value === f.value ? 'active' : ''}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
