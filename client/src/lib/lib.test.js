import test from 'node:test';
import assert from 'node:assert/strict';
import { formatClock, timeAgo, storiesCount, minutesLabel } from './format.js';
import { sanitizePrefs, loadPrefs, savePrefs, DEFAULT_PREFS } from './prefs.js';
import { PRESETS, DEFAULT_DIALS, matchPreset, sanitizeDials, heatOf } from './dials.js';

test('formatClock renders minutes and zero-padded seconds', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(65), '1:05');
  assert.equal(formatClock(600), '10:00');
  assert.equal(formatClock(-3), '0:00');
});

test('timeAgo uses natural Hebrew for each range', () => {
  const now = Date.parse('2026-11-01T12:00:00Z');
  const ago = ms => new Date(now - ms).toISOString();
  assert.equal(timeAgo(ago(10_000), now), 'הרגע');
  assert.equal(timeAgo(ago(5 * 60_000), now), 'לפני 5 דק׳');
  assert.equal(timeAgo(ago(60 * 60_000), now), 'לפני שעה');
  assert.equal(timeAgo(ago(2 * 3_600_000), now), 'לפני שעתיים');
  assert.equal(timeAgo(ago(5 * 3_600_000), now), 'לפני 5 שעות');
  assert.equal(timeAgo(ago(30 * 3_600_000), now), 'אתמול');
  assert.equal(timeAgo(ago(72 * 3_600_000), now), 'לפני 3 ימים');
  assert.equal(timeAgo('garbage', now), '');
});

test('small label helpers', () => {
  assert.equal(storiesCount(1), 'ידיעה אחת');
  assert.equal(storiesCount(9), '9 ידיעות');
  assert.equal(minutesLabel(5), '5 דק׳');
  assert.equal(minutesLabel(0), 'בלי הגבלה');
});

test('sanitizePrefs repairs anything that is not valid', () => {
  assert.deepEqual(sanitizePrefs(null), DEFAULT_PREFS);
  const result = sanitizePrefs({ minutes: 7, heat: 'volcano', topics: { tech: 'follow', sports: 'meh', world: 'mute' }, keywords: [' AI ', 'ai', '', 5, 'x'.repeat(50)], images: false, hidden: ['a', 3, 'b'], onboarded: 'yes' });
  assert.equal(result.minutes, 5);
  assert.deepEqual(result.dials, DEFAULT_PREFS.dials);
  assert.equal(result.heat, undefined);
  assert.deepEqual(result.topics, { tech: 'follow', world: 'mute' });
  assert.deepEqual(result.keywords, ['AI', 'x'.repeat(30)]);
  assert.equal(result.images, false);
  assert.deepEqual(result.hidden, ['a', 'b']);
  assert.equal(result.onboarded, false);
});

test('sanitizePrefs caps the number of keywords and hidden stories', () => {
  const result = sanitizePrefs({ keywords: Array.from({ length: 30 }, (_, i) => `k${i}`), hidden: Array.from({ length: 400 }, (_, i) => `h${i}`) });
  assert.equal(result.keywords.length, 12);
  assert.equal(result.hidden.length, 300);
  assert.equal(result.hidden.at(-1), 'h399');
});

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: key => (key in data ? data[key] : null), setItem: (key, value) => { data[key] = value; }, data };
}

test('prefs round-trip through storage, and bad storage never throws', () => {
  const storage = memoryStorage();
  savePrefs({ ...DEFAULT_PREFS, minutes: 10, onboarded: true }, storage);
  assert.equal(loadPrefs(storage).minutes, 10);
  assert.equal(loadPrefs(storage).onboarded, true);

  assert.deepEqual(loadPrefs(memoryStorage({ 'inews.prefs.v1': '{not json' })), DEFAULT_PREFS);
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadPrefs(broken), DEFAULT_PREFS);
  assert.doesNotThrow(() => savePrefs(DEFAULT_PREFS, broken));
});

import { reachLabel } from './copy.js'

