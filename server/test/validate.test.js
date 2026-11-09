const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeEnrichment, ungroundedNumbers, numberTokens } = require('../src/pipeline/validate');

const members = [
    { title: 'כוחות הביטחון עצרו 14 חשודים בחברון', sourceId: 'a', sourceName: 'A' },
    { title: 'פעילות לילית בעיר', sourceId: 'b', sourceName: 'B' },
];
const corpus = 'כוחות הביטחון עצרו 14 חשודים בחברון. נתפסו 1,200 פריטים. 2026-11-01T10:00:00Z';
const base = { headline: 'עצורים בחברון', oneLiner: 'נעצרו 14 חשודים', bullets: ['נתפסו 1200 פריטים'], calmSummary: 'נעצרו חשודים', topics: ['security'], intensity: 3, importance: 3, sourceHeat: 3, graphic: false };

const clean = (overrides, extra = {}) => sanitizeEnrichment({ ...base, ...overrides }, { members, corpus, ...extra });

test('numberTokens strips thousands separators', () => {
    assert.deepEqual(numberTokens('1,200 ו-3.5 ו-14'), ['1200', '3.5', '14']);
});

test('only larger or decimal numbers are checked', () => {
    const allowed = new Set(['14']);
    assert.deepEqual(ungroundedNumbers('3 נעצרו, 14 נפצעו', allowed), []);
    assert.deepEqual(ungroundedNumbers('250 נעצרו', allowed), ['250']);
    assert.deepEqual(ungroundedNumbers('2.5 מיליון', allowed), ['2.5']);
});

test('grounded numbers pass, including across thousands separators', () => {
    const result = clean({});
    assert.deepEqual(result.bullets, ['נתפסו 1200 פריטים']);
    assert.equal(result.oneLiner, 'נעצרו 14 חשודים');
});

test('a bullet with a number the sources never mention is dropped', () => {
    const result = clean({ bullets: ['נתפסו 1200 פריטים', 'נגרם נזק של 250 מיליון'] });
    assert.deepEqual(result.bullets, ['נתפסו 1200 פריטים']);
});

test('a headline with an invented number falls back to the original source title', () => {
    const result = clean({ headline: 'נעצרו 90 חשודים בחברון' });
    assert.equal(result.headline, members[0].title);
});

test('oneLiner and calmSummary fall back when they contain invented numbers', () => {
    const result = clean({ oneLiner: 'נעצרו 77 חשודים', calmSummary: 'נעצרו 77 חשודים' });
    assert.equal(result.oneLiner, 'נתפסו 1200 פריטים');
    assert.equal(result.calmSummary, 'נתפסו 1200 פריטים');
});

test('bullets that repeat the headline or each other are removed and capped at four', () => {
    const result = clean({ headline: 'כותרת', bullets: ['כותרת', 'א', 'א', 'ב', 'ג', 'ד', 'ה'] });
    assert.deepEqual(result.bullets, ['א', 'ב', 'ג', 'ד']);
});

test('unknown topics are removed and a default is applied when none remain', () => {
    assert.deepEqual(clean({ topics: ['security', 'nonsense', 'security'] }).topics, ['security']);
    assert.deepEqual(clean({ topics: ['nonsense'] }).topics, ['society']);
    assert.deepEqual(clean({ topics: [] }, { defaultTopic: 'tech' }).topics, ['tech']);
});

test('scores are clamped and defaulted', () => {
    const result = clean({ intensity: 9, importance: -4, sourceHeat: 'x' });
    assert.equal(result.intensity, 5);
    assert.equal(result.importance, 1);
    assert.equal(result.sourceHeat, 5);
});

test('graphic content cannot be rated below intensity 4', () => {
    const result = clean({ intensity: 2, graphic: true });
    assert.equal(result.intensity, 4);
    assert.equal(result.graphic, true);
});

test('framing keeps only valid, unique, grounded notes and maps indexes to sources', () => {
    const result = clean({
        framing: [
            { n: 0, note: 'מדגיש את מספר העצורים' },
            { n: 0, note: 'כפילות' },
            { n: 7, note: 'אינדקס לא קיים' },
            { n: 1, note: 'מדגיש 999 נפגעים' },
            { n: 1, note: 'מתמקד בפעילות הלילית' },
        ],
    });
    assert.deepEqual(result.framing, [
        { sourceId: 'a', source: 'A', note: 'מדגיש את מספר העצורים' },
        { sourceId: 'b', source: 'B', note: 'מתמקד בפעילות הלילית' },
    ]);
});

test('framing is ignored for a single-source story', () => {
    const result = sanitizeEnrichment({ ...base, framing: [{ n: 0, note: 'הערה' }] }, { members: [members[0]], corpus });
    assert.deepEqual(result.framing, []);
});

test('non-object input is rejected', () => {
    assert.equal(sanitizeEnrichment(null, { members, corpus }), null);
    assert.equal(sanitizeEnrichment('x', { members, corpus }), null);
});

test('known / claimed / unknown are grounded, capped, and "known" needs two articles', () => {
    const result = clean({
        known: ['נעצרו 14 חשודים', 'נעצרו 999 חשודים', 'נעצרו 14 חשודים'],
        claimed: ['לפי הצבא, נתפסו כלי נשק', 'לפי הארגון נפצעו 4,000', 'א', 'ב', 'ג'],
        unknown: ['לא ידוע מי עמד מאחורי הפעולה', 7, ''],
    });
    assert.deepEqual(result.known, ['נעצרו 14 חשודים']);
    assert.ok(result.claimed.includes('לפי הצבא, נתפסו כלי נשק'));
    assert.ok(!result.claimed.some(text => text.includes('4,000')));
    assert.ok(result.claimed.length <= 3);
    assert.deepEqual(result.unknown, ['לא ידוע מי עמד מאחורי הפעולה']);

    const single = sanitizeEnrichment({ ...base, known: ['נעצרו 14 חשודים'], claimed: ['לפי הצבא, נעצרו 14 חשודים'] }, { members: [members[0]], corpus });
    assert.deepEqual(single.known, []);
    assert.equal(single.claimed.length, 1);
});

test('missing lists default to empty, and an ungrounded whatsNew is dropped', () => {
    const plain = clean({});
    assert.deepEqual([plain.known, plain.claimed, plain.unknown, plain.whatsNew], [[], [], [], '']);
    assert.equal(clean({ whatsNew: 'נעצרו עוד 14 חשודים' }).whatsNew, 'נעצרו עוד 14 חשודים');
    assert.equal(clean({ whatsNew: 'מספר העצורים עלה ל-480' }).whatsNew, '');
});
