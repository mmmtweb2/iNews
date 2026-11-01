const test = require('node:test');
const assert = require('node:assert/strict');
const { clusterItems, overlapGroups, sanitizeGroups } = require('../src/pipeline/cluster');
const { fakeAi, silent } = require('./helpers');

const make = (key, title, extra = {}) => ({ key, title, sourceId: key, sourceName: key.toUpperCase(), lang: 'he', publishedAt: '2026-11-01T10:00:00Z', ...extra });

test('sanitizeGroups drops invalid and repeated ids and adds leftovers as singletons', () => {
    assert.deepEqual(sanitizeGroups([[0, 1], [1, 2], [9], 'x'], 4), [[0, 1], [2], [3]]);
    assert.deepEqual(sanitizeGroups(undefined, 2), [[0], [1]]);
});

test('model groups become clusters of the original items', async () => {
    const items = [make('a', 'ועדה אישרה חוק חדש'), make('b', 'החוק החדש אושר בוועדה'), make('c', 'משחק כדורגל הערב')];
    const ai = fakeAi({ group_items: () => ({ groups: [[0, 1], [2]] }) });
    const clusters = await clusterItems({ items, ai, logger: silent });
    assert.deepEqual(clusters.map(c => c.map(i => i.key)), [['a', 'b'], ['c']]);
});

test('identical long titles are merged without relying on the model', async () => {
    const items = [make('a', 'ועדה אישרה חוק חדש היום'), make('b', 'ועדה אישרה חוק חדש היום!')];
    const ai = fakeAi({ group_items: () => ({ groups: [[0]] }) });
    const clusters = await clusterItems({ items, ai, logger: silent });
    assert.equal(clusters.length, 1);
    assert.equal(clusters[0].length, 2);
});

test('falls back to token-overlap grouping when the model call fails', async () => {
    const items = [
        make('a', 'ממשלת בריטניה הודיעה על תוכנית חדשה לתחבורה ציבורית'),
        make('b', 'בריטניה: תוכנית חדשה לתחבורה ציבורית הוכרזה בממשלה'),
        make('c', 'נבחרת הכדורסל ניצחה בגמר הטורניר'),
    ];
    const ai = fakeAi({ group_items: () => { throw new Error('overloaded'); } });
    const clusters = await clusterItems({ items, ai, logger: silent });
    const sizes = clusters.map(c => c.length).sort();
    assert.deepEqual(sizes, [1, 2]);
});

test('overlap grouping never merges across languages', () => {
    const reps = [[make('a', 'Government unveils new transport plan', { lang: 'en' })], [make('b', 'Government unveils new transport plan', { lang: 'he' })]];
    assert.equal(overlapGroups(reps).length, 2);
});

test('a suspiciously large model group is split again by overlap', async () => {
    const items = Array.from({ length: 12 }, (_, i) => make(`k${i}`, `נושא${i}א נושא${i}ב נושא${i}ג נושא${i}ד`));
    const ai = fakeAi({ group_items: () => ({ groups: [items.map((_, i) => i)] }) });
    const clusters = await clusterItems({ items, ai, logger: silent });
    assert.ok(clusters.length > 1);
    assert.equal(clusters.flat().length, 12);
});
