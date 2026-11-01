export const HEAT_LABELS = ['', 'רגוע', 'מתון', 'מורגש', 'כבד', 'קשה'];

export function formatClock(seconds) {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function timeAgo(iso, now = Date.now()) {
  const diff = now - Date.parse(iso);
  if (!Number.isFinite(diff)) return '';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'הרגע';
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'לפני שעה';
  if (hours === 2) return 'לפני שעתיים';
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'אתמול';
  return `לפני ${days} ימים`;
}

export function storiesCount(n) {
  return n === 1 ? 'ידיעה אחת' : `${n} ידיעות`;
}

export function minutesLabel(minutes) {
  return minutes > 0 ? `${minutes} דק׳` : 'בלי הגבלה';
}
