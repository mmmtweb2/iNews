import test from 'node:test';
import assert from 'node:assert/strict';
import { formatClock, timeAgo, storiesCount, minutesLabel } from './format.js';
import { sanitizePrefs, loadPrefs, savePrefs, DEFAULT_PREFS } from './prefs.js';

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
  assert.equal(result.heat, 'balanced');
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
