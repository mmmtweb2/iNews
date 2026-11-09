const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDemoStories } = require('../demo/seed');
const { TOPIC_IDS } = require('../src/config/topics');

const stories = buildDemoStories(new Date('2026-11-01T12:00:00Z'));

test('demo stories follow the production story schema', () => {
    assert.equal(new Set(stories.map(s => s.id)).size, stories.length);
    for (const s of stories) {
        assert.ok(s.headline && s.calmSummary, s.id);
        assert.ok(s.topics.length >= 1 && s.topics.every(t => TOPIC_IDS.has(t)), s.id);
        assert.equal(s.primaryTopic, s.topics[0]);
        for (const field of ['intensity', 'importance', 'sourceHeat']) assert.ok(s[field] >= 1 && s[field] <= 5, `${s.id} ${field}`);
        assert.ok(s.sources.length >= 1);
        assert.ok(s.readSec.headline > 0 && s.readSec.short >= s.readSec.headline && s.readSec.full >= s.readSec.short && s.readSec.calm > 0, s.id);
        assert.equal(s.coverage.sourceCount, new Set(s.sources.map(x => x.id)).size);
    }
});

test('demo stories are newest first', () => {
    const times = stories.map(s => Date.parse(s.publishedAt));
    assert.deepEqual([...times].sort((a, b) => b - a), times);
});

test('demo data covers every state the interface has to handle', () => {
    assert.ok(stories.some(s => s.coverage.blindspot === 'left'), 'blind spot (left)');
    assert.ok(stories.some(s => s.coverage.blindspot === 'right'), 'blind spot (right)');
    assert.ok(stories.some(s => s.graphic), 'graphic');
    assert.ok(stories.some(s => s.contested), 'contested');
    assert.ok(stories.some(s => s.framing.length >= 2), 'framing');
    assert.ok(stories.some(s => s.sourceHeat >= s.intensity + 2), 'inflated headline');
    assert.ok(stories.some(s => s.intensity >= 4 && s.importance >= 4), 'heavy but important');
    assert.ok(stories.some(s => s.intensity >= 4 && s.importance < 4), 'heavy and minor');
    assert.ok(stories.some(s => s.importance === 5), 'top importance');
    assert.ok(stories.some(s => s.sources.length === 1), 'single source');
    const topics = new Set(stories.map(s => s.primaryTopic));
    assert.equal(topics.size, TOPIC_IDS.size);
});

const { applyRefreshWave, createDemoRun } = require('../demo/seed');
const { tempStore: tmp } = require('./helpers');

test('a demo refresh updates one story and adds follow-ups that share entities with earlier stories', async () => {
    const store = tmp();
    const t0 = new Date('2026-11-01T12:00:00Z');
    store.write('stories.json', { generatedAt: t0.toISOString(), stories: buildDemoStories(t0, 1) });
    const before = store.read('stories.json').stories;

    const phases = [];
    const t1 = new Date('2026-11-01T12:30:00Z');
    const run = createDemoRun(store, { delayMs: 30, now: () => t1 });
    assert.deepEqual(await run(p => phases.push(p.phase)), { ok: true });
    assert.ok(phases.includes('ingest') && phases.includes('enrich'));

    const after = store.read('stories.json').stories;
    assert.equal(after.length, before.length + 4);
    assert.equal(new Set(after.map(s => s.id)).size, after.length);

    const strikeBefore = before.find(s => s.headline.startsWith('שביתה במפעל'));
    const strikeAfter = after.find(s => s.id === strikeBefore.id);
    assert.match(strikeAfter.headline, /הסתיימה/);
    assert.equal(strikeAfter.updatedAt, t1.toISOString());

    const rate = before.find(s => s.entities.includes('ריבית'));
    const followUp = after.find(s => s.id === 'demo-f-01');
    assert.ok(followUp.entities.includes('ריבית'));
    assert.equal(followUp.firstSeenAt, t1.toISOString());
    assert.ok(rate);
});

test('running the demo refresh twice does not duplicate follow-ups', async () => {
    const store = tmp();
    const t0 = new Date('2026-11-01T12:00:00Z');
    store.write('stories.json', { generatedAt: t0.toISOString(), stories: buildDemoStories(t0, 1) });
    const run = createDemoRun(store, { delayMs: 6 });
    await run(() => {});
    const n = store.read('stories.json').stories.length;
    await run(() => {});
    assert.equal(store.read('stories.json').stories.length, n);
});

test('demo stories carry known / claimed / unknown, and the updated story has a two-step timeline', () => {
  const t0 = new Date('2026-11-01T12:00:00Z');
  const wave1 = buildDemoStories(t0, 1);
  const party = wave1.find(s => s.entities.includes('ועדת חוקה'));
  assert.ok(party.known.length && party.claimed.length && party.unknown.length);
  const wave2 = buildDemoStories(t0, 2);
  const strike = wave2.find(s => s.headline.startsWith('השביתה במפעל הסתיימה'));
  assert.equal(strike.timeline.length, 2);
  assert.equal(strike.timeline[0].headline.startsWith('שביתה במפעל'), true);
  assert.ok(strike.whatsNew);
});
