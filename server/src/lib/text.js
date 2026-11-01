const crypto = require('crypto');

function sha1(value, length = 12) {
    return crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, length);
}

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>' };

function stripHtml(value) {
    return String(value || '')
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&(nbsp|amp|quot|#39|apos|lt|gt);/g, m => ENTITIES[m])
        .replace(/\s+/g, ' ')
        .trim();
}

function wordCount(value) {
    const matches = String(value || '').match(/[\p{L}\p{N}]+/gu);
    return matches ? matches.length : 0;
}

// ~200 words per minute.
const WORDS_PER_SECOND = 3.3;

function readSeconds(value, extra = 0) {
    return Math.max(1, Math.round(wordCount(value) / WORDS_PER_SECOND)) + extra;
}

const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref'];

function normalizeUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        url.hash = '';
        TRACKING_PARAMS.forEach(param => url.searchParams.delete(param));
        const text = url.toString();
        return text.endsWith('/') ? text.slice(0, -1) : text;
    } catch {
        return null;
    }
}

// Lowercase, drop Hebrew niqqud and punctuation, collapse whitespace.
function normalizeTitle(value) {
    return String(value || '')
        .replace(/[֑-ׇ]/g, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function truncate(value, max) {
    const text = String(value || '').trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + '…';
}

// Run `fn` over `list` with at most `limit` in flight. Never rejects: failures
// come back as { error } so one bad item cannot sink a whole batch.
async function mapPool(list, limit, fn) {
    const results = new Array(list.length);
    let next = 0;
    async function worker() {
        while (next < list.length) {
            const index = next++;
            try {
                results[index] = { value: await fn(list[index], index) };
            } catch (error) {
                results[index] = { error };
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
    return results;
}

module.exports = { sha1, stripHtml, wordCount, readSeconds, normalizeUrl, normalizeTitle, truncate, mapPool };
