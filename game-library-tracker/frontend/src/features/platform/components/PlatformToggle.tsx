import { PLATFORMS } from '../constants';
import type { Platform } from '../../../types';

interface Props {
  platform: Platform;
  active: boolean;
  onClick: () => void;
}

export default function PlatformToggle({ platform, active, onClick }: Props) {
  const config = PLATFORMS[platform];
  return (
    <button
      className={`platform-btn platform-${platform} ${active ? 'active' : ''}`}
      onClick={onClick}
      title={`${config.label} ${active ? '소유' : '미소유'}`}
    >
      {active ? '✓' : ''}
    </button>
  );
}
