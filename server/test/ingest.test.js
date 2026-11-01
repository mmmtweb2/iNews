const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchFeeds } = require('../src/pipeline/ingest');
const { fakeParser, item } = require('./helpers');

const now = new Date('2026-11-01T12:00:00Z');
const minutesAgo = m => new Date(now.getTime() - m * 60_000).toISOString();

const sources = [
    { id: 'a', name: 'A', url: 'http://feed/a', lang: 'he', lean: 'left', kind: 'publisher' },
    { id: 'b', name: 'B', url: 'http://feed/b', lang: 'he', lean: 'right', kind: 'publisher' },
    { id: 'gn', name: 'Google News', url: 'http://feed/gn', lang: 'he', lean: null, kind: 'aggregator' },
];

test('normalizes items, applies the age window, sorts newest first and caps per source', async () => {
    const parser = fakeParser({
        'http://feed/a': { items: [
            item({ title: 'ישן מאוד', link: 'https://a.com/old', isoDate: minutesAgo(60 * 50) }),
            item({ title: 'שני', link: 'https://a.com/2?utm_source=x', isoDate: minutesAgo(30) }),
            item({ title: 'ראשון', link: 'https://a.com/1', isoDate: minutesAgo(5) }),
            item({ title: 'שלישי', link: 'https://a.com/3', isoDate: minutesAgo(90) }),
        ] },
        'http://feed/b': { items: [] },
        'http://feed/gn': { items: [] },
    });
    const { items, health } = await fetchFeeds({ sources, parser, now, perSourceLimit: 2 });
    assert.deepEqual(items.map(i => i.title), ['ראשון', 'שני']);
    assert.equal(items[1].url, 'https://a.com/2');
    assert.equal(items[0].lean, 'left');
    assert.equal(items[0].sourceId, 'a');
    assert.deepEqual(health.map(h => [h.id, h.ok, h.count]), [['a', true, 2], ['b', true, 0], ['gn', true, 0]]);
});

test('a failing source is reported but does not stop the others', async () => {
    const parser = fakeParser({ 'http://feed/a': { items: [item({ link: 'https://a.com/1', isoDate: minutesAgo(5) })] } });
    const { items, health } = await fetchFeeds({ sources, parser, now });
    assert.equal(items.length, 1);
    const failed = health.filter(h => !h.ok);
    assert.equal(failed.length, 2);
    assert.match(failed[0].error, /feed down/);
});

test('the same article and repeated titles from one source are deduplicated', async () => {
    const parser = fakeParser({
        'http://feed/a': { items: [
            item({ title: 'כותרת זהה', link: 'https://a.com/1', isoDate: minutesAgo(5) }),
            item({ title: 'כותרת זהה', link: 'https://a.com/2', isoDate: minutesAgo(6) }),
            item({ title: 'אחרת', link: 'https://a.com/1#frag', isoDate: minutesAgo(7) }),
        ] },
    });
    const { items } = await fetchFeeds({ sources, parser, now });
    assert.equal(items.length, 1);
});

test('aggregator items take the real publisher, lose the title suffix and are unrated', async () => {
    const parser = fakeParser({
        'http://feed/gn': { items: [item({ title: 'כותרת חדשה - ידיעות', link: 'https://news.google.com/x', source: { _: 'ידיעות', $: { url: 'https://y.com' } }, isoDate: minutesAgo(5), contentSnippet: 'רשימת כותרות קשורות' })] },
    });
    const { items } = await fetchFeeds({ sources, parser, now });
    assert.equal(items[0].title, 'כותרת חדשה');
    assert.equal(items[0].sourceName, 'ידיעות');
    assert.equal(items[0].lean, null);
    assert.equal(items[0].aggregated, true);
    assert.equal(items[0].snippet, '');
});

test('items without a usable link or title are skipped, and a missing date counts as now', async () => {
    const parser = fakeParser({
        'http://feed/a': { items: [item({ title: '', link: 'https://a.com/1' }), item({ title: 'בלי קישור', link: 'javascript:alert(1)' }), item({ title: 'בלי תאריך', link: 'https://a.com/3', isoDate: undefined, pubDate: undefined })] },
    });
    const { items } = await fetchFeeds({ sources, parser, now });
    assert.deepEqual(items.map(i => i.title), ['בלי תאריך']);
    assert.equal(items[0].publishedAt, now.toISOString());
});
