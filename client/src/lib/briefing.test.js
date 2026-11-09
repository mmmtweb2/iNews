import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBriefing, scoreStory, matchesKeywords } from './briefing.js';
import { DEFAULT_PREFS } from './prefs.js';
import { DEFAULT_DIALS, PRESETS } from './dials.js';

const NOW = Date.parse('2026-11-01T12:00:00Z');

let counter = 0;
function story(overrides = {}) {
  counter += 1;
  const base = {
    id: `s${counter}`,
    headline: `כותרת ${counter}`,
    oneLiner: 'משפט',
    entities: [],
    topics: ['tech'],
    primaryTopic: 'tech',
    intensity: 1,
    importance: 3,
    graphic: false,
    sources: [{ id: 'a' }],
    publishedAt: new Date(NOW - 30 * 60_000).toISOString(),
    readSec: { headline: 4, short: 10, full: 25, calm: 12 },
  };
  return { ...base, ...overrides, readSec: { ...base.readSec, ...(overrides.readSec || {}) } };
}

const prefs = (overrides = {}) => ({ ...DEFAULT_PREFS, ...overrides });
const dl = overrides => ({ ...DEFAULT_DIALS, ...overrides });
const ids = list => list.map(entry => entry.story.id);

test('the brief never exceeds the time budget (except for a single over-long top story)', () => {
  const stories = Array.from({ length: 40 }, () => story());
  const result = buildBriefing(stories, prefs({ minutes: 2 }), NOW);
  assert.ok(result.usedSec <= 120, `used ${result.usedSec}`);
  assert.equal(result.budgetSec, 120);
  assert.ok(result.items.length > 0);
});

test('a single story longer than the budget is still shown', () => {
  const result = buildBriefing([story({ readSec: { short: 300, full: 400, headline: 5, calm: 5 } })], prefs({ minutes: 2 }), NOW);
  assert.equal(result.items.length, 1);
});

test('start times form a running clock over the chosen depth', () => {
  const result = buildBriefing([story(), story(), story()], prefs({ minutes: 5 }), NOW);
  let expected = 0;
  for (const item of result.items) {
    assert.equal(item.startSec, expected);
    expected += item.costSec;
  }
  assert.equal(result.usedSec, expected);
});

test('spare time upgrades the best stories to the full write-up', () => {
  const result = buildBriefing([story({ importance: 5 }), story({ importance: 1 })], prefs({ minutes: 5 }), NOW);
  assert.equal(result.items[0].depth, 'full');
});

test('more minutes never produce a shorter brief', () => {
  const stories = Array.from({ length: 30 }, (_, i) => story({ importance: 1 + (i % 5) }));
  const counts = [2, 5, 10].map(minutes => buildBriefing(stories, prefs({ minutes }), NOW).items.length);
  assert.ok(counts[0] <= counts[1] && counts[1] <= counts[2], counts.join(','));
});

test('headline-only entries fill leftover time', () => {
  const heavy = { headline: 4, short: 70, full: 200, calm: 10 }; // full write-up too long to fit, so no upgrade
  const stories = [story({ readSec: heavy }), story({ readSec: heavy })];
  const result = buildBriefing(stories, prefs({ minutes: 2 }), NOW);
  assert.deepEqual(result.items.map(item => item.depth).sort(), ['headline', 'short']);
});

test('unlimited time lists everything, with full depth only for the top few', () => {
  const stories = Array.from({ length: 12 }, () => story());
  const result = buildBriefing(stories, prefs({ minutes: 0 }), NOW);
  assert.equal(result.budgetSec, null);
  assert.equal(result.items.length, 12);
  assert.equal(result.items.filter(item => item.depth === 'full').length, 3);
});

test('intensity cap: calm hides tense stories, balanced hides heavy ones, all shows everything', () => {
  const stories = [story({ intensity: 1 }), story({ intensity: 3 }), story({ intensity: 5, importance: 2 })];
  assert.equal(buildBriefing(stories, prefs({ dials: dl({ tone: 1 }), minutes: 0 }), NOW).items.length, 1);
  assert.equal(buildBriefing(stories, prefs({ dials: dl({ tone: 2 }), minutes: 0 }), NOW).items.length, 2);
  assert.equal(buildBriefing(stories, prefs({ dials: dl({ tone: 3 }), minutes: 0 }), NOW).items.length, 3);
});

