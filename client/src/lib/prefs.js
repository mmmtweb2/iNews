// Reader preferences. They live in this browser only (no accounts), versioned so
// the shape can change later without breaking what people already saved.

import { DEFAULT_DIALS, sanitizeDials } from './dials.js'

export const MINUTE_OPTIONS = [2, 5, 10, 0]; // 0 = no limit

const KEY = 'inews.prefs.v1';
const MAX_KEYWORDS = 12;
const MAX_HIDDEN = 300;

export const DEFAULT_PREFS = {
  onboarded: false,
  minutes: 5,
  dials: DEFAULT_DIALS, // tone, density, prominence, focus, freshness: each 0-4
  topics: {}, // topicId -> 'follow' | 'mute'   (absent = neutral)
  keywords: [],
  images: true,
  hidden: [],
};

export function sanitizePrefs(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};

  const topics = {};
  if (input.topics && typeof input.topics === 'object') {
    for (const [id, state] of Object.entries(input.topics)) {
      if (state === 'follow' || state === 'mute') topics[id] = state;
    }
  }

  const keywords = [];
  for (const word of Array.isArray(input.keywords) ? input.keywords : []) {
    const text = typeof word === 'string' ? word.trim().slice(0, 30) : '';
    if (text && !keywords.some(k => k.toLowerCase() === text.toLowerCase())) keywords.push(text);
  }

  const hidden = (Array.isArray(input.hidden) ? input.hidden : []).filter(id => typeof id === 'string').slice(-MAX_HIDDEN);

  return {
    onboarded: input.onboarded === true,
    minutes: MINUTE_OPTIONS.includes(input.minutes) ? input.minutes : DEFAULT_PREFS.minutes,
    dials: sanitizeDials(input.dials, input.heat), // older saves had a three-way "heat" setting
    topics,
    keywords: keywords.slice(0, MAX_KEYWORDS),
    images: input.images !== false,
    hidden,
  };
}

export function loadPrefs(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(KEY);
    return sanitizePrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return sanitizePrefs(null); // private mode, blocked storage or corrupt JSON
  }
}

export function savePrefs(prefs, storage = globalThis.localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable: preferences simply last for this visit
  }
}
