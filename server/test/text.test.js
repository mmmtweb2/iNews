const test = require('node:test');
const assert = require('node:assert/strict');
const { stripHtml, readSeconds, normalizeUrl, normalizeTitle, truncate, mapPool, wordCount } = require('../src/lib/text');

test('stripHtml removes tags, scripts and decodes common entities', () => {
    assert.equal(stripHtml('<p>שלום&nbsp;<b>עולם</b> &amp; כולם</p><script>alert(1)</script>'), 'שלום עולם & כולם');
});

test('wordCount counts Hebrew and Latin words and numbers', () => {
    assert.equal(wordCount('ביבי הגיע ל-3 פגישות, said Bob'), 7);
});

test('readSeconds is about 200 words per minute, plus overhead', () => {
    const text = Array(33).fill('מילה').join(' ');
    assert.equal(readSeconds(text), 10);
    assert.equal(readSeconds(text, 2), 12);
    assert.equal(readSeconds(''), 1);
});

test('normalizeUrl removes tracking, hash and trailing slash and rejects non-http', () => {
    assert.equal(normalizeUrl('https://a.com/x/?utm_source=t&id=5#frag'), 'https://a.com/x/?id=5');
    assert.equal(normalizeUrl('https://a.com/x/'), 'https://a.com/x');
    assert.equal(normalizeUrl('ftp://a.com/x'), null);
    assert.equal(normalizeUrl('not a url'), null);
});

test('normalizeTitle ignores niqqud, case and punctuation', () => {
    assert.equal(normalizeTitle('  שָׁלוֹם, עולם!  '), 'שלום עולם');
    assert.equal(normalizeTitle('Hello, WORLD'), 'hello world');
});

test('truncate shortens with an ellipsis', () => {
    assert.equal(truncate('abcdef', 4), 'abc…');
    assert.equal(truncate('abc', 4), 'abc');
    assert.equal(truncate(undefined, 4), '');
});

test('mapPool respects the concurrency limit and captures errors per item', async () => {
    let active = 0;
    let peak = 0;
    const results = await mapPool([1, 2, 3, 4, 5, 6], 2, async n => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise(resolve => setTimeout(resolve, 5));
        active -= 1;
        if (n === 3) throw new Error('boom');
        return n * 2;
    });
    assert.equal(peak, 2);
    assert.deepEqual(results.map(r => r.value), [2, 4, undefined, 8, 10, 12]);
    assert.equal(results[2].error.message, 'boom');
});
