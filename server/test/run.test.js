const test = require('node:test');
const assert = require('node:assert/strict');
const { runPipeline } = require('../src/pipeline/run');
const { tempStore, silent, fakeAi, fakeParser, item } = require('./helpers');

const NOW = new Date('2026-11-01T12:00:00Z');
const minutesAgo = m => new Date(NOW.getTime() - m * 60_000).toISOString();

const SOURCES = [
    { id: 'a', name: 'A', url: 'http://feed/a', lang: 'he', lean: 'left', kind: 'publisher' },
    { id: 'b', name: 'B', url: 'http://feed/b', lang: 'he', lean: 'right', kind: 'publisher' },
    { id: 'c', name: 'C', url: 'http://feed/c', lang: 'he', lean: null, kind: 'publisher' },
];

// Titles carry an event marker like [E1]; the fake model groups by marker.
const post = (marker, n, minutes = 10) => item({ title: `[${marker}] דיווח ${n}`, link: `https://x.com/${marker}/${n}`, isoDate: minutesAgo(minutes) });

function feeds(map) {
    return fakeParser(Object.fromEntries(Object.entries(map).map(([id, items]) => [`http://feed/${id}`, { items }])));
}

function makeAi(overrides = {}) {
    return fakeAi({
        group_items: ({ user }) => {
            const byMarker = new Map();
            user.split('\n').slice(1).forEach(line => {
                const [id, , title] = line.split('|');
                const marker = /\[(E\d+)\]/.exec(title)[1];
                byMarker.set(marker, [...(byMarker.get(marker) || []), Number(id)]);
            });
            return { groups: [...byMarker.values()] };
        },
        publish_story: ({ user }) => {
            const marker = /\[(E\d+)\]/.exec(user)[1];
            return { headline: `סיפור ${marker}`, oneLiner: `תקציר ${marker}`, bullets: [`פרט ${marker}`], calmSummary: `סיכום רגוע ${marker}`, topics: ['politics'], intensity: 2, importance: 3, sourceHeat: 2, graphic: false };
        },
        ...overrides,
    });
}

function deps(over = {}) {
    const store = over.store || tempStore();
    return { store, ai: makeAi(), parser: feeds({ a: [post('E1', 1), post('E2', 2)], b: [post('E1', 3)], c: [] }), sources: SOURCES, fetchMeta: async () => ({ image: 'https://img.example/x.jpg', excerpt: 'קטע מהכתבה' }), logger: silent, now: () => NOW, ...over };
}

test('first run groups the same event across outlets and publishes scored stories', async () => {
    const d = deps();
    const run = await runPipeline(d);
    const { stories, generatedAt } = d.store.read('stories.json');

    assert.equal(run.ok, true);
    assert.equal(generatedAt, NOW.toISOString());
    assert.equal(stories.length, 2);
    const e1 = stories.find(s => s.headline === 'סיפור E1');
    assert.equal(e1.sources.length, 2);
    assert.equal(e1.coverage.counts.left, 1);
    assert.equal(e1.coverage.counts.right, 1);
    assert.equal(e1.coverage.blindspot, null);
    assert.equal(e1.primaryTopic, 'politics');
    assert.equal(e1.image, 'https://img.example/x.jpg');
    assert.ok(e1.readSec.headline < e1.readSec.short && e1.readSec.short < e1.readSec.full);
    assert.ok(e1.id && e1.firstSeenAt);
    assert.deepEqual(run.counts, { items: 3, clusters: 2, enriched: 2, failed: 0, reused: 0, deferred: 0, published: 2 });
    assert.equal(run.usage.calls, 3);
    assert.equal(d.store.read('meta.json').lastSuccessAt, NOW.toISOString());
});

test('an identical second run reuses every story: same ids, no new write-ups', async () => {
    const d = deps();
    await runPipeline(d);
    const before = d.store.read('stories.json').stories.map(s => s.id).sort();
    const writeUps = d.ai.count('publish_story');

    const run = await runPipeline(d);
    const after = d.store.read('stories.json').stories.map(s => s.id).sort();
    assert.deepEqual(after, before);
    assert.equal(d.ai.count('publish_story'), writeUps);
    assert.equal(run.counts.reused, 2);
    assert.equal(run.counts.enriched, 0);
});

