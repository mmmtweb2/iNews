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

// שקיפות: ידיעה שמבוססת על מקור אחד בלבד לא עברה איזון אמיתי בין נקודות מבט -
// עדיף לומר את זה בגלוי מאשר להעמיד פנים שהיא "מאוזנת" כמו כל השאר
export function isSingleSource(item) {
  return !item.links || item.links.length <= 1;
}

export const CATEGORY_STYLES = {
  Politics: { bar: 'bg-indigo-600', text: 'text-indigo-700', pill: 'bg-indigo-50 text-indigo-600', emoji: '🏛️' },
  Economy: { bar: 'bg-emerald-600', text: 'text-emerald-700', pill: 'bg-emerald-50 text-emerald-600', emoji: '💰' },
  Technology: { bar: 'bg-violet-600', text: 'text-violet-700', pill: 'bg-violet-50 text-violet-600', emoji: '💻' },
  Sports: { bar: 'bg-orange-600', text: 'text-orange-700', pill: 'bg-orange-50 text-orange-600', emoji: '⚽' },
  World: { bar: 'bg-sky-600', text: 'text-sky-700', pill: 'bg-sky-50 text-sky-600', emoji: '🌍' },
  Entertainment: { bar: 'bg-pink-600', text: 'text-pink-700', pill: 'bg-pink-50 text-pink-600', emoji: '🎬' },
  Health: { bar: 'bg-teal-600', text: 'text-teal-700', pill: 'bg-teal-50 text-teal-600', emoji: '🏥' },
  Culture: { bar: 'bg-amber-600', text: 'text-amber-700', pill: 'bg-amber-50 text-amber-600', emoji: '🎨' },
};

export const DEFAULT_CATEGORY_STYLE = { bar: 'bg-stone-500', text: 'text-stone-700', pill: 'bg-stone-50 text-stone-600', emoji: '📰' };

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
