export function timeAgo(isoString) {
  if (!isoString) return 'עודכן לאחרונה';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'עודכן לאחרונה';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return 'הרגע';
  if (mins < 60) return `לפני ${mins} דק'`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שע'`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

export function isRecent(isoString, withinMinutes = 60) {
  if (!isoString) return false;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return false;
  return (Date.now() - date.getTime()) / 60000 < withinMinutes;
}

// "טרנדי" = כמה מקורות שונים כיסו את אותה ידיעה בו-זמנית - נגזר מנתונים
// שכבר יש לנו (אורך links), בלי צורך במקור/API חיצוני נוסף
export function isTrending(item) {
  return !!item.links && item.links.length >= 3;
}

export const CATEGORY_STYLES = {
  Politics: { bar: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-600', emoji: '🏛️' },
  Economy: { bar: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-600', emoji: '💰' },
  Technology: { bar: 'bg-violet-500', pill: 'bg-violet-50 text-violet-600', emoji: '💻' },
  Sports: { bar: 'bg-orange-500', pill: 'bg-orange-50 text-orange-600', emoji: '⚽' },
  World: { bar: 'bg-sky-500', pill: 'bg-sky-50 text-sky-600', emoji: '🌍' },
  Entertainment: { bar: 'bg-pink-500', pill: 'bg-pink-50 text-pink-600', emoji: '🎬' },
  Health: { bar: 'bg-teal-500', pill: 'bg-teal-50 text-teal-600', emoji: '🏥' },
  Culture: { bar: 'bg-amber-500', pill: 'bg-amber-50 text-amber-600', emoji: '🎨' },
};

export const DEFAULT_CATEGORY_STYLE = { bar: 'bg-slate-400', pill: 'bg-slate-50 text-slate-600', emoji: '📰' };

export const BIAS_STYLES = {
  'left-center': { dot: 'bg-blue-500', label: 'שמאל-מרכז' },
  center: { dot: 'bg-slate-400', label: 'מרכז' },
  right: { dot: 'bg-rose-500', label: 'ימין' },
  'right-religious': { dot: 'bg-rose-600', label: 'ימין-דתי' },
  neutral: { dot: 'bg-emerald-500', label: 'ניטרלי' },
  aggregated: { dot: 'bg-cyan-500', label: 'Google News' },
};

export const DEFAULT_BIAS_STYLE = { dot: 'bg-slate-300', label: '' };

export const REACTION_EMOJIS = ['👍', '😡', '😮', '🔥'];