test('a new outlet joining a story keeps its id and refreshes the write-up once', async () => {
    const d = deps();
    await runPipeline(d);
    const original = d.store.read('stories.json').stories.find(s => s.headline === 'סיפור E1');
    const writeUps = d.ai.count('publish_story');

    d.parser = feeds({ a: [post('E1', 1), post('E2', 2)], b: [post('E1', 3)], c: [post('E1', 4, 3)] });
    await runPipeline(d);
    const updated = d.store.read('stories.json').stories.find(s => s.headline === 'סיפור E1');
    assert.equal(updated.id, original.id);
    assert.equal(updated.sources.length, 3);
    assert.equal(updated.firstSeenAt, original.firstSeenAt);
    assert.equal(d.ai.count('publish_story'), writeUps + 1);
});

test('when every feed fails the previous feed is kept and the run is marked failed', async () => {
    const d = deps();
    await runPipeline(d);
    const before = d.store.read('stories.json');

    d.parser = feeds({});
    const run = await runPipeline(d);
    assert.equal(run.ok, false);
    assert.match(run.error, /no items/);
    assert.deepEqual(d.store.read('stories.json'), before);
    assert.equal(d.store.read('meta.json').lastSuccessAt, NOW.toISOString());
    assert.equal(d.store.read('meta.json').lastRun.ok, false);
});

test('one failed write-up does not stop the others, and the older version is kept if there is one', async () => {
    const d = deps({ ai: makeAi({ publish_story: ({ user }) => { if (user.includes('[E2]')) throw new Error('overloaded'); return { headline: 'סיפור E1', oneLiner: 'x', bullets: [], calmSummary: 'x', topics: ['politics'], intensity: 1, importance: 1, sourceHeat: 1, graphic: false }; } }) });
    const run = await runPipeline(d);
    assert.equal(run.counts.failed, 1);
    assert.deepEqual(d.store.read('stories.json').stories.map(s => s.headline), ['סיפור E1']);
});

test('if the grouping model fails the run still publishes using the fallback grouping', async () => {
    const d = deps({ ai: makeAi({ group_items: () => { throw new Error('down'); } }) });
    const run = await runPipeline(d);
    assert.equal(run.ok, true);
    assert.ok(d.store.read('stories.json').stories.length >= 1);
});

test('maxEnrich caps the model work per run', async () => {
    const d = deps({ limits: { maxEnrich: 1 } });
    const run = await runPipeline(d);
    assert.equal(run.counts.enriched, 1);
    assert.equal(run.counts.deferred, 1);
    assert.equal(d.store.read('stories.json').stories.length, 1);
});

test('article pages are fetched once and cached between runs', async () => {
    let fetches = 0;
    const d = deps({ fetchMeta: async () => { fetches += 1; return { image: null, excerpt: 'קטע' }; } });
    await runPipeline(d);
    const first = fetches;
    assert.ok(first >= 1);
    d.parser = feeds({ a: [post('E1', 1), post('E2', 2)], b: [post('E1', 3)], c: [post('E1', 4, 3)] });
    await runPipeline(d);
    assert.equal(fetches, first + 1); // only the one new article
});

test('stories older than the retention window are dropped', async () => {
    const d = deps();
    await runPipeline(d);
    d.parser = feeds({ a: [], b: [], c: [post('E9', 9, 1)] });
    const later = new Date(NOW.getTime() + 49 * 3_600_000);
    d.now = () => later;
    // E9 is dated relative to NOW, so make it fresh relative to `later`
    d.parser = feeds({ c: [item({ title: '[E9] דיווח', link: 'https://x.com/E9', isoDate: later.toISOString() })] });
    await runPipeline(d);
    assert.deepEqual(d.store.read('stories.json').stories.map(s => s.headline), ['סיפור E9']);
});

test('a story whose articles were merged into another story is retired, not duplicated', async () => {
    const d = deps();
    await runPipeline(d);
    assert.equal(d.store.read('stories.json').stories.length, 2);

    d.ai.handlers.group_items = ({ user }) => ({ groups: [user.split('\n').slice(1).map(line => Number(line.split('|')[0]))] });
    await runPipeline(d);
    assert.equal(d.store.read('stories.json').stories.length, 1);
    assert.equal(d.store.read('stories.json').stories[0].sources.length, 3);
});

test('a one-sided political story is flagged as a blind spot', async () => {
    const d = deps({ parser: feeds({ a: [], b: [post('E1', 1), post('E1', 2)], c: [] }) });
    await runPipeline(d);
    assert.equal(d.store.read('stories.json').stories[0].coverage.blindspot, 'left');
});