test('heavy but important stories are kept, as a calm rewrite, instead of being hidden', () => {
  const heavyImportant = story({ intensity: 4, importance: 5 });
  const heavyMinor = story({ intensity: 4, importance: 2 });
  const result = buildBriefing([heavyImportant, heavyMinor], prefs({ dials: dl({ tone: 2 }), minutes: 0 }), NOW);
  assert.deepEqual(result.items.map(item => [item.story.id, item.tone, item.depth]), [[heavyImportant.id, 'calm', 'calm']]);
  assert.deepEqual(result.filtered.map(s => s.id), [heavyMinor.id]);
});

test('graphic stories are rewritten or hidden unless the reader chose everything', () => {
  const graphic = story({ intensity: 4, importance: 2, graphic: true });
  assert.equal(buildBriefing([graphic], prefs({ dials: dl({ tone: 2 }), minutes: 0 }), NOW).filtered.length, 1);
  assert.equal(buildBriefing([graphic], prefs({ dials: dl({ tone: 3 }), minutes: 0 }), NOW).items.length, 1);
  const important = story({ intensity: 3, importance: 4, graphic: true });
  assert.equal(buildBriefing([important], prefs({ dials: dl({ tone: 2 }), minutes: 0 }), NOW).items[0].tone, 'calm');
});

test('muted topics are left out, but not the biggest news and not followed keywords', () => {
  const sports = story({ topics: ['sports'], primaryTopic: 'sports', importance: 2 });
  const bigSports = story({ topics: ['sports'], primaryTopic: 'sports', importance: 5 });
  const keywordSports = story({ topics: ['sports'], primaryTopic: 'sports', importance: 2, headline: 'מכבי מנצחת בגמר' });
  const result = buildBriefing([sports, bigSports, keywordSports], prefs({ topics: { sports: 'mute' }, keywords: ['מכבי'], minutes: 0 }), NOW);
  assert.deepEqual(ids(result.items).sort(), [bigSports.id, keywordSports.id].sort());
  assert.deepEqual(result.muted.map(s => s.id), [sports.id]);
});

test('followed topics and keywords rank higher', () => {
  const plain = story({ importance: 3 });
  const followed = story({ importance: 3, topics: ['economy'], primaryTopic: 'economy' });
  const keyword = story({ importance: 3, entities: ['בינה מלאכותית'] });
  const p = prefs({ topics: { economy: 'follow' }, keywords: ['בינה מלאכותית'] });
  assert.ok(scoreStory(followed, p, NOW) > scoreStory(plain, p, NOW));
  assert.ok(scoreStory(keyword, p, NOW) > scoreStory(followed, p, NOW));
});

test('importance, outlet count and freshness all raise the score', () => {
  const base = story();
  const p = prefs();
  assert.ok(scoreStory({ ...base, importance: 5 }, p, NOW) > scoreStory(base, p, NOW));
  assert.ok(scoreStory({ ...base, sources: [{}, {}, {}] }, p, NOW) > scoreStory(base, p, NOW));
  assert.ok(scoreStory({ ...base, publishedAt: new Date(NOW - 30 * 3_600_000).toISOString() }, p, NOW) < scoreStory(base, p, NOW));
});

test('hidden stories never come back', () => {
  const a = story();
  const b = story();
  const result = buildBriefing([a, b], prefs({ hidden: [a.id], minutes: 0 }), NOW);
  assert.deepEqual(ids(result.items), [b.id]);
});

test('keyword matching ignores case and looks at headline, one-liner and entities', () => {
  assert.equal(matchesKeywords(story({ headline: 'OpenAI announces' }), ['openai']), true);
  assert.equal(matchesKeywords(story({ entities: ['בנק ישראל'] }), ['בנק']), true);
  assert.equal(matchesKeywords(story(), ['לא קיים']), false);
  assert.equal(matchesKeywords(story(), []), false);
});

test('nothing is lost: every story is either shown, in overflow, filtered, muted or hidden', () => {
  const stories = [
    ...Array.from({ length: 25 }, (_, i) => story({ importance: 1 + (i % 5), intensity: 1 + (i % 5), topics: [i % 4 === 0 ? 'sports' : 'tech'], primaryTopic: i % 4 === 0 ? 'sports' : 'tech' })),
  ];
  const p = prefs({ dials: dl({ tone: 2 }), minutes: 2, topics: { sports: 'mute' }, hidden: [stories[1].id] });
  const result = buildBriefing(stories, p, NOW);
  const accounted = result.items.length + result.overflow.length + result.filtered.length + result.muted.length + 1;
  assert.equal(accounted, stories.length);
});