test('reachLabel describes breadth of reporting without claiming verification', () => {
  assert.deepEqual(reachLabel({ owners: 1, official: false }, 1), { single: true, text: 'דווח בגוף תקשורת אחד בלבד.' })
  assert.equal(reachLabel({ owners: 3, official: false }, 3).text, 'דווח ב-3 גופי תקשורת.')
  assert.equal(reachLabel({ owners: 2, official: true }, 2).text, 'דווח ב-2 גופי תקשורת. כולל מקור רשמי.')
  assert.equal(reachLabel(undefined, 1).single, true)
})

import { progressText, refreshMessage } from './copy.js'

test('progressText names the phase and counts stories being written', () => {
  assert.equal(progressText(null), 'מתחיל')
  assert.equal(progressText({ phase: 'ingest' }), 'אוסף כותרות מהאתרים')
  assert.equal(progressText({ phase: 'enrich', done: 3, total: 10 }), 'כותב ידיעה 4 מתוך 10')
  assert.equal(progressText({ phase: 'enrich', done: 10, total: 10 }), 'כותב ידיעה 10 מתוך 10')
  assert.equal(progressText({ phase: 'enrich', done: 0, total: 0 }), 'בודק מה השתנה')
})

test('refreshMessage says what happened', () => {
  assert.equal(refreshMessage({ kind: 'done', added: 0, changed: 0 }), 'אין ידיעות חדשות כרגע.')
  assert.equal(refreshMessage({ kind: 'done', added: 1, changed: 0 }), 'נוספה ידיעה חדשה.')
  assert.equal(refreshMessage({ kind: 'done', added: 0, changed: 1 }), 'ידיעה אחת עודכנה.')
  assert.equal(refreshMessage({ kind: 'done', added: 4, changed: 2 }), 'נוספו 4 ידיעות חדשות ו-2 עודכנו.')
  assert.equal(refreshMessage({ kind: 'fresh', retryAfterSec: 200 }), 'הידיעות עדכניות. אפשר לרענן שוב בעוד 4 דקות.')
  assert.equal(refreshMessage({ kind: 'fresh', retryAfterSec: 30 }), 'הידיעות עדכניות. אפשר לרענן שוב בעוד דקה.')
  assert.match(refreshMessage({ kind: 'limit' }), /מכסת/)
  assert.match(refreshMessage({ kind: 'nope' }), /נכשל/)
})

test('older saved settings with a three-way heat are carried over to the tone dial', () => {
  assert.equal(sanitizePrefs({ heat: 'calm' }).dials.tone, 1);
  assert.equal(sanitizePrefs({ heat: 'all' }).dials.tone, 3);
  assert.equal(sanitizePrefs({ heat: 'balanced' }).dials.tone, 2);
});

test('sanitizePrefs keeps valid dials and repairs the rest', () => {
  const result = sanitizePrefs({ dials: { tone: 0, density: 9, prominence: 'x', focus: 3.4, freshness: -1 } });
  assert.deepEqual(result.dials, { tone: 0, density: 2, prominence: 2, focus: 3, freshness: 2 });
});

test('presets are valid, distinct, and recognised from their dials', () => {
  assert.equal(new Set(PRESETS.map(p => JSON.stringify(p.dials))).size, PRESETS.length);
  for (const preset of PRESETS) {
    assert.deepEqual(sanitizeDials(preset.dials), preset.dials);
    assert.equal(matchPreset(preset.dials).id, preset.id);
  }
  assert.equal(matchPreset({ tone: 0, density: 0, prominence: 0, focus: 0, freshness: 0 }), null);
  assert.deepEqual(PRESETS[0].dials, DEFAULT_DIALS);
});

test('the page accent follows the tone dial', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(tone => heatOf({ tone })), ['calm', 'calm', 'balanced', 'all', 'all']);
});

test('formatDate says today, yesterday, or the date', async () => {
  const { formatDate } = await import('./format.js');
  const now = new Date(2026, 10, 9, 21, 0).getTime();
  assert.equal(formatDate(new Date(2026, 10, 9, 8, 5).toISOString(), now), 'היום 08:05');
  assert.equal(formatDate(new Date(2026, 10, 8, 23, 30).toISOString(), now), 'אתמול 23:30');
  assert.equal(formatDate(new Date(2026, 10, 3, 14, 30).toISOString(), now), '3 בנוב׳ 14:30');
  assert.equal(formatDate('nope', now), '');
});
