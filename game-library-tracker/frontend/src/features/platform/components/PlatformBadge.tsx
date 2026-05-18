import { PLATFORMS } from '../constants';
import type { Platform } from '../../../types';

interface Props {
  platform: Platform;
  active: boolean;
}

export default function PlatformBadge({ platform, active }: Props) {
  const config = PLATFORMS[platform];
  return (
    <span
      className={`platform-badge platform-${platform} ${active ? 'active' : 'inactive'}`}
      style={active ? { color: config.color, backgroundColor: config.bg } : undefined}
    >
      {config.label}
    </span>
  );
}