test('the same input always produces the same brief', () => {
  const stories = Array.from({ length: 20 }, (_, i) => story({ importance: 1 + (i % 5) }));
  const a = buildBriefing(stories, prefs(), NOW);
  const b = buildBriefing(stories, prefs(), NOW);
  assert.deepEqual(ids(a.items), ids(b.items));
});

test('every dial in its middle position reproduces the original brief', () => {
  const stories = Array.from({ length: 12 }, () => story());
  const result = buildBriefing(stories, prefs({ minutes: 0 }), NOW);
  assert.equal(result.items.length, 12);
  assert.equal(result.items.filter(item => item.depth === 'full').length, 3);
});

test('tone: the calmest end hides even moderately tense stories, the far end ranks intense news first', () => {
  const tense = story({ intensity: 3, importance: 3 });
  const quiet = story({ intensity: 1, importance: 3 });
  assert.deepEqual(ids(buildBriefing([tense, quiet], prefs({ dials: dl({ tone: 0 }), minutes: 0 }), NOW).items), [quiet.id]);
  const heavy = story({ intensity: 5, importance: 3 });
  const first = buildBriefing([quiet, heavy], prefs({ dials: dl({ tone: 4 }), minutes: 0 }), NOW).items[0];
  assert.equal(first.story.id, heavy.id);
  const calmFirst = buildBriefing([quiet, heavy], prefs({ dials: dl({ tone: 2 }), minutes: 0 }), NOW).items[0];
  assert.equal(calmFirst.story.id, quiet.id);
});

test('tone never hides the important: at the calmest setting a heavy big story is a calm rewrite', () => {
  const big = story({ intensity: 5, importance: 5 });
  const result = buildBriefing([big], prefs({ dials: dl({ tone: 0 }), minutes: 0 }), NOW);
  assert.deepEqual(result.items.map(item => item.tone), ['calm']);
});

test('density: the sparse end shows few stories in depth, the dense end shows many headlines', () => {
  const stories = Array.from({ length: 30 }, (_, i) => story({ importance: 1 + (i % 5) }));
  const dense = buildBriefing(stories, prefs({ dials: dl({ density: 0 }), minutes: 0 }), NOW);
  assert.ok(dense.items.every(item => item.depth === 'headline'));
  assert.equal(dense.items.length, 30);
  const sparse = buildBriefing(stories, prefs({ dials: dl({ density: 4 }), minutes: 0 }), NOW);
  assert.ok(sparse.items.length <= 10);
  assert.ok(sparse.items.every(item => item.depth === 'full'));
  assert.equal(sparse.items.length + sparse.overflow.length, 30);
});

test('density steps a story down a level instead of dropping it when time is short', () => {
  const timing = { readSec: { headline: 4, short: 30, full: 50 } };
  const result = buildBriefing([story(timing), story(timing)], prefs({ dials: dl({ density: 4 }), minutes: 1 }), NOW);
  assert.deepEqual(result.items.map(item => item.depth), ['full', 'headline']);
  assert.ok(result.usedSec <= 60);
});

test('prominence: the strict end moves small stories to "more stories" without losing them', () => {
  const stories = [story({ importance: 5 }), story({ importance: 4 }), story({ importance: 2 }), story({ importance: 1 })];
  const strict = buildBriefing(stories, prefs({ dials: dl({ prominence: 4 }), minutes: 0 }), NOW);
  assert.deepEqual(strict.items.map(item => item.story.importance), [5, 4]);
  assert.deepEqual(strict.overflow.map(item => item.story.importance), [2, 1]);
  const open = buildBriefing(stories, prefs({ dials: dl({ prominence: 0 }), minutes: 0 }), NOW);
  assert.equal(open.items.length, 4);
});

test('prominence: a followed topic is not pushed down to "more stories"', () => {
  const small = story({ importance: 1, topics: ['economy'], primaryTopic: 'economy' });
  const result = buildBriefing([small], prefs({ dials: dl({ prominence: 4 }), topics: { economy: 'follow' }, minutes: 0 }), NOW);
  assert.equal(result.items.length, 1);
});

