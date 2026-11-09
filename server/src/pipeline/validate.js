const { TOPIC_IDS } = require('../config/topics');
const { truncate, normalizeTitle } = require('../lib/text');

// Guards between the model and the public feed. The model is asked not to invent
// facts, but nothing here relies on that: every number it writes must also appear
// in the source material, scores are clamped, and links/topics are checked.

const NUMBER = /\d+(?:[.,]\d+)*/g;

function numberTokens(text) {
    return (String(text || '').match(NUMBER) || []).map(token => token.replace(/,/g, ''));
}

// Small whole numbers are often spelled out in Hebrew ("שלושה") in the source and
// digits in the summary, so only larger or decimal numbers are verified.
function isCheckable(token) {
    return token.includes('.') || Number(token) > 10;
}

function ungroundedNumbers(text, allowed) {
    return numberTokens(text).filter(token => isCheckable(token) && !allowed.has(token));
}

function clampInt(value, min, max, fallback) {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function uniqueStrings(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    const out = [];
    for (const entry of value) {
        if (typeof entry !== 'string') continue;
        const text = entry.trim();
        const key = normalizeTitle(text);
        if (!text || seen.has(key)) continue;
        seen.add(key);
        out.push(text);
    }
    return out;
}

// `members` are the articles shown to the model (framing indexes refer to them).
// `corpus` is all the text the model saw, including dates.
function sanitizeEnrichment(raw, { members, corpus, defaultTopic = 'society' }) {
    if (!raw || typeof raw !== 'object' || !members.length) return null;

    const allowed = new Set(numberTokens(corpus));
    const grounded = text => ungroundedNumbers(text, allowed).length === 0;

    let headline = truncate(raw.headline, 120);
    if (!headline || !grounded(headline)) headline = truncate(members[0].title, 120);
    if (!headline) return null;

    const bullets = uniqueStrings(raw.bullets)
        .map(text => truncate(text, 220))
        .filter(grounded)
        .filter(text => normalizeTitle(text) !== normalizeTitle(headline))
        .slice(0, 4);

    let oneLiner = truncate(raw.oneLiner, 220);
    if (!oneLiner || !grounded(oneLiner)) oneLiner = bullets[0] || '';

    let calmSummary = truncate(raw.calmSummary, 360);
    if (!calmSummary || !grounded(calmSummary)) calmSummary = oneLiner || headline;

    let whyItMatters = truncate(raw.whyItMatters, 200);
    if (!grounded(whyItMatters)) whyItMatters = '';

    let contested = truncate(raw.contested, 240);
    if (!grounded(contested)) contested = '';

    const topics = [...new Set((Array.isArray(raw.topics) ? raw.topics : []).filter(id => TOPIC_IDS.has(id)))].slice(0, 3);
    if (!topics.length) topics.push(TOPIC_IDS.has(defaultTopic) ? defaultTopic : 'society');

    const entities = uniqueStrings(raw.entities).map(text => truncate(text, 40)).slice(0, 6);

    let intensity = clampInt(raw.intensity, 1, 5, 3);
    const importance = clampInt(raw.importance, 1, 5, 2);
    const sourceHeat = clampInt(raw.sourceHeat, 1, 5, intensity);
    const graphic = raw.graphic === true;
    if (graphic && intensity < 4) intensity = 4;

    // "Known" means several outlets agree, so it needs at least two articles. Everything is grounded and short.
    const listOf = (value, max) => uniqueStrings(value).map(text => truncate(text, 200)).filter(grounded).slice(0, max);
    const known = members.length >= 2 ? listOf(raw.known, 4) : [];
    const claimed = listOf(raw.claimed, 3);
    const unknown = listOf(raw.unknown, 3);
    let whatsNew = truncate(raw.whatsNew, 200);
    if (!grounded(whatsNew)) whatsNew = '';

    const framing = [];
    if (members.length >= 2 && Array.isArray(raw.framing)) {
        const used = new Set();
        for (const entry of raw.framing) {
            const n = entry && Number.isInteger(entry.n) ? entry.n : -1;
            const note = entry && typeof entry.note === 'string' ? truncate(entry.note, 180) : '';
            if (n < 0 || n >= members.length || used.has(n) || !note || !grounded(note)) continue;
            used.add(n);
            framing.push({ sourceId: members[n].sourceId, source: members[n].sourceName, note });
            if (framing.length === 4) break;
        }
    }

    return { headline, oneLiner, bullets, whyItMatters, calmSummary, contested, topics, entities, intensity, importance, sourceHeat, graphic, known, claimed, unknown, whatsNew, framing };
}

module.exports = { sanitizeEnrichment, ungroundedNumbers, numberTokens };
