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

export const CATEGORY_STYLES = {
  Politics: { bar: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-600' },
  Economy: { bar: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-600' },
  Technology: { bar: 'bg-violet-500', pill: 'bg-violet-50 text-violet-600' },
  Sports: { bar: 'bg-orange-500', pill: 'bg-orange-50 text-orange-600' },
};

export const DEFAULT_CATEGORY_STYLE = { bar: 'bg-slate-400', pill: 'bg-slate-50 text-slate-600' };

export const BIAS_STYLES = {
  'left-center': { dot: 'bg-blue-500', label: 'שמאל-מרכז' },
  center: { dot: 'bg-slate-400', label: 'מרכז' },
  right: { dot: 'bg-rose-500', label: 'ימין' },
  'right-religious': { dot: 'bg-rose-600', label: 'ימין-דתי' },
  neutral: { dot: 'bg-emerald-500', label: 'ניטרלי' },
};

export const DEFAULT_BIAS_STYLE = { dot: 'bg-slate-300', label: '' };