test('focus: the strict end holds back topics the reader did not follow, the open end spreads topics out', () => {
  const followed = story({ importance: 3, topics: ['economy'], primaryTopic: 'economy' });
  const other = story({ importance: 3 });
  const p = prefs({ topics: { economy: 'follow' } });
  assert.ok(scoreStory(other, { ...p, dials: dl({ focus: 0 }) }, NOW) < scoreStory(other, { ...p, dials: dl({ focus: 2 }) }, NOW));
  assert.ok(scoreStory(followed, { ...p, dials: dl({ focus: 0 }) }, NOW) > scoreStory(followed, { ...p, dials: dl({ focus: 4 }) }, NOW));
  const sameTopic = Array.from({ length: 4 }, () => story({ importance: 4 }));
  const diverse = [story({ importance: 3, topics: ['world'], primaryTopic: 'world' }), ...sameTopic];
  const spread = buildBriefing(diverse, prefs({ dials: dl({ focus: 4 }), minutes: 0 }), NOW).items;
  assert.ok(spread.slice(0, 4).some(item => item.story.primaryTopic === 'world'));
  const clustered = buildBriefing(diverse, prefs({ dials: dl({ focus: 2 }), minutes: 0 }), NOW).items;
  assert.equal(clustered[clustered.length - 1].story.primaryTopic, 'world');
});

test('freshness: the fresh end lifts new stories over bigger old ones, the other end ignores age', () => {
  const old = story({ importance: 4, publishedAt: new Date(NOW - 20 * 3_600_000).toISOString() });
  const fresh = story({ importance: 3, publishedAt: new Date(NOW - 10 * 60_000).toISOString() });
  const order = freshness => ids(buildBriefing([old, fresh], prefs({ dials: dl({ freshness }), minutes: 0 }), NOW).items)[0];
  assert.equal(order(0), fresh.id);
  assert.equal(order(4), old.id);
});

test('the seen record marks stories that are new or have changed since the reader last read', () => {
  const a = story({ updatedAt: '2026-11-01T10:00:00Z' });
  const b = story({ updatedAt: '2026-11-01T11:00:00Z' });
  const c = story({ updatedAt: '2026-11-01T09:00:00Z' });
  const seen = new Map([[a.id, '2026-11-01T10:00:00Z'], [b.id, '2026-11-01T08:00:00Z']]);
  const result = buildBriefing([a, b, c], prefs({ minutes: 0 }), NOW, { seen });
  const change = id => result.items.find(item => item.story.id === id).change;
  assert.equal(change(a.id), null);
  assert.equal(change(b.id), 'updated');
  assert.equal(change(c.id), 'new');
  assert.equal(result.changed, 2);
  assert.equal(buildBriefing([a], prefs({ minutes: 0 }), NOW).items[0].change, null);
});

test('every preset produces a brief that accounts for all stories', () => {
  const stories = Array.from({ length: 25 }, (_, i) => story({ importance: 1 + (i % 5), intensity: 1 + ((i * 2) % 5) }));
  for (const preset of PRESETS) {
    const result = buildBriefing(stories, prefs({ dials: preset.dials, minutes: 5 }), NOW);
    assert.equal(result.items.length + result.overflow.length + result.filtered.length + result.muted.length, 25, preset.id);
    assert.ok(result.items.length > 0, preset.id);
  }
});

test('important stories left out of the brief are always named, never silently lost', () => {
  const timing = { readSec: { headline: 4, short: 40, full: 80, calm: 10 } };
  const stories = [story({ importance: 5, ...timing }), story({ importance: 4, ...timing }), story({ importance: 2, ...timing })];
  const tight = buildBriefing(stories, prefs({ dials: dl({ density: 3 }), minutes: 1 }), NOW);
  const shown = new Set(tight.items.map(item => item.story.id));
  for (const s of stories.filter(x => x.importance >= 4)) {
    assert.ok(shown.has(s.id) || tight.missedImportant.some(m => m.id === s.id), 'important story accounted for');
  }
  assert.ok(tight.missedImportant.every(m => m.importance >= 4));
  const muted = story({ importance: 4, topics: ['sports'], primaryTopic: 'sports' });
  assert.deepEqual(buildBriefing([muted], prefs({ topics: { sports: 'mute' }, minutes: 0 }), NOW).missedImportant.map(m => m.id), [muted.id]);
});
