import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatCurrency(amount: number, currency = '₪'): string {
  return `${currency}${amount.toLocaleString()}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

// Avatar utilities
export function generateAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
}

export function getPlayerInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Badge system
export type BadgeKey = 'winner' | 'shark' | 'survivor' | 'regular' | 'cannon';

export interface BadgeDef {
  key: BadgeKey;
  label: string;
  labelEn: string;
  icon: string;
  check: (stats: { wins?: number; knockouts_dealt?: number; itm_count?: number; tournaments_played?: number; net_pnl?: number }) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  { key: 'winner', label: 'מנצח', labelEn: 'Winner', icon: '🏆', check: (s) => (s.wins ?? 0) >= 1 },
  { key: 'shark', label: 'כריש', labelEn: 'Shark', icon: '🦈', check: (s) => (s.knockouts_dealt ?? 0) >= 5 },
  { key: 'survivor', label: 'ניצול', labelEn: 'Survivor', icon: '🛡️', check: (s) => (s.itm_count ?? 0) >= 3 },
  { key: 'regular', label: 'רגולר', labelEn: 'Regular', icon: '🎯', check: (s) => (s.tournaments_played ?? 0) >= 10 },
  { key: 'cannon', label: 'תותח', labelEn: 'Cannon', icon: '💰', check: (s) => (s.net_pnl ?? 0) > 1000 },
];

export function computeBadges(stats: Record<string, any>): BadgeDef[] {
  return BADGE_DEFINITIONS.filter((b) => b.check(stats));
}
